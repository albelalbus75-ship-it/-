import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RewardsView } from './components/RewardsView';
import { ViolationsView } from './components/ViolationsView';
import { ExtraWorkView } from './components/ExtraWorkView';
import { PerformanceView } from './components/PerformanceView';
import { EmployeeStatementView } from './components/EmployeeStatementView';
import { EmployeesView } from './components/EmployeesView';
import { SettingsView } from './components/SettingsView';
import { AuditLogView } from './components/AuditLogView';
import { EmpSummaryReportView } from './components/EmpSummaryReportView';
import { GeneralStatsView } from './components/GeneralStatsView';
import { UsersView } from './components/UsersView';
import { ImportDataView } from './components/ImportDataView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AccessDenied } from './components/AccessDenied';
import { ScreenKey } from './types/database';

export function AppContent() {
  const { currentUser, canAccessScreen } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [initialRewardModal, setInitialRewardModal] = useState<boolean>(false);
  const [initialViolationModal, setInitialViolationModal] = useState<boolean>(false);
  const [statementEmpId, setStatementEmpId] = useState<number | undefined>(undefined);

  // If user is not logged in, render the login screen
  if (!currentUser) {
    return <LoginView />;
  }

  // Map each tab to its underlying screen permission key
  const tabToScreenMap: Record<string, { screen: ScreenKey; title: string }> = {
    dashboard: { screen: 'dashboard', title: 'لوحة التحكم' },
    employees: { screen: 'employees', title: 'الموظفين' },
    rewards: { screen: 'rewards', title: 'الحوافز والمكافآت' },
    extra_work: { screen: 'rewards', title: 'العمل الإضافي' },
    evaluations: { screen: 'reports', title: 'التقييم الشهري' },
    violations: { screen: 'violations', title: 'المخالفات' },
    summary_report: { screen: 'reports', title: 'تقرير الأداء' },
    general_stats: { screen: 'reports', title: 'الإحصائيات' },
    statement: { screen: 'reports', title: 'كشف حساب موظف' },
    users: { screen: 'users', title: 'إدارة المستخدمين والصلاحيات' },
    import_data: { screen: 'imports', title: 'استيراد البيانات' },
    settings: { screen: 'settings', title: 'إعدادات النظام وقاعدة البيانات' },
    audit: { screen: 'settings', title: 'سجل العمليات والتدقيق' },
  };

  // Auto-select first permitted tab only on initial login or account switch
  const prevUserIdRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (prevUserIdRef.current !== currentUser.UserID) {
        prevUserIdRef.current = currentUser.UserID;
        const currentMeta = tabToScreenMap[activeTab];
        if (!currentMeta || !canAccessScreen(currentMeta.screen)) {
          const firstAllowed = Object.entries(tabToScreenMap).find(([_, meta]) =>
            canAccessScreen(meta.screen)
          );
          if (firstAllowed) {
            setActiveTab(firstAllowed[0]);
          }
        }
      }
    } else {
      prevUserIdRef.current = null;
    }
  }, [currentUser, canAccessScreen]);

  const handleOpenNewReward = () => {
    setInitialRewardModal(true);
    setActiveTab('rewards');
  };

  const handleOpenNewViolation = () => {
    setInitialViolationModal(true);
    setActiveTab('violations');
  };

  const handleSelectEmployeeStatement = (empId: number) => {
    setStatementEmpId(empId);
    setActiveTab('statement');
  };

  // Check current tab permission
  const activeMeta = tabToScreenMap[activeTab];
  const isAllowed = activeMeta ? canAccessScreen(activeMeta.screen) : true;

  const { isDark, currentTheme } = useTheme();

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden font-['Cairo',sans-serif] transition-colors duration-300 ${
        isDark ? 'bg-[#080c14] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Header with Permission-Filtered Navigation, Bottom Mobile Nav & Hamburger Menu */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewReward={handleOpenNewReward}
        onOpenNewViolation={handleOpenNewViolation}
      />

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Main Content Workspace Container */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 xl:pb-8 overflow-x-hidden">
        {!isAllowed ? (
          <AccessDenied
            screenTitle={activeMeta?.title}
            onGoBack={() => {
              const firstAllowed = Object.entries(tabToScreenMap).find(([_, meta]) =>
                canAccessScreen(meta.screen)
              );
              if (firstAllowed) setActiveTab(firstAllowed[0]);
            }}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                setActiveTab={setActiveTab}
                onOpenNewReward={handleOpenNewReward}
                onOpenNewViolation={handleOpenNewViolation}
                onSelectEmployeeStatement={handleSelectEmployeeStatement}
              />
            )}
            {activeTab === 'employees' && <EmployeesView />}
            {activeTab === 'rewards' && (
              <RewardsView initialOpenModal={initialRewardModal} />
            )}
            {activeTab === 'extra_work' && <ExtraWorkView />}
            {activeTab === 'evaluations' && <PerformanceView />}
            {activeTab === 'violations' && (
              <ViolationsView initialOpenModal={initialViolationModal} />
            )}
            {activeTab === 'summary_report' && (
              <EmpSummaryReportView onSelectEmployeeStatement={handleSelectEmployeeStatement} />
            )}
            {activeTab === 'general_stats' && <GeneralStatsView />}
            {activeTab === 'statement' && (
              <EmployeeStatementView initialEmpId={statementEmpId} />
            )}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'import_data' && <ImportDataView />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'audit' && <AuditLogView />}
          </>
        )}
      </main>

      {/* Corporate footer (No-print) */}
      <footer
        className={`no-print mt-12 border-t py-6 pb-24 xl:pb-6 text-center text-xs transition-colors w-full max-w-full overflow-x-hidden ${
          isDark
            ? 'border-slate-800 bg-[#0b1120] text-slate-400'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>مجموعة البحري التجارية - نظام إدارة الحوافز والمكافآت والجزاءات</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="font-semibold text-amber-500">السمة: {currentTheme.name}</span>
            <span className="font-mono text-[11px] text-slate-400">الإصدار 1.0.0 (نظام المزامنة والسمات الفاخرة)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

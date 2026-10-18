import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { ScreenKey } from '../types/database';
import {
  Building2,
  KeyRound,
  LogOut,
  Check,
  Smartphone,
  ArrowRightLeft,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Award,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Settings,
  Shield,
  PlusCircle,
  History,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AndroidAppModal } from './AndroidAppModal';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { MobileSyncModal } from './MobileSyncModal';
import { useTheme } from '../context/ThemeContext';
import { syncService } from '../services/syncService';

const LOGO_SRC = '/icon.svg';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewReward?: () => void;
  onOpenNewViolation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewReward,
  onOpenNewViolation,
}) => {
  const {
    currentUser,
    switchUser,
    updatePassword,
    logout,
    allUsers,
    selectedBranchFilter,
    setSelectedBranchFilter,
    canAccessScreen,
    hasPermission,
  } = useAuth();

  const { currentTheme, isDark } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const deviceConfig = syncService.getDeviceConfig();

  if (!currentUser) return null;

  const branches = db.getState().branches;
  const isBranchRestricted =
    currentUser.RoleID !== 1 &&
    currentUser.UserName.toLowerCase() !== 'admin' &&
    currentUser.BranchID != null;
  const currentBranchName = branches.find((b) => b.BranchID === currentUser.BranchID)?.BranchName;

  const canCreateReward = hasPermission('rewards', 'create');
  const canCreateViolation = hasPermission('violations', 'create');

  // Filter navigation links based on user's view permission for each screen
  const allNavLinks: { id: string; label: string; shortLabel: string; screen: ScreenKey; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', shortLabel: 'الرئيسية', screen: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'employees', label: 'دليل الموظفين', shortLabel: 'الموظفين', screen: 'employees', icon: <Users className="w-4 h-4" /> },
    { id: 'rewards', label: 'الحوافز والمكافآت', shortLabel: 'الحوافز', screen: 'rewards', icon: <Award className="w-4 h-4" /> },
    { id: 'extra_work', label: 'العمل الإضافي', shortLabel: 'الإضافي', screen: 'rewards', icon: <Clock className="w-4 h-4" /> },
    { id: 'evaluations', label: 'التقييم الشهري', shortLabel: 'التقييم', screen: 'reports', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'violations', label: 'سجل المخالفات', shortLabel: 'المخالفات', screen: 'violations', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'summary_report', label: 'تقرير الأداء', shortLabel: 'الأداء', screen: 'reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'general_stats', label: 'الإحصائيات', shortLabel: 'الإحصائيات', screen: 'reports', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'statement', label: 'كشف حساب موظف', shortLabel: 'كشف حساب', screen: 'reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'users', label: 'المستخدمين والصلاحيات', shortLabel: 'المستخدمين', screen: 'users', icon: <Shield className="w-4 h-4" /> },
    { id: 'import_data', label: 'استيراد البيانات', shortLabel: 'الاستيراد', screen: 'imports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'settings', label: 'الإعدادات وقاعدة البيانات', shortLabel: 'الإعدادات', screen: 'settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'audit', label: 'سجل العمليات', shortLabel: 'السجل', screen: 'settings', icon: <History className="w-4 h-4" /> },
  ];

  const navLinks = allNavLinks.filter((link) => canAccessScreen(link.screen));

  // Primary 4 tabs for Fixed Bottom Mobile Navigation Bar
  const primaryMobileIds = ['dashboard', 'employees', 'rewards', 'violations'];
  const bottomBarLinks = navLinks.filter((l) => primaryMobileIds.includes(l.id)).slice(0, 4);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    const ok = updatePassword(newPassword.trim());
    if (ok) {
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordModal(false);
        setNewPassword('');
      }, 1200);
    }
  };

  return (
    <>
      <header
        className={`no-print border-b sticky top-0 z-30 shadow-xs font-['Cairo',sans-serif] transition-colors w-full max-w-full ${
          isDark
            ? 'bg-[#0b1120] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 h-14 sm:h-16 w-full">
          {/* Right section (RTL): Hamburger button on mobile + Wordmark */}
          <div className="flex items-center gap-2 min-w-0 flex-1 xl:flex-initial">
            <button
              type="button"
              onClick={() => setShowMobileDrawer(true)}
              aria-label="فتح القائمة الجانبية"
              className={`xl:hidden p-2 rounded-lg border shrink-0 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <img
              src={LOGO_SRC}
              alt="مجموعة البحري"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span
              onClick={() => {
                if (canAccessScreen('dashboard')) {
                  setActiveTab('dashboard');
                } else if (navLinks[0]) {
                  setActiveTab(navLinks[0].id);
                }
              }}
              className={`text-sm sm:text-lg font-bold tracking-tight truncate cursor-pointer transition-colors ${
                isDark ? 'text-white hover:text-amber-400' : 'text-slate-900 hover:text-blue-900'
              }`}
            >
              مجموعة البحري - نظام الحوافز
            </span>
          </div>

          {/* Desktop Navigation links - hidden on mobile/tablet (< xl) */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium overflow-x-auto py-1">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-900 text-white'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Left section (RTL): Compact Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Luxury Theme Button */}
            <button
              onClick={() => setShowThemeModal(true)}
              title="سمات التصميم الفاخرة العصرية"
              className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
              }`}
            >
              <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500" />
              <span className="hidden md:inline">السمات</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0 hidden sm:inline-block"
                style={{ backgroundColor: currentTheme.colors.primary }}
              />
            </button>

            {/* Quick Mobile Sync Button */}
            <button
              onClick={() => setShowSyncModal(true)}
              title="مزامنة الجوالين الرئيسي والفرعي"
              className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                deviceConfig.deviceRole === 'MASTER'
                  ? isDark
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                  : isDark
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span className="hidden lg:inline">مزامنة الجوالين</span>
              <span className="hidden sm:inline text-[10px] font-mono px-1 py-0.2 bg-black/20 rounded">
                {deviceConfig.deviceRole === 'MASTER' ? '👑 رئيسي' : '📱 فرعي'}
              </span>
            </button>

            {/* Desktop PWA Install Button */}
            <div className="hidden md:block">
              <PWAInstallButton />
            </div>

            {/* Branch Selector Filter (Desktop) */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {isBranchRestricted ? (
                <span className="font-semibold truncate max-w-[110px]">{currentBranchName || 'فرع محدد'}</span>
              ) : (
                <select
                  value={selectedBranchFilter === null ? '' : selectedBranchFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBranchFilter(val === '' ? null : Number(val));
                  }}
                  className="bg-transparent font-medium focus:outline-hidden cursor-pointer max-w-[130px]"
                >
                  <option value="" className="text-slate-900">كافة الفروع (الكل)</option>
                  {branches.map((b) => (
                    <option key={b.BranchID} value={b.BranchID} className="text-slate-900">
                      {b.BranchName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* User Dropdown / Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                  {currentUser.UserName.substring(0, 1).toUpperCase()}
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold leading-tight truncate max-w-[100px]">
                    {currentUser.FullName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentUser.Role}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="fixed sm:absolute left-2.5 sm:left-0 top-16 sm:top-auto sm:mt-2 w-[92vw] max-w-[290px] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-3 z-50 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">المستخدم الحالي:</span>
                      <div className="font-bold text-slate-900">{currentUser.FullName}</div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {currentUser.UserName} • الدور: {currentUser.Role}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Switch Account Quick Links */}
                  <div className="mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                      تبديل الحساب السريع (للاختبار):
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {allUsers.map((u) => (
                        <button
                          key={u.UserID}
                          onClick={() => {
                            switchUser(u.UserID);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-right transition-colors cursor-pointer ${
                            u.UserID === currentUser.UserID
                              ? 'bg-blue-50 text-blue-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{u.FullName}</span>
                          <span className="font-mono text-[9px] text-slate-400 mr-2">{u.Role}</span>
                        </button>
                      ))}
                    </div>

                    {!canAccessScreen('users') && (
                      <button
                        onClick={() => {
                          setActiveTab('users');
                          setShowUserMenu(false);
                        }}
                        className="w-full mt-2 flex items-center justify-between px-2 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer text-[11px]"
                      >
                        <span className="font-semibold">اختبار فتح شاشة المستخدمين</span>
                        <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded font-sans">
                          محظور
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowThemeModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer font-bold text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>سمات فاخرة عصرية (Luxury)</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSyncModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer font-bold text-xs"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                      <span>مزامنة الجوالين (رئيسي ↔ فرعي)</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAndroidModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer font-bold text-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تطبيق Android (تصدير وتثبيت)</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowPasswordModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>تغيير كلمة المرور</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Persistent Quick Actions Bar (صرف حافز جديد، تسجيل مخالفة، تثبيت التطبيق) */}
        <div
          className={`xl:hidden px-3 py-2 border-t grid grid-cols-3 gap-1.5 w-full max-w-full ${
            isDark ? 'border-slate-800 bg-[#090e1a]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          {canCreateReward && onOpenNewReward ? (
            <button
              type="button"
              onClick={onOpenNewReward}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-colors truncate shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">صرف حافز جديد</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('rewards')}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-colors truncate"
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">سجل الحوافز</span>
            </button>
          )}

          {canCreateViolation && onOpenNewViolation ? (
            <button
              type="button"
              onClick={onOpenNewViolation}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors truncate shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">تسجيل مخالفة</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('violations')}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors truncate"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">المخالفات</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAndroidModal(true)}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors truncate shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">تثبيت التطبيق</span>
          </button>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar on Mobile (< xl) */}
      <nav
        aria-label="التنقل السفلي للجوال"
        className={`no-print xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg font-['Cairo',sans-serif] w-full max-w-full ${
          isDark
            ? 'bg-[#0b1120]/95 border-slate-800 text-slate-200 backdrop-blur-md'
            : 'bg-white/95 border-slate-200 text-slate-700 backdrop-blur-md'
        }`}
      >
        <div className="grid grid-cols-5 items-center h-16 px-1 w-full max-w-md mx-auto">
          {bottomBarLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => setActiveTab(link.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-colors cursor-pointer min-w-0 ${
                  isActive
                    ? isDark
                      ? 'text-amber-400 font-bold'
                      : 'text-blue-700 font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div
                  className={`p-1 rounded-md ${
                    isActive
                      ? isDark
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-50 text-blue-700'
                      : ''
                  }`}
                >
                  {link.icon}
                </div>
                <span className="text-[11px] leading-none truncate max-w-full">
                  {link.shortLabel}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: Full Slide-Over Menu Trigger ("المزيد / القائمة") */}
          <button
            type="button"
            onClick={() => setShowMobileDrawer(true)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-colors cursor-pointer min-w-0 ${
              showMobileDrawer
                ? 'text-amber-400 font-bold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="p-1 rounded-md">
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[11px] leading-none truncate max-w-full">القائمة</span>
          </button>
        </div>
      </nav>

      {/* Slide-Over Mobile Navigation Drawer (قائمة همبرغر منزلقة) */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2.5 font-['Cairo',sans-serif]">
          <div
            className={`w-[95vw] max-w-[380px] max-h-[90vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
              isDark
                ? 'bg-[#0b1120] border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={LOGO_SRC}
                  alt="مجموعة البحري"
                  className="w-8 h-8 rounded-full object-contain shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">القائمة الرئيسية والتنقل</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {currentUser.FullName} ({currentUser.Role})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileDrawer(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Branch Filter inside Mobile Drawer */}
              <div>
                <label className="text-xs font-bold block mb-1.5 text-slate-400">
                  تصفية حسب الفرع:
                </label>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                    isDark
                      ? 'bg-slate-800/90 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                  {isBranchRestricted ? (
                    <span className="font-semibold">{currentBranchName || 'فرع محدد'}</span>
                  ) : (
                    <select
                      value={selectedBranchFilter === null ? '' : selectedBranchFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBranchFilter(val === '' ? null : Number(val));
                      }}
                      className="w-full bg-transparent font-semibold focus:outline-hidden cursor-pointer"
                    >
                      <option value="" className="text-slate-900">كافة الفروع (الكل)</option>
                      {branches.map((b) => (
                        <option key={b.BranchID} value={b.BranchID} className="text-slate-900">
                          {b.BranchName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Important Quick Actions inside Drawer */}
              <div>
                <span className="text-xs font-bold block mb-2 text-slate-400">
                  الإجراءات السريعة:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {canCreateReward && onOpenNewReward && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileDrawer(false);
                        onOpenNewReward();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        <span>صرف حافز جديد</span>
                      </span>
                      <span className="text-[10px] bg-black/15 px-2 py-0.5 rounded">إجراء سريع</span>
                    </button>
                  )}

                  {canCreateViolation && onOpenNewViolation && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileDrawer(false);
                        onOpenNewViolation();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>تسجيل مخالفة إدارية</span>
                      </span>
                      <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded">إجراء سريع</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileDrawer(false);
                      setShowAndroidModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span>تثبيت التطبيق وحزمة Android</span>
                    </span>
                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded">APK / PWA</span>
                  </button>
                </div>
              </div>

              {/* All Navigation Screens */}
              <div>
                <span className="text-xs font-bold block mb-2 text-slate-400">
                  شاشات وأقسام النظام ({navLinks.length}):
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {navLinks.map((link) => {
                    const isActive = activeTab === link.id;
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(link.id);
                          setShowMobileDrawer(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          isActive
                            ? isDark
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-slate-900 text-white'
                            : isDark
                            ? 'text-slate-200 hover:bg-slate-800'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {link.icon}
                          <span>{link.label}</span>
                        </span>
                        {isActive && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMobileDrawer(false);
                  logout();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMobileDrawer(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                إغلاق القائمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 font-['Cairo',sans-serif]">
          <div className="bg-white text-slate-900 rounded-xl shadow-xl w-[95vw] max-w-sm p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">تغيير كلمة المرور</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              أدخل كلمة المرور الجديدة للحساب:{' '}
              <span className="font-semibold text-slate-800">{currentUser.UserName}</span>
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-800 rounded text-xs border border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم حفظ كلمة المرور الجديدة بنجاح</span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Android Center & Screen Preview Modal */}
      <AndroidAppModal isOpen={showAndroidModal} onClose={() => setShowAndroidModal(false)} />

      {/* Luxury Theme Selector Modal */}
      <ThemeSelectorModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />

      {/* Mobile Sync Modal between Primary and Secondary Phones */}
      <MobileSyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </>
  );
};

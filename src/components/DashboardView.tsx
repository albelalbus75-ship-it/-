import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import {
  Award,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  PlusCircle,
  Users,
  ChevronLeft,
  Smartphone,
} from 'lucide-react';
import { AndroidAppModal } from './AndroidAppModal';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onOpenNewReward: () => void;
  onOpenNewViolation: () => void;
  onSelectEmployeeStatement: (empId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenNewReward,
  onOpenNewViolation,
  onSelectEmployeeStatement,
}) => {
  const { selectedBranchFilter, hasPermission, canAccessScreen } = useAuth();
  const [showAndroidModal, setShowAndroidModal] = React.useState(false);
  const dbState = db.getState();

  const canCreateReward = hasPermission('rewards', 'create');
  const canCreateViolation = hasPermission('violations', 'create');
  const canViewReports = canAccessScreen('reports');
  const allRewards = db.getRewardsWithDetails();
  const allViolations = db.getViolationsWithDetails();
  const allExtraWork = db.getExtraWorkWithDetails();
  const allEmployees = db.getEmployeesWithDetails();

  // Direct SQLite View: qryStats (access_queries.sql)
  const qryStatsData = db.qryStats();

  // Filter by branch if selected
  const rewards = selectedBranchFilter
    ? allRewards.filter((r) => r.BranchID === selectedBranchFilter)
    : allRewards;
  const violations = selectedBranchFilter
    ? allViolations.filter((v) => {
        const emp = allEmployees.find((e) => e.EmpID === v.EmpID);
        return emp?.BranchID === selectedBranchFilter;
      })
    : allViolations;
  const extraWork = selectedBranchFilter
    ? allExtraWork.filter((w) => w.BranchID === selectedBranchFilter)
    : allExtraWork;
  const employees = selectedBranchFilter
    ? allEmployees.filter((e) => e.BranchID === selectedBranchFilter)
    : allEmployees;

  // Quantitative Metrics Calculation strictly separated by currency
  const rewardsByCurrency: Record<string, number> = {};
  rewards
    .filter((r) => r.Status === 'Approved')
    .forEach((r) => {
      const c = r.currencyCode || 'YER';
      rewardsByCurrency[c] = (rewardsByCurrency[c] || 0) + r.Amount;
    });

  const totalRewardPoints = rewards
    .filter((r) => r.Status === 'Approved')
    .reduce((sum, r) => sum + r.Points, 0);

  const penaltiesByCurrency: Record<string, number> = {};
  violations
    .filter((v) => v.Status === 'Confirmed')
    .forEach((v) => {
      penaltiesByCurrency['YER'] = (penaltiesByCurrency['YER'] || 0) + v.PenaltyAmount;
    });

  const overtimeByCurrency: Record<string, number> = {};
  extraWork
    .filter((w) => w.Status === 'Approved')
    .forEach((w) => {
      overtimeByCurrency['YER'] = (overtimeByCurrency['YER'] || 0) + w.Amount;
    });

  const totalOvertimeHours = extraWork
    .filter((w) => w.Status === 'Approved')
    .reduce((sum, w) => sum + w.Hours, 0);

  // Net payable per currency
  const allActiveCurrencies = Array.from(
    new Set([...Object.keys(rewardsByCurrency), ...Object.keys(penaltiesByCurrency), ...Object.keys(overtimeByCurrency)])
  );

  // Active employees count
  const activeEmployeesCount = employees.filter((e) => e.IsActive === 1).length;

  // Department Rewards Breakdown
  const deptBreakdown = dbState.departments.map((dept) => {
    const deptEmpIds = allEmployees.filter((e) => e.DeptID === dept.DeptID).map((e) => e.EmpID);
    const deptRewards = rewards
      .filter((r) => deptEmpIds.includes(r.EmpID) && r.Status === 'Approved')
      .reduce((sum, r) => sum + r.Amount, 0);
    return {
      deptName: dept.DeptName,
      amount: deptRewards,
    };
  }).sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            نظام إدارة الحوافز والمكافآت والجزاءات
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            لوحة الإشراف والمتابعة المركزية
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAndroidModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            title="تثبيت أو تصدير تطبيق الأندرويد لجميع الشاشات"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>تطبيق Android (تصدير وتثبيت)</span>
          </button>
          {canViewReports && (
            <button
              onClick={() => setActiveTab('summary_report')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4 text-blue-700" />
              <span>تقرير الأداء (qryRptEmpPerf)</span>
            </button>
          )}
          {canViewReports && (
            <button
              onClick={() => setActiveTab('general_stats')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
            >
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>الإحصائيات (qryStats)</span>
            </button>
          )}
          {canCreateReward && (
            <button
              onClick={onOpenNewReward}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>صرف حافز جديد</span>
            </button>
          )}
          {canCreateViolation && (
            <button
              onClick={onOpenNewViolation}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>تسجيل مخالفة</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Approved Rewards */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>إجمالي الحوافز المعتمدة</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-1">
            {Object.keys(rewardsByCurrency).length > 0 ? (
              Object.entries(rewardsByCurrency).map(([curr, val]) => (
                <div key={curr} className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    {val.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-600 font-medium font-sans">{curr}</span>
                </div>
              ))
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">0</span>
                <span className="text-xs text-slate-600 font-medium font-sans">YER</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>إجمالي النقاط:</span>
            <span className="font-mono tabular-nums font-semibold text-blue-700">{totalRewardPoints} نقطة</span>
          </div>
        </div>

        {/* Total Penalties & Deductions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>إجمالي الخصومات والجزاءات</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="space-y-1">
            {Object.keys(penaltiesByCurrency).length > 0 ? (
              Object.entries(penaltiesByCurrency).map(([curr, val]) => (
                <div key={curr} className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-700 font-mono tabular-nums">
                    {val.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-600 font-medium font-sans">{curr}</span>
                </div>
              ))
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-700 font-mono tabular-nums">0</span>
                <span className="text-xs text-slate-600 font-medium font-sans">YER</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>عدد المخالفات:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800">{violations.length} مخالفة</span>
          </div>
        </div>

        {/* Overtime Value & Hours */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>بدل العمل الإضافي المعتمد</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            {Object.keys(overtimeByCurrency).length > 0 ? (
              Object.entries(overtimeByCurrency).map(([curr, val]) => (
                <div key={curr} className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    {val.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-600 font-medium font-sans">{curr}</span>
                </div>
              ))
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">0</span>
                <span className="text-xs text-slate-600 font-medium font-sans">YER</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>إجمالي الساعات:</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-700">{totalOvertimeHours} ساعة</span>
          </div>
        </div>

        {/* Net Incentive Payable & Active Employees */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 bg-linear-to-b from-white to-slate-50/60">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>صافي استحقاق الحوافز</span>
            <TrendingUp className="w-4 h-4 text-slate-900" />
          </div>
          <div className="space-y-1">
            {allActiveCurrencies.length > 0 ? (
              allActiveCurrencies.map((curr) => {
                const rVal = rewardsByCurrency[curr] || 0;
                const pVal = penaltiesByCurrency[curr] || 0;
                const oVal = overtimeByCurrency[curr] || 0;
                const net = rVal + oVal - pVal;
                return (
                  <div key={curr} className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {net.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-600 font-medium font-sans">{curr}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">0</span>
                <span className="text-xs text-slate-600 font-medium font-sans">YER</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>الموظفون النشطون:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800">{activeEmployeesCount} موظف</span>
          </div>
        </div>
      </div>

      {/* qryStats Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-700 text-white rounded font-mono font-bold text-[10px]">
                SQLite View
              </span>
              <h2 className="text-sm font-bold text-slate-900 font-mono">qryStats</h2>
              <span className="text-xs text-slate-500">الملخص الشهري للحوافز والمخالفات</span>
            </div>
            <p className="text-xs text-slate-500">
              بيانات ملخصة ومجمعة شهرياً من استعلام SQLite المعتمد
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('general_stats')}
              className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الإحصائيات الشاملة</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">الشهر (YearMonth)</th>
                <th className="py-3 px-4 font-semibold text-center">المستفيدين</th>
                <th className="py-3 px-4 font-semibold text-center">عدد الحوافز</th>
                <th className="py-3 px-4 font-semibold text-left">مبلغ الحوافز</th>
                <th className="py-3 px-4 font-semibold text-center">إجمالي النقاط</th>
                <th className="py-3 px-4 font-semibold text-center">المخالفات</th>
                <th className="py-3 px-4 font-semibold text-left">مبلغ الجزاءات</th>
                <th className="py-3 px-4 font-semibold text-left">الصافي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qryStatsData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    لا توجد سجلات شهرية حالياً في qryStats
                  </td>
                </tr>
              ) : (
                qryStatsData.map((st) => {
                  const net = st.RewardsAmount - st.ViolationsAmount;
                  return (
                    <tr key={st.YearMonth} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {st.YearMonth}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono tabular-nums font-semibold text-slate-800">
                          {st.EmployeesWithRewards}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono tabular-nums font-semibold text-blue-700">
                          {st.RewardsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                        {st.RewardsAmount.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-500 font-sans font-normal">YER</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono tabular-nums font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {st.TotalPoints}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono tabular-nums font-semibold ${st.ViolationsCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                          {st.ViolationsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums font-bold text-red-700">
                        {st.ViolationsAmount.toLocaleString()}{' '}
                        <span className="text-[10px] text-red-900 font-sans font-normal">YER</span>
                      </td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums font-bold">
                        <span className={net >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {net.toLocaleString()}{' '}
                          <span className="text-[10px] font-sans font-normal text-slate-500">YER</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Rewards List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">أحدث حوافز ومكافآت الموظفين</h3>
                <span className="text-xs text-slate-500">آخر العمليات المضافة للنظام</span>
              </div>
              <button
                onClick={() => setActiveTab('rewards')}
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">الموظف</th>
                    <th className="py-2.5 px-4 font-semibold">الفرع</th>
                    <th className="py-2.5 px-4 font-semibold">البيان</th>
                    <th className="py-2.5 px-4 font-semibold text-left">المبلغ</th>
                    <th className="py-2.5 px-4 font-semibold">الحالة</th>
                    <th className="py-2.5 px-4 font-semibold text-center">كشف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rewards.slice(0, 5).map((r) => (
                    <tr key={r.RewardID} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.empName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.empCode}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.branchName}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 line-clamp-1">{r.rewardDesc}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                          {r.Points} نقطة • {r.RewardDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                        {r.Amount.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">{r.currencyCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-semibold ${
                            r.Status === 'Approved'
                              ? 'text-emerald-700'
                              : r.Status === 'Pending'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {r.Status === 'Approved' ? 'معتمد' : r.Status === 'Pending' ? 'معلق' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectEmployeeStatement(r.EmpID)}
                          title="عرض كشف الحساب"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rewards.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        لا توجد حوافز مسجلة حتى الآن
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Violations Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">أحدث المخالفات والجزاءات الإدارية</h3>
                <span className="text-xs text-slate-500">سجل الانضباط والقرارات الصادرة</span>
              </div>
              <button
                onClick={() => setActiveTab('violations')}
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">الموظف</th>
                    <th className="py-2.5 px-4 font-semibold">نوع المخالفة</th>
                    <th className="py-2.5 px-4 font-semibold">الإجراء المتخذ</th>
                    <th className="py-2.5 px-4 font-semibold text-left">مبلغ الخصم</th>
                    <th className="py-2.5 px-4 font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {violations.slice(0, 4).map((v) => (
                    <tr key={v.ViolationID} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.empName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{v.empCode}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{v.violationName}</td>
                      <td className="py-3 px-4 text-slate-700">{v.actionName}</td>
                      <td className="py-3 px-4 text-left font-mono tabular-nums font-bold text-red-700">
                        {v.PenaltyAmount > 0 ? `${v.PenaltyAmount.toLocaleString()} ريال` : 'إنذار شفهي'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono tabular-nums">{v.ViolationDate}</td>
                    </tr>
                  ))}
                  {violations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        لا توجد مخالفات مسجلة حتى الآن
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Departmental Allocation & Fast Shortcuts */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">توزيع الحوافز حسب الأقسام</h3>
            <p className="text-xs text-slate-500 mb-4">الحوافز المعتمدة للأقسام</p>
            <div className="space-y-3">
              {deptBreakdown.length > 0 ? (
                deptBreakdown.map((item, idx) => {
                  const maxAmount = deptBreakdown[0]?.amount || 1;
                  const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{item.deptName}</span>
                        <span className="font-mono tabular-nums text-slate-600 font-semibold">
                          {item.amount.toLocaleString()} ريال
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-800 rounded-full transition-all"
                          style={{ width: `${Math.max(percentage, item.amount > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-4">
                  لا توجد أقسام مدخلة حتى الآن
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-xl">
            <h3 className="text-sm font-bold mb-2">روابط سريعة للمنظومة</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              إدارة كشوفات حسابات الموظفين وسجل بيانات الكادر الإداري
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('statement')}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>كشف حساب موظف (سندات وطباعة)</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>دليل وإدارة الموظفين</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Android Center & Screen Preview Modal */}
      <AndroidAppModal isOpen={showAndroidModal} onClose={() => setShowAndroidModal(false)} />
    </div>
  );
};

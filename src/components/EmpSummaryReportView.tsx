import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { Search, Printer, Download, ArrowUpDown } from 'lucide-react';

interface EmpSummaryReportViewProps {
  onSelectEmployeeStatement: (empId: number) => void;
}

export const EmpSummaryReportView: React.FC<EmpSummaryReportViewProps> = ({ onSelectEmployeeStatement }) => {
  const { currentUser, selectedBranchFilter, hasPermission } = useAuth();
  const dbState = db.getState();
  const branches = dbState.branches;

  const canExport = hasPermission('reports', 'export');
  const canPrint = hasPermission('reports', 'print');

  const [selectedBranch, setSelectedBranch] = useState<number | null>(
    currentUser && currentUser.Role !== 'Admin' && currentUser.BranchID ? currentUser.BranchID : selectedBranchFilter
  );
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'violations_then_points' | 'points' | 'rewards' | 'penalties' | 'name'>('violations_then_points');

  // Dynamic departments based on branch selection
  const departments = selectedBranch
    ? db.getDepartmentsByBranch(selectedBranch)
    : dbState.departments;

  // Data retrieved directly from SQLite View: qryRptEmpPerf (access_queries.sql)
  const perfData = db.qryRptEmpPerf({
    branchId: selectedBranch,
    deptId: selectedDept,
    month: selectedMonth || null,
    search: searchTerm,
  });

  const sorted = [...perfData].sort((a, b) => {
    if (sortBy === 'violations_then_points') {
      if (b.VioCount !== a.VioCount) {
        return b.VioCount - a.VioCount; // Highest violations first
      }
      return b.Points - a.Points; // Then highest points
    }
    if (sortBy === 'points') return b.Points - a.Points;
    if (sortBy === 'rewards') return b.RewAmt - a.RewAmt;
    if (sortBy === 'penalties') return b.VioAmt - a.VioAmt;
    if (sortBy === 'name') return a.FullName.localeCompare(b.FullName, 'ar');
    return 0;
  });

  const handlePrint = () => {
    window.print();
  };

  const exportCsv = () => {
    const headers = ['كود الموظف', 'اسم الموظف', 'الفرع', 'القسم', 'المسمى', 'عدد المخالفات (VioCount)', 'إجمالي الخصومات (VioAmt)', 'عدد الحوافز (RewCount)', 'إجمالي الحوافز (RewAmt)', 'النقاط (Points)'];
    const rows = sorted.map((item) => [
      item.EmpCode,
      `"${item.FullName}"`,
      `"${item.BranchName}"`,
      `"${item.DeptName}"`,
      `"${item.JobTitle || ''}"`,
      item.VioCount,
      item.VioAmt,
      item.RewCount,
      item.RewAmt,
      item.Points,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qryRptEmpPerf_summary_${selectedMonth || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">تقرير الأداء الشامل (qryRptEmpPerf)</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            تقرير ملخص أداء ومكافآت الموظفين
          </h1>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          {canExport && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          )}
          {canPrint && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {currentUser && currentUser.Role === 'Admin' && (
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
              <span className="text-slate-500 font-medium shrink-0">الفرع:</span>
              <select
                value={selectedBranch === null ? '' : selectedBranch}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  setSelectedBranch(val);
                  setSelectedDept(null);
                }}
                className="w-full sm:w-auto px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-800"
              >
                <option value="">كافة الفروع</option>
                {branches.map((b) => (
                  <option key={b.BranchID} value={b.BranchID}>
                    {b.BranchName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <span className="text-slate-500 font-medium shrink-0">القسم:</span>
            <select
              value={selectedDept === null ? '' : selectedDept}
              onChange={(e) => setSelectedDept(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full sm:w-auto px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-800"
            >
              <option value="">كافة الأقسام</option>
              {departments.map((d) => (
                <option key={d.DeptID} value={d.DeptID}>
                  {d.DeptName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <span className="text-slate-500 font-medium shrink-0">الشهر:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
            />
          </div>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالموظف..."
              className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-800"
            >
              <option value="violations_then_points">الأكثر مخالفات ثم الأكثر نقاطاً</option>
              <option value="points">الأعلى نقاط حوافز</option>
              <option value="rewards">الأعلى مبلغ حوافز</option>
              <option value="penalties">الأعلى مبلغ جزاءات</option>
              <option value="name">أبجدياً بالاسم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Report (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {sorted.map((item) => (
            <div key={item.EmpID} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.FullName}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {item.EmpCode} {item.JobTitle ? `• ${item.JobTitle}` : ''}
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs">
                  {item.Points} نقطة
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">الفرع / القسم:</span>
                  <span className="font-medium text-slate-800">{item.BranchName} • {item.DeptName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">الحوافز ({item.RewCount}):</span>
                  <span className="font-mono font-bold text-slate-900">{item.RewAmt.toLocaleString()} YER</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">المخالفات ({item.VioCount}):</span>
                  <span className="font-mono font-bold text-red-700">{item.VioAmt.toLocaleString()} YER</span>
                </div>
              </div>

              <div className="no-print flex justify-end pt-1">
                <button
                  onClick={() => onSelectEmployeeStatement(item.EmpID)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
                >
                  عرض كشف الحساب
                </button>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              لا توجد بيانات موظفين مسجلة في هذا التقرير
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">الموظف (FullName)</th>
                <th className="py-3 px-4 font-semibold">الفرع (BranchName)</th>
                <th className="py-3 px-4 font-semibold">القسم (DeptName)</th>
                <th className="py-3 px-4 font-semibold text-center">المخالفات (VioCount)</th>
                <th className="py-3 px-4 font-semibold text-left">الجزاءات (VioAmt)</th>
                <th className="py-3 px-4 font-semibold text-center">الحوافز (RewCount)</th>
                <th className="py-3 px-4 font-semibold text-left">المكافآت (RewAmt)</th>
                <th className="py-3 px-4 font-semibold text-center">النقاط (Points)</th>
                <th className="no-print py-3 px-4 font-semibold text-center">كشف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((item) => (
                <tr key={item.EmpID} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.FullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.EmpCode} {item.JobTitle ? `• ${item.JobTitle}` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{item.BranchName}</td>
                  <td className="py-3 px-4 text-slate-700">{item.DeptName}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-mono tabular-nums font-bold ${item.VioCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                      {item.VioCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left font-mono tabular-nums font-bold text-red-700">
                    {item.VioAmt > 0 ? (
                      <div>
                        {item.VioAmt.toLocaleString()}{' '}
                        <span className="text-[10px] text-red-900 font-sans font-normal">YER</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">0 YER</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-mono tabular-nums font-bold ${item.RewCount > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                      {item.RewCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                    {item.RewAmt > 0 ? (
                      <div>
                        {item.RewAmt.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-500 font-sans font-normal">YER</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">0 YER</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono tabular-nums font-bold text-blue-700 text-sm">
                      {item.Points}
                    </span>
                  </td>
                  <td className="no-print py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectEmployeeStatement(item.EmpID)}
                      title="عرض كشف الحساب"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                    >
                      كشف الحساب
                    </button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد بيانات موظفين مسجلة في هذا التقرير
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

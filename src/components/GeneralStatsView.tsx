import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { Building2, Award, AlertTriangle, Printer } from 'lucide-react';

export const GeneralStatsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const stats = db.getGeneralStats(selectedYear);
  const canPrint = hasPermission('reports', 'print');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">التقرير التحليلي المقارن (qryStats)</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            الإحصائيات والتحليلات المقارنة
          </h1>
        </div>
        <div className="no-print flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">السنة:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
          {canPrint && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الإحصائيات</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block mb-1">إجمالي الحوافز المعتمدة</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{stats.totalRewardsCount}</span>
            <span className="text-xs text-slate-500 mr-1.5 font-sans">حافز</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block mb-1">إجمالي المخالفات الصادرة</span>
            <span className="text-2xl font-bold text-red-700 font-mono tabular-nums">{stats.totalViolationsCount}</span>
            <span className="text-xs text-slate-500 mr-1.5 font-sans">مخالفة</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block mb-1">عدد الفروع المشمولة</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{stats.branchStats.length}</span>
            <span className="text-xs text-slate-500 mr-1.5 font-sans">فرع</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 1. Branch Comparative Statistics */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">مقارنة فروع المجموعة (Branches Breakdown)</h3>
            <p className="text-xs text-slate-500">
              توزيع الحوافز والخصومات والعمل الإضافي لكل فرع بشكل منفصل
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400">سنة {selectedYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">الفرع</th>
                <th className="py-3 px-4 font-semibold text-center">عدد الحوافز</th>
                <th className="py-3 px-4 font-semibold text-left">مبالغ الحوافز</th>
                <th className="py-3 px-4 font-semibold text-center">عدد المخالفات</th>
                <th className="py-3 px-4 font-semibold text-left">مبالغ الجزاءات</th>
                <th className="py-3 px-4 font-semibold text-center">ساعات الإضافي</th>
                <th className="py-3 px-4 font-semibold text-left">مستحقات الإضافي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.branchStats.map((item) => (
                <tr key={item.branch.BranchID} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{item.branch.BranchName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.branch.BranchCode}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-blue-700">
                    {item.rewardCount}
                  </td>
                  <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                    {Object.keys(item.rewardsByCurr).length > 0 ? (
                      Object.entries(item.rewardsByCurr).map(([curr, val]) => (
                        <div key={curr}>
                          {val.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans font-normal">{curr}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 font-normal">0 YER</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-red-700">
                    {item.violationCount}
                  </td>
                  <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-red-700">
                    {Object.keys(item.penaltiesByCurr).length > 0 ? (
                      Object.entries(item.penaltiesByCurr).map(([curr, val]) => (
                        <div key={curr}>
                          {val.toLocaleString()} <span className="text-[10px] text-red-900 font-sans font-normal">{curr}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 font-normal">0 YER</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono tabular-nums font-semibold text-slate-800">
                    {item.extraHours} ساعة
                  </td>
                  <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-emerald-700">
                    {Object.keys(item.extraByCurr).length > 0 ? (
                      Object.entries(item.extraByCurr).map(([curr, val]) => (
                        <div key={curr}>
                          {val.toLocaleString()} <span className="text-[10px] text-emerald-900 font-sans font-normal">{curr}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 font-normal">0 YER</span>
                    )}
                  </td>
                </tr>
              ))}
              {stats.branchStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد فروع مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Department Comparative Statistics */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">مقارنة الأقسام الإدارية والتشغيلية (Departments Breakdown)</h3>
          <p className="text-xs text-slate-500">حجم الاستحقاقات والجزاءات حسب الأقسام</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">اسم القسم</th>
                <th className="py-3 px-4 font-semibold">الفرع</th>
                <th className="py-3 px-4 font-semibold text-center">عدد الحوافز</th>
                <th className="py-3 px-4 font-semibold text-left">مبالغ الحوافز</th>
                <th className="py-3 px-4 font-semibold text-center">عدد المخالفات</th>
                <th className="py-3 px-4 font-semibold text-left">مبالغ الجزاءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.deptStats.map((item) => (
                <tr key={item.dept.DeptID} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.dept.DeptName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{item.branchName}</td>
                  <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-blue-700">
                    {item.rewardCount}
                  </td>
                  <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                    {Object.keys(item.rewardsByCurr).length > 0 ? (
                      Object.entries(item.rewardsByCurr).map(([curr, val]) => (
                        <div key={curr}>
                          {val.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans font-normal">{curr}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 font-normal">0 YER</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-red-700">
                    {item.violationCount}
                  </td>
                  <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-red-700">
                    {Object.keys(item.penaltiesByCurr).length > 0 ? (
                      Object.entries(item.penaltiesByCurr).map(([curr, val]) => (
                        <div key={curr}>
                          {val.toLocaleString()} <span className="text-[10px] text-red-900 font-sans font-normal">{curr}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 font-normal">0 YER</span>
                    )}
                  </td>
                </tr>
              ))}
              {stats.deptStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لا توجد أقسام مسجلة
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

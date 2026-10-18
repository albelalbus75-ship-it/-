import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { Printer, Award, AlertTriangle, Clock } from 'lucide-react';

const LOGO_SRC = '/icon.svg';

interface EmployeeStatementViewProps {
  initialEmpId?: number;
}

export const EmployeeStatementView: React.FC<EmployeeStatementViewProps> = ({ initialEmpId }) => {
  const { hasPermission } = useAuth();
  const employees = db.getEmployeesWithDetails();
  const [selectedEmpId, setSelectedEmpId] = useState<number>(initialEmpId || employees[0]?.EmpID || 1);
  const [monthFilter, setMonthFilter] = useState<string>('2026-10');

  const canPrint = hasPermission('reports', 'print');

  const statement = db.getEmployeeStatement(selectedEmpId, monthFilter || undefined);
  const companyName = db.getSetting('CompanyName', 'مجموعة البحري التجارية');

  const handlePrint = () => {
    window.print();
  };

  if (employees.length === 0 || !statement || !statement.emp) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
        <Award className="w-12 h-12 mx-auto text-slate-300" />
        <h3 className="text-base font-bold text-slate-700">لا يوجد موظفون لعرض كشف الحساب</h3>
        <p className="text-xs text-slate-500">
          يرجى إضافة فروع وأقسام وموظفين أولاً من تبويب "دليل الموظفين".
        </p>
      </div>
    );
  }

  const {
    emp,
    rewards,
    violations,
    extraWorks,
    totalRewardAmount,
    totalRewardPoints,
    totalOvertimeAmount,
    totalOvertimeHours,
    totalPenalties,
    netPayable,
  } = statement;

  return (
    <div className="space-y-6">
      {/* Top Filter Controls (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-700 block mb-1">اختيار الموظف:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(Number(e.target.value))}
              className="w-full sm:min-w-60 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-800"
            >
              {employees.map((e) => (
                <option key={e.EmpID} value={e.EmpID}>
                  {e.FullName} ({e.EmpCode}) - {e.branchName}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-700 block mb-1">الشهر المستهدف:</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
            />
          </div>
        </div>

        {canPrint && (
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كشف الحساب</span>
          </button>
        )}
      </div>

      {/* Printable Sheet Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-10 shadow-xs text-slate-900 font-['Cairo',sans-serif]">
        {/* Official Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-6 text-center sm:text-right">
          <div className="sm:text-right">
            <div className="text-xs text-slate-500 mb-0.5">الجمهورية اليمنية</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">{companyName}</div>
            <div className="text-xs text-slate-600">إدارة الشؤون المالية والموارد البشرية</div>
            <div className="text-xs text-slate-500 mt-1">
              الفرع: <span className="font-semibold text-slate-800">{emp.branchName}</span> • القسم:{' '}
              <span className="font-semibold text-slate-800">{emp.deptName}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <img
              src={LOGO_SRC}
              alt="شعار مجموعة البحري"
              className="w-16 h-16 rounded-full object-contain border border-slate-300 shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-[10px] tracking-wider font-semibold text-slate-700 mt-1">AL-BAHRI GROUP</span>
          </div>
          <div className="sm:text-left text-xs text-slate-600 space-y-1">
            <div>
              <span className="font-semibold">تاريخ التقرير:</span>{' '}
              <span className="font-mono tabular-nums">{new Date().toISOString().split('T')[0]}</span>
            </div>
            <div>
              <span className="font-semibold">الفترة:</span>{' '}
              <span className="font-mono tabular-nums font-bold text-slate-900">{monthFilter || 'كافة الفترات'}</span>
            </div>
            <div>
              <span className="font-semibold">الرقم الوظيفي:</span>{' '}
              <span className="font-mono tabular-nums font-bold text-slate-900">{emp.EmpCode}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 border-b border-slate-300 pb-2 inline-block px-4 sm:px-10">
            كشف حساب المستحقات والجزاءات التفصيلي
          </h2>
        </div>

        {/* Employee Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-xs grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-slate-500 block mb-0.5">اسم الموظف:</span>
            <span className="font-bold text-slate-900 text-sm">{emp.FullName}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">المسمى الوظيفي:</span>
            <span className="font-semibold text-slate-800">{emp.jobTitle}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">رقم الهاتف:</span>
            <span className="font-mono tabular-nums text-slate-800">{emp.Phone || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">تاريخ التعيين:</span>
            <span className="font-mono tabular-nums text-slate-800">{emp.HireDate}</span>
          </div>
        </div>

        {/* 1. Rewards Table (+) */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Award className="w-4 h-4 text-blue-700" />
              <span>أولاً: الحوافز والمكافآت المعتمدة (+)</span>
            </div>
            <div className="text-xs text-slate-500">
              مجموع النقاط:{' '}
              <span className="font-mono tabular-nums font-bold text-blue-700">{totalRewardPoints} نقطة</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="py-2 px-3 border-b border-slate-200">رقم السند</th>
                  <th className="py-2 px-3 border-b border-slate-200">التاريخ</th>
                  <th className="py-2 px-3 border-b border-slate-200">البيان</th>
                  <th className="py-2 px-3 border-b border-slate-200 text-center">النقاط</th>
                  <th className="py-2 px-3 border-b border-slate-200 text-left">المبلغ (ريال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rewards.map((r) => (
                  <tr key={r.RewardID}>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-500">REC-{(r.RewardID + 1000).toString()}</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-600">{r.RewardDate}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{r.rewardDesc}</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-blue-700 font-bold">{r.Points}</td>
                    <td className="py-2 px-3 text-left font-mono tabular-nums font-bold text-slate-900">
                      {r.Amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {rewards.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      لا توجد مكافآت مسجلة في هذه الفترة
                    </td>
                  </tr>
                )}
              </tbody>
              {rewards.length > 0 && (
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={4} className="py-2 px-3 text-right">المجموع الفرعي للحوافز:</td>
                    <td className="py-2 px-3 text-left font-mono tabular-nums text-blue-800">
                      {totalRewardAmount.toLocaleString()} ريال
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 2. Extra Work Overtime (+) */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>ثانياً: بدل العمل الإضافي المعتمد (+)</span>
            </div>
            <div className="text-xs text-slate-500">
              مجموع الساعات:{' '}
              <span className="font-mono tabular-nums font-bold text-emerald-700">{totalOvertimeHours} ساعة</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="py-2 px-3 border-b border-slate-200">التاريخ</th>
                  <th className="py-2 px-3 border-b border-slate-200">بيان المهمة</th>
                  <th className="py-2 px-3 border-b border-slate-200 text-center">الساعات</th>
                  <th className="py-2 px-3 border-b border-slate-200 text-left">المبلغ (ريال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extraWorks.map((w) => (
                  <tr key={w.ExtraID}>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-600">{w.WorkDate}</td>
                    <td className="py-2 px-3 text-slate-800">{w.Description}</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums font-bold text-slate-800">{w.Hours} ساعة</td>
                    <td className="py-2 px-3 text-left font-mono tabular-nums font-bold text-emerald-700">
                      {w.Amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {extraWorks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      لا يوجد عمل إضافي مسجل في هذه الفترة
                    </td>
                  </tr>
                )}
              </tbody>
              {extraWorks.length > 0 && (
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right">المجموع الفرعي للإضافي:</td>
                    <td className="py-2 px-3 text-left font-mono tabular-nums text-emerald-800">
                      {totalOvertimeAmount.toLocaleString()} ريال
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 3. Disciplinary Violations & Deductions (-) */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 font-bold text-xs text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>ثالثاً: الخصومات والجزاءات الإدارية (-)</span>
            </div>
            <div className="text-xs text-slate-500">
              عدد الوقائع: <span className="font-mono tabular-nums font-bold">{violations.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-red-200">
              <thead className="bg-red-50 text-red-900">
                <tr>
                  <th className="py-2 px-3 border-b border-red-200">رقم الإشعار</th>
                  <th className="py-2 px-3 border-b border-red-200">التاريخ</th>
                  <th className="py-2 px-3 border-b border-red-200">المخالفة</th>
                  <th className="py-2 px-3 border-b border-red-200">الإجراء</th>
                  <th className="py-2 px-3 border-b border-red-200 text-left">الخصم (ريال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {violations.map((v) => (
                  <tr key={v.ViolationID}>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-500">VIO-{(v.ViolationID + 500).toString()}</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-600">{v.ViolationDate}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{v.violationName}</td>
                    <td className="py-2 px-3 text-slate-700">{v.actionName}</td>
                    <td className="py-2 px-3 text-left font-mono tabular-nums font-bold text-red-700">
                      {v.PenaltyAmount > 0 ? `${v.PenaltyAmount.toLocaleString()}-` : '0'}
                    </td>
                  </tr>
                ))}
                {violations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      لا توجد جزاءات مسجلة بحق الموظف (سجل منضبط)
                    </td>
                  </tr>
                )}
              </tbody>
              {violations.length > 0 && (
                <tfoot className="bg-red-50/70 font-bold text-red-900">
                  <tr>
                    <td colSpan={4} className="py-2 px-3 text-right">إجمالي الخصومات المستقطعة:</td>
                    <td className="py-2 px-3 text-left font-mono tabular-nums">
                      {totalPenalties.toLocaleString()}- ريال
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Grand Total Box */}
        <div className="border-2 border-slate-900 rounded-lg p-5 bg-slate-50 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-2 border-b md:border-b-0 md:border-l border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">إجمالي الحوافز (+)</span>
              <span className="text-base font-bold text-blue-900 font-mono tabular-nums">
                {totalRewardAmount.toLocaleString()} ريال
              </span>
            </div>
            <div className="p-2 border-b md:border-b-0 md:border-l border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">إجمالي الإضافي (+)</span>
              <span className="text-base font-bold text-emerald-800 font-mono tabular-nums">
                {totalOvertimeAmount.toLocaleString()} ريال
              </span>
            </div>
            <div className="p-2 border-b md:border-b-0 md:border-l border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">إجمالي الخصومات (-)</span>
              <span className="text-base font-bold text-red-700 font-mono tabular-nums">
                {totalPenalties.toLocaleString()} ريال
              </span>
            </div>
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <span className="text-xs text-slate-300 block mb-1">صافي الاستحقاق للصرف</span>
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {netPayable.toLocaleString()} ريال
              </span>
            </div>
          </div>
        </div>

        {/* Official Signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs pt-4 border-t border-slate-300">
          <div>
            <div className="font-semibold text-slate-800 mb-6 sm:mb-10">الموظف صاحب الكشف</div>
            <div className="text-slate-500">التوقيع: .....................</div>
          </div>
          <div>
            <div className="font-semibold text-slate-800 mb-6 sm:mb-10">المحاسب المالي</div>
            <div className="text-slate-500">التوقيع: .....................</div>
          </div>
          <div>
            <div className="font-semibold text-slate-800 mb-6 sm:mb-10">المدير العام / الاعتماد</div>
            <div className="text-slate-500">الختم: ................</div>
          </div>
        </div>
      </div>
    </div>
  );
};

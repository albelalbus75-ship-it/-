import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { PerformanceEval } from '../types/database';
import { Plus, Search, Star, Edit2, Trash2, TrendingUp, AlertCircle, X } from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const { currentUser, selectedBranchFilter, hasPermission } = useAuth();
  const dbState = db.getState();
  const employees = db.getEmployeesWithDetails();
  const evals = dbState.performanceEvals;

  const canCreate = hasPermission('reports', 'create');
  const canEdit = hasPermission('reports', 'edit');
  const canDelete = hasPermission('reports', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    EmpID: employees[0]?.EmpID || 1,
    BranchID: employees[0]?.BranchID || 1,
    EvalDate: new Date().toISOString().split('T')[0],
    EvalMonth: '2026-10',
    Score: 90,
    Notes: '',
  });

  const handleOpenAdd = () => {
    if (employees.length === 0) {
      alert('يرجى إضافة فروع وموظفين أولاً من قسم "دليل الموظفين" قبل إدخال التقييمات.');
      return;
    }
    const firstEmp = employees[0];
    setEditingId(null);
    setFormData({
      EmpID: firstEmp ? firstEmp.EmpID : 1,
      BranchID: firstEmp ? firstEmp.BranchID : 1,
      EvalDate: new Date().toISOString().split('T')[0],
      EvalMonth: selectedMonth,
      Score: 90,
      Notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PerformanceEval) => {
    setEditingId(item.EvalID);
    setFormData({
      EmpID: item.EmpID,
      BranchID: item.BranchID,
      EvalDate: item.EvalDate,
      EvalMonth: item.EvalMonth,
      Score: item.Score,
      Notes: item.Notes || '',
    });
    setIsModalOpen(true);
  };

  const handleEmployeeChange = (empId: number) => {
    const emp = employees.find((e) => e.EmpID === empId);
    setFormData((prev) => ({
      ...prev,
      EmpID: empId,
      BranchID: emp ? emp.BranchID : prev.BranchID,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (editingId) {
      const existing = evals.find((ev) => ev.EvalID === editingId);
      if (existing) {
        db.updatePerformanceEval(
          {
            ...existing,
            EmpID: formData.EmpID,
            BranchID: formData.BranchID,
            EvalDate: formData.EvalDate,
            EvalMonth: formData.EvalMonth,
            Score: Number(formData.Score),
            Notes: formData.Notes,
          },
          currentUser.UserID
        );
      }
    } else {
      db.addPerformanceEval(
        {
          EmpID: formData.EmpID,
          BranchID: formData.BranchID,
          EvalDate: formData.EvalDate,
          EvalMonth: formData.EvalMonth,
          Score: Number(formData.Score),
          Notes: formData.Notes,
        },
        currentUser.UserID
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!currentUser) return;
    if (window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
      db.deletePerformanceEval(id, currentUser.UserID);
    }
  };

  const enriched = evals.map((ev) => {
    const emp = employees.find((e) => e.EmpID === ev.EmpID);
    return {
      ...ev,
      empName: emp?.FullName || 'موظف غير محدد',
      empCode: emp?.EmpCode || '',
      branchName: emp?.branchName || '',
      deptName: emp?.deptName || '',
      jobTitle: emp?.jobTitle || '',
    };
  });

  const filtered = enriched.filter((ev) => {
    if (selectedBranchFilter && ev.BranchID !== selectedBranchFilter) return false;
    if (selectedMonth && ev.EvalMonth !== selectedMonth) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = ev.empName.toLowerCase().includes(term);
      const matchCode = ev.empCode.toLowerCase().includes(term);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((sum, e) => sum + e.Score, 0) / filtered.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">التقييم الدوري وضبط جودة الأداء</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            سجل تقييم أداء الموظفين
          </h1>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تقييم شهر جديد</span>
          </button>
        )}
      </div>

      {employees.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>لا يوجد موظفون مسجلون حالياً. يرجى إضافة موظفين أولاً لإدخال التقييمات.</span>
        </div>
      )}

      {/* KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">متوسط الأداء للشهر</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {avgScore}%
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-blue-600/60" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">عدد المقيمين</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {filtered.length} <span className="text-xs font-normal text-slate-500 font-sans">موظف</span>
            </div>
          </div>
          <Star className="w-8 h-8 text-amber-500/60" />
        </div>

        {/* Month Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
          <label className="text-xs text-slate-500 mb-1">الشهر المستهدف:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو الكود..."
            className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const scoreColor =
            item.Score >= 90
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : item.Score >= 75
              ? 'text-blue-700 bg-blue-50 border-blue-200'
              : 'text-amber-700 bg-amber-50 border-amber-200';

          return (
            <div key={item.EvalID} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.empName}</div>
                  <div className="text-[11px] text-slate-500">
                    {item.jobTitle} • {item.branchName}
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-sm font-bold font-mono tabular-nums ${scoreColor}`}>
                  {item.Score}%
                </div>
              </div>

              {item.Notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {item.Notes}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="font-mono tabular-nums">تاريخ التقييم: {item.EvalDate}</span>
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.EvalID)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            لا توجد تقييمات مسجلة لشهر {selectedMonth}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-md p-4 sm:p-6 border border-slate-200 my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {editingId ? 'تعديل التقييم' : 'إضافة تقييم موظف'}
                </h3>
                <p className="text-xs text-slate-500">
                  إدخال النسبة المئوية وملاحظات الجودة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shrink-0"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">الموظف</label>
                <select
                  value={formData.EmpID}
                  onChange={(e) => handleEmployeeChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {employees.map((emp) => (
                    <option key={emp.EmpID} value={emp.EmpID}>
                      {emp.FullName} ({emp.EmpCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">شهر التقييم</label>
                  <input
                    type="month"
                    required
                    value={formData.EvalMonth}
                    onChange={(e) => setFormData({ ...formData, EvalMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">النسبة (من 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.Score}
                    onChange={(e) => setFormData({ ...formData, Score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ملاحظات التقييم</label>
                <textarea
                  rows={2}
                  value={formData.Notes}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  placeholder="ملاحظات الأداء..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                {(editingId ? canEdit : canCreate) && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs"
                  >
                    حفظ التقييم
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

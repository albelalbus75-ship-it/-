import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { ExtraWork } from '../types/database';
import { Plus, Search, Trash2, Edit2, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const ExtraWorkView: React.FC = () => {
  const { currentUser, selectedBranchFilter, hasPermission } = useAuth();
  const dbState = db.getState();
  const allExtraWork = db.getExtraWorkWithDetails();
  const employees = db.getEmployeesWithDetails();
  const branches = dbState.branches;

  const canCreate = hasPermission('rewards', 'create');
  const canEdit = hasPermission('rewards', 'edit');
  const canDelete = hasPermission('rewards', 'delete');
  const canApprove = hasPermission('rewards', 'approve');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    EmpID: employees[0]?.EmpID || 1,
    BranchID: branches[0]?.BranchID || 1,
    WorkDate: new Date().toISOString().split('T')[0],
    Hours: 4,
    Amount: 12000,
    Description: '',
    Status: 'Approved' as ExtraWork['Status'],
  });

  const handleOpenAdd = () => {
    if (employees.length === 0) {
      alert('يرجى إضافة فروع وموظفين أولاً من قسم "دليل الموظفين" قبل تسجيل العمل الإضافي.');
      return;
    }
    const firstEmp = employees[0];
    setEditingId(null);
    setFormData({
      EmpID: firstEmp ? firstEmp.EmpID : 1,
      BranchID: firstEmp ? firstEmp.BranchID : (branches[0]?.BranchID || 1),
      WorkDate: new Date().toISOString().split('T')[0],
      Hours: 4,
      Amount: 12000,
      Description: '',
      Status: 'Approved',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.ExtraID);
    setFormData({
      EmpID: item.EmpID,
      BranchID: item.BranchID,
      WorkDate: item.WorkDate,
      Hours: item.Hours,
      Amount: item.Amount,
      Description: item.Description || '',
      Status: item.Status,
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

  const handleHoursChange = (hours: number) => {
    setFormData((prev) => ({
      ...prev,
      Hours: hours,
      Amount: hours * 3000,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (editingId) {
      const existing = dbState.extraWork.find((w) => w.ExtraID === editingId);
      if (existing) {
        db.updateExtraWork(
          {
            ...existing,
            EmpID: formData.EmpID,
            BranchID: formData.BranchID,
            WorkDate: formData.WorkDate,
            Hours: Number(formData.Hours),
            Amount: Number(formData.Amount),
            Description: formData.Description,
            Status: formData.Status,
          },
          currentUser.UserID
        );
      }
    } else {
      db.addExtraWork(
        {
          EmpID: formData.EmpID,
          BranchID: formData.BranchID,
          WorkDate: formData.WorkDate,
          Hours: Number(formData.Hours),
          Amount: Number(formData.Amount),
          Description: formData.Description,
          Status: formData.Status,
        },
        currentUser.UserID
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!currentUser) return;
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      db.deleteExtraWork(id, currentUser.UserID);
    }
  };

  const filtered = allExtraWork.filter((w) => {
    if (selectedBranchFilter && w.BranchID !== selectedBranchFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = w.empName.toLowerCase().includes(term);
      const matchCode = w.empCode.toLowerCase().includes(term);
      const matchDesc = (w.Description || '').toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchDesc) return false;
    }
    return true;
  });

  const totalHours = filtered.reduce((sum, w) => sum + (w.Status === 'Approved' ? w.Hours : 0), 0);
  const totalAmount = filtered.reduce((sum, w) => sum + (w.Status === 'Approved' ? w.Amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">إدارة الساعات التشغيلية والبدلات</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            سجل العمل الإضافي (Overtime)
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل عمل إضافي</span>
            </button>
          )}
        </div>
      </div>

      {employees.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>لا يوجد موظفون مسجلون حالياً. يرجى إضافة موظفين أولاً لتسجيل العمل الإضافي.</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">إجمالي الساعات المعتمدة</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {totalHours} <span className="text-xs font-normal text-slate-600 font-sans">ساعة عمل</span>
            </div>
          </div>
          <Clock className="w-8 h-8 text-emerald-600/70" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">إجمالي مستحقات الإضافي</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
              {totalAmount.toLocaleString()} <span className="text-xs font-normal text-slate-600 font-sans">ريال يمني</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            YER
          </div>
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
            placeholder="بحث بالموظف، الكود أو البيان..."
            className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* Extra Work Data (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((item) => (
            <div key={item.ExtraID} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.empName}</div>
                  <div className="text-xs text-slate-500 font-mono">{item.empCode} • {item.WorkDate}</div>
                </div>
                <div className="text-left">
                  <div className="font-mono tabular-nums font-bold text-emerald-700 text-sm">
                    {item.Amount.toLocaleString()} ريال
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      item.Status === 'Approved' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {item.Status === 'Approved' ? 'معتمد' : 'معلق'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">الفرع:</span>
                  <span className="font-medium text-slate-800">{item.branchName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">عدد الساعات:</span>
                  <span className="font-mono font-bold text-slate-800">{item.Hours} ساعة</span>
                </div>
                {item.Description && (
                  <div className="text-slate-600 pt-1 border-t border-slate-200/70 break-words">
                    {item.Description}
                  </div>
                )}
              </div>

              {(canApprove || canEdit || canDelete) && (
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  {canApprove && (
                    <button
                      onClick={() => {
                        if (currentUser) {
                          db.updateExtraWork(
                            { ...item, Status: item.Status === 'Approved' ? 'Pending' : 'Approved' },
                            currentUser.UserID
                          );
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.Status === 'Approved' ? 'إلغاء الاعتماد' : 'اعتماد'}</span>
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.ExtraID)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              لا توجد سجلات عمل إضافي مسجلة
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">الموظف</th>
                <th className="py-3 px-4 font-semibold">الفرع</th>
                <th className="py-3 px-4 font-semibold">تاريخ العمل</th>
                <th className="py-3 px-4 font-semibold text-center">الساعات</th>
                <th className="py-3 px-4 font-semibold text-left">المبلغ</th>
                <th className="py-3 px-4 font-semibold">بيان المهمة</th>
                <th className="py-3 px-4 font-semibold">الحالة</th>
                {(canApprove || canEdit || canDelete) && (
                  <th className="py-3 px-4 font-semibold text-center">إجراءات موحدة</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.ExtraID} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{item.empName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.empCode}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{item.branchName}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">{item.WorkDate}</td>
                  <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-slate-800">
                    {item.Hours} ساعة
                  </td>
                  <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-emerald-700">
                    {item.Amount.toLocaleString()} ريال
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-sm truncate">{item.Description}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-semibold ${
                        item.Status === 'Approved' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {item.Status === 'Approved' ? 'معتمد' : 'معلق'}
                    </span>
                  </td>
                  {(canApprove || canEdit || canDelete) && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {canApprove && (
                          <button
                            onClick={() => {
                              if (currentUser) {
                                db.updateExtraWork(
                                  { ...item, Status: item.Status === 'Approved' ? 'Pending' : 'Approved' },
                                  currentUser.UserID
                                );
                              }
                            }}
                            title={item.Status === 'Approved' ? 'إلغاء الاعتماد' : 'اعتماد الساعات'}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.ExtraID)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canApprove || canEdit || canDelete ? 8 : 7} className="py-12 text-center text-slate-400">
                    لا توجد سجلات عمل إضافي مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-md p-4 sm:p-6 border border-slate-200 my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {editingId ? 'تعديل سجل عمل إضافي' : 'تسجيل ساعات عمل إضافي'}
                </h3>
                <p className="text-xs text-slate-500">
                  توثيق الساعات الإضافية وبدل الاستحقاق
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">تاريخ العمل</label>
                  <input
                    type="date"
                    required
                    value={formData.WorkDate}
                    onChange={(e) => setFormData({ ...formData, WorkDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">عدد الساعات</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={formData.Hours}
                    onChange={(e) => handleHoursChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">المبلغ المستحق (ريال)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.Amount}
                    onChange={(e) => setFormData({ ...formData, Amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الحالة</label>
                  <select
                    value={formData.Status}
                    onChange={(e) => setFormData({ ...formData, Status: e.target.value as ExtraWork['Status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Approved">معتمد (Approved)</option>
                    <option value="Pending">معلق (Pending)</option>
                    <option value="Rejected">مرفوض (Rejected)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">بيان المهمة الإضافية</label>
                <textarea
                  rows={2}
                  required
                  value={formData.Description}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  placeholder="وصف الأعمال المنجزة..."
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
                    حفظ السجل
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

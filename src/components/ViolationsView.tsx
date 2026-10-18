import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { Violation } from '../types/database';
import {
  Plus,
  Search,
  Printer,
  Trash2,
  Edit2,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ViolationNoticeModal } from './PrintTemplates';

interface ViolationsViewProps {
  initialOpenModal?: boolean;
}

export const ViolationsView: React.FC<ViolationsViewProps> = ({ initialOpenModal = false }) => {
  const { currentUser, hasPermission } = useAuth();
  const dbState = db.getState();
  const allViolations = db.getViolationsWithDetails();
  const employees = db.getEmployeesWithDetails();
  const violationTypes = dbState.violationTypes;
  const violationDegrees = dbState.violationDegrees;
  const adminActions = dbState.adminActions;

  // Granular unified permissions
  const canCreate = hasPermission('violations', 'create');
  const canEdit = hasPermission('violations', 'edit');
  const canDelete = hasPermission('violations', 'delete');
  const canApprove = hasPermission('violations', 'approve');
  const canPrint = hasPermission('violations', 'print');
  const canExport = hasPermission('violations', 'export');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViolationForPrint, setSelectedViolationForPrint] = useState<any | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal);
  const [editingViolationId, setEditingViolationId] = useState<number | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    EmpID: employees[0]?.EmpID || 1,
    ViolationTypeID: violationTypes[0]?.ViolationTypeID || 1,
    DegreeID: violationDegrees[0]?.DegreeID || 1,
    ActionID: adminActions[0]?.ActionID || 1,
    ViolationDate: new Date().toISOString().split('T')[0],
    PenaltyAmount: violationDegrees[0]?.DefaultPenalty || 0,
    Notes: '',
    Status: 'Confirmed' as Violation['Status'],
  });

  const handleOpenAdd = () => {
    if (employees.length === 0) {
      alert('يرجى إضافة فروع وموظفين أولاً من قسم "دليل الموظفين" قبل تسجيل المخالفات.');
      return;
    }
    const firstEmp = employees[0];
    const firstDeg = violationDegrees[0];
    setEditingViolationId(null);
    setFormData({
      EmpID: firstEmp ? firstEmp.EmpID : 1,
      ViolationTypeID: violationTypes[0]?.ViolationTypeID || 1,
      DegreeID: firstDeg ? firstDeg.DegreeID : 1,
      ActionID: adminActions[0]?.ActionID || 1,
      ViolationDate: new Date().toISOString().split('T')[0],
      PenaltyAmount: firstDeg ? firstDeg.DefaultPenalty : 0,
      Notes: '',
      Status: 'Confirmed',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingViolationId(v.ViolationID);
    setFormData({
      EmpID: v.EmpID,
      ViolationTypeID: v.ViolationTypeID,
      DegreeID: v.DegreeID,
      ActionID: v.ActionID,
      ViolationDate: v.ViolationDate,
      PenaltyAmount: v.PenaltyAmount,
      Notes: v.Notes || '',
      Status: v.Status,
    });
    setIsModalOpen(true);
  };

  const handleDegreeChange = (degreeId: number) => {
    const targetDeg = violationDegrees.find((d) => d.DegreeID === degreeId);
    setFormData((prev) => ({
      ...prev,
      DegreeID: degreeId,
      PenaltyAmount: targetDeg ? targetDeg.DefaultPenalty : prev.PenaltyAmount,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (editingViolationId) {
      const existing = dbState.violations.find((v) => v.ViolationID === editingViolationId);
      if (existing) {
        db.updateViolation(
          {
            ...existing,
            EmpID: formData.EmpID,
            ViolationTypeID: formData.ViolationTypeID,
            DegreeID: formData.DegreeID,
            ActionID: formData.ActionID,
            ViolationDate: formData.ViolationDate,
            PenaltyAmount: Number(formData.PenaltyAmount),
            Notes: formData.Notes,
            Status: formData.Status,
          },
          currentUser.UserID
        );
      }
    } else {
      db.addViolation(
        {
          EmpID: formData.EmpID,
          ViolationTypeID: formData.ViolationTypeID,
          DegreeID: formData.DegreeID,
          ActionID: formData.ActionID,
          ViolationDate: formData.ViolationDate,
          PenaltyAmount: Number(formData.PenaltyAmount),
          Notes: formData.Notes,
          Status: formData.Status,
          CreatedBy: currentUser.UserID,
        },
        currentUser.UserID
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!currentUser) return;
    if (window.confirm('هل أنت متأكد من حذف هذه المخالفة؟')) {
      db.deleteViolation(id, currentUser.UserID);
    }
  };

  const filtered = allViolations.filter((v) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = v.empName.toLowerCase().includes(term);
      const matchCode = v.empCode.toLowerCase().includes(term);
      const matchVio = v.violationName.toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchVio) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ['رقم الإشعار', 'اسم الموظف', 'كود الموظف', 'نوع المخالفة', 'الدرجة', 'الإجراء', 'مبلغ الخصم', 'التاريخ', 'الحالة'];
    const rows = filtered.map((v) => [
      v.ViolationID,
      `"${v.empName}"`,
      v.empCode,
      `"${v.violationName}"`,
      `"${v.degreeName}"`,
      `"${v.actionName}"`,
      v.PenaltyAmount,
      v.ViolationDate,
      v.Status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `violations_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">الرقابة الإدارية والانضباط الوظيفي</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            سجل المخالفات والجزاءات (tblViolations)
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canExport && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          )}
          {canCreate && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مخالفة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {employees.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>لا يوجد موظفون مسجلون حالياً. يرجى إضافة موظفين أولاً لتسجيل المخالفات.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالموظف، الكود، أو نوع المخالفة..."
            className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* Violations Data (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((v) => (
            <div key={v.ViolationID} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-slate-500">VIO-{(v.ViolationID + 500).toString()} • {v.ViolationDate}</div>
                  <div className="font-bold text-slate-900 text-sm">{v.empName}</div>
                  <div className="text-xs text-slate-500 font-mono">{v.empCode}</div>
                </div>
                <div className="text-left">
                  <div className="font-mono tabular-nums font-bold text-red-700 text-sm">
                    {v.PenaltyAmount > 0 ? `${v.PenaltyAmount.toLocaleString()} ريال` : 'إنذار شفهي'}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      v.Status === 'Confirmed'
                        ? 'text-red-700'
                        : v.Status === 'Pending'
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {v.Status === 'Confirmed' ? 'مؤكدة' : v.Status === 'Pending' ? 'قيد المراجعة' : 'ملغية'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">المخالفة:</span>
                  <span className="font-semibold text-slate-900">{v.violationName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">الدرجة:</span>
                  <span className="text-slate-700">{v.degreeName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">الإجراء الإداري:</span>
                  <span className="font-semibold text-slate-800">{v.actionName}</span>
                </div>
              </div>

              {(canPrint || canApprove || canEdit || canDelete) && (
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  {canPrint && (
                    <button
                      onClick={() => setSelectedViolationForPrint(v)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة إشعار</span>
                    </button>
                  )}
                  {canApprove && v.Status === 'Pending' && (
                    <button
                      onClick={() => {
                        if (currentUser) {
                          db.updateViolation({ ...v, Status: 'Confirmed' }, currentUser.UserID);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعتماد</span>
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(v.ViolationID)}
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
              لا توجد مخالفات مسجلة حتى الآن
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">رقم الإشعار</th>
                <th className="py-3 px-4 font-semibold">الموظف</th>
                <th className="py-3 px-4 font-semibold">المخالفة</th>
                <th className="py-3 px-4 font-semibold">الدرجة</th>
                <th className="py-3 px-4 font-semibold">الإجراء الإداري</th>
                <th className="py-3 px-4 font-semibold text-left">مبلغ الخصم</th>
                <th className="py-3 px-4 font-semibold">التاريخ</th>
                <th className="py-3 px-4 font-semibold">الحالة</th>
                {(canPrint || canApprove || canEdit || canDelete) && (
                  <th className="py-3 px-4 font-semibold text-center">إجراءات موحدة</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.ViolationID} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500 font-medium">
                    VIO-{(v.ViolationID + 500).toString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{v.empName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{v.empCode}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{v.violationName}</td>
                  <td className="py-3.5 px-4 text-slate-700">{v.degreeName}</td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">{v.actionName}</td>
                  <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-red-700">
                    {v.PenaltyAmount > 0 ? `${v.PenaltyAmount.toLocaleString()} ريال` : 'إنذار شفهي'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">{v.ViolationDate}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-semibold ${
                        v.Status === 'Confirmed'
                          ? 'text-red-700'
                          : v.Status === 'Pending'
                          ? 'text-amber-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {v.Status === 'Confirmed' ? 'مؤكدة' : v.Status === 'Pending' ? 'قيد المراجعة' : 'ملغية'}
                    </span>
                  </td>
                  {(canPrint || canApprove || canEdit || canDelete) && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {canPrint && (
                          <button
                            onClick={() => setSelectedViolationForPrint(v)}
                            title="طباعة إشعار المخالفة"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {canApprove && v.Status === 'Pending' && (
                          <button
                            onClick={() => {
                              if (currentUser) {
                                db.updateViolation({ ...v, Status: 'Confirmed' }, currentUser.UserID);
                              }
                            }}
                            title="اعتماد وتأكيد المخالفة"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(v)}
                            title="تعديل المخالفة"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(v.ViolationID)}
                            title="حذف المخالفة"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
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
                  <td colSpan={canPrint || canApprove || canEdit || canDelete ? 9 : 8} className="py-12 text-center text-slate-400">
                    لا توجد مخالفات مسجلة حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Violation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-lg p-4 sm:p-6 border border-slate-200 my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {editingViolationId ? 'تعديل بيانات المخالفة' : 'تسجيل مخالفة جديدة'}
                </h3>
                <p className="text-xs text-slate-500">
                  إدخال وتوثيق واقعة مخالفة إدارية أو انضباطية
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">الموظف المخالف</label>
                <select
                  value={formData.EmpID}
                  onChange={(e) => setFormData({ ...formData, EmpID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {employees.map((emp) => (
                    <option key={emp.EmpID} value={emp.EmpID}>
                      {emp.FullName} ({emp.EmpCode}) - {emp.branchName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">نوع المخالفة</label>
                  <select
                    value={formData.ViolationTypeID}
                    onChange={(e) => setFormData({ ...formData, ViolationTypeID: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {violationTypes.map((vt) => (
                      <option key={vt.ViolationTypeID} value={vt.ViolationTypeID}>
                        {vt.ViolationName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">درجة المخالفة</label>
                  <select
                    value={formData.DegreeID}
                    onChange={(e) => handleDegreeChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {violationDegrees.map((vd) => (
                      <option key={vd.DegreeID} value={vd.DegreeID}>
                        {vd.DegreeName} (افتراضي: {vd.DefaultPenalty.toLocaleString()} ريال)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الإجراء الإداري</label>
                  <select
                    value={formData.ActionID}
                    onChange={(e) => setFormData({ ...formData, ActionID: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {adminActions.map((aa) => (
                      <option key={aa.ActionID} value={aa.ActionID}>
                        {aa.ActionName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">تاريخ المخالفة</label>
                  <input
                    type="date"
                    required
                    value={formData.ViolationDate}
                    onChange={(e) => setFormData({ ...formData, ViolationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">مبلغ الخصم (ريال يمني)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.PenaltyAmount}
                    onChange={(e) => setFormData({ ...formData, PenaltyAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums font-bold text-red-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الحالة</label>
                  <select
                    value={formData.Status}
                    onChange={(e) => setFormData({ ...formData, Status: e.target.value as Violation['Status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Confirmed">مؤكدة (Confirmed)</option>
                    <option value="Pending">قيد المراجعة (Pending)</option>
                    <option value="Cancelled">ملغية (Cancelled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ملاحظات وتقرير الواقعة</label>
                <textarea
                  rows={2}
                  value={formData.Notes}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  placeholder="بيان تفصيلي بالمخالفة..."
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
                {(editingViolationId ? canEdit : canCreate) && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800 cursor-pointer shadow-xs"
                  >
                    {editingViolationId ? 'حفظ التعديل' : 'تسجيل المخالفة'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Disciplinary Notice Modal */}
      {selectedViolationForPrint && (
        <ViolationNoticeModal
          violation={selectedViolationForPrint}
          onClose={() => setSelectedViolationForPrint(null)}
        />
      )}
    </div>
  );
};

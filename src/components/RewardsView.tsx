import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { Reward } from '../types/database';
import {
  Plus,
  Search,
  Printer,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';
import { RewardVoucherModal } from './PrintTemplates';

interface RewardsViewProps {
  initialOpenModal?: boolean;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ initialOpenModal = false }) => {
  const { currentUser, selectedBranchFilter, hasPermission } = useAuth();
  const dbState = db.getState();
  const employees = db.getEmployeesWithDetails();
  const branches = dbState.branches;
  const rewardTypes = dbState.rewardTypes;
  const currencies = dbState.currencies;

  // Granular permissions for Rewards
  const canCreate = hasPermission('rewards', 'create');
  const canEdit = hasPermission('rewards', 'edit');
  const canDelete = hasPermission('rewards', 'delete');
  const canApprove = hasPermission('rewards', 'approve');
  const canPrint = hasPermission('rewards', 'print');
  const canExport = hasPermission('rewards', 'export');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');
  const [selectedRewardForPrint, setSelectedRewardForPrint] = useState<any | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal);
  const [editingRewardId, setEditingRewardId] = useState<number | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    EmpID: employees[0]?.EmpID || 1,
    BranchID: branches[0]?.BranchID || 1,
    RewardTypeID: rewardTypes[0]?.RewardTypeID || 1,
    CurrencyID: currencies[0]?.CurrencyID || 1,
    RewardDate: new Date().toISOString().split('T')[0],
    Points: rewardTypes[0]?.DefaultPoints || 0,
    Amount: rewardTypes[0]?.DefaultAmount || 0,
    Notes: '',
    Status: 'Approved' as Reward['Status'],
  });

  const handleOpenAdd = () => {
    if (employees.length === 0) {
      alert('يرجى إضافة فروع وموظفين أولاً من قسم "دليل الموظفين" قبل تسجيل الحوافز.');
      return;
    }
    const firstType = rewardTypes[0];
    const firstEmp = employees[0];
    setEditingRewardId(null);
    setFormData({
      EmpID: firstEmp ? firstEmp.EmpID : 1,
      BranchID: firstEmp ? firstEmp.BranchID : (branches[0]?.BranchID || 1),
      RewardTypeID: firstType ? firstType.RewardTypeID : 1,
      CurrencyID: currencies[0]?.CurrencyID || 1,
      RewardDate: new Date().toISOString().split('T')[0],
      Points: firstType ? firstType.DefaultPoints : 0,
      Amount: firstType ? firstType.DefaultAmount : 0,
      Notes: '',
      Status: 'Approved',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: any) => {
    setEditingRewardId(r.RewardID);
    setFormData({
      EmpID: r.EmpID,
      BranchID: r.BranchID,
      RewardTypeID: r.RewardTypeID,
      CurrencyID: r.CurrencyID,
      RewardDate: r.RewardDate,
      Points: r.Points,
      Amount: r.Amount,
      Notes: r.Notes || '',
      Status: r.Status,
    });
    setIsModalOpen(true);
  };

  const handleRewardTypeChange = (rewardTypeId: number) => {
    const targetType = rewardTypes.find((t) => t.RewardTypeID === rewardTypeId);
    setFormData((prev) => ({
      ...prev,
      RewardTypeID: rewardTypeId,
      Points: targetType ? targetType.DefaultPoints : prev.Points,
      Amount: targetType ? targetType.DefaultAmount : prev.Amount,
    }));
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
    if (editingRewardId) {
      const existing = dbState.rewards.find((r) => r.RewardID === editingRewardId);
      if (existing) {
        db.updateReward(
          {
            ...existing,
            EmpID: formData.EmpID,
            BranchID: formData.BranchID,
            RewardTypeID: formData.RewardTypeID,
            CurrencyID: formData.CurrencyID,
            RewardDate: formData.RewardDate,
            Points: Number(formData.Points),
            Amount: Number(formData.Amount),
            Notes: formData.Notes,
            Status: formData.Status,
          },
          currentUser.UserID
        );
      }
    } else {
      db.addReward(
        {
          EmpID: formData.EmpID,
          BranchID: formData.BranchID,
          RewardTypeID: formData.RewardTypeID,
          CurrencyID: formData.CurrencyID,
          RewardDate: formData.RewardDate,
          Points: Number(formData.Points),
          Amount: Number(formData.Amount),
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
    if (window.confirm('هل أنت متأكد من حذف هذا الحافز؟')) {
      db.deleteReward(id, currentUser.UserID);
    }
  };

  const handleQuickStatus = (id: number, status: Reward['Status']) => {
    if (!currentUser) return;
    db.setRewardStatus(id, status, currentUser.UserID);
  };

  // Data retrieved directly using SQLite View: qryRptRew (access_queries.sql)
  const qryRewList = db.qryRptRew({
    status: statusFilter,
    branchId: selectedBranchFilter,
    search: searchTerm,
  });

  const exportCsv = () => {
    const headers = ['تاريخ الحافز', 'كود الموظف', 'اسم الموظف', 'الفرع', 'التصنيف', 'نوع الحافز', 'النقاط', 'المبلغ', 'العملة', 'الحالة'];
    const rows = qryRewList.map((r) => [
      r.RewardDate,
      r.EmpCode,
      `"${r.FullName}"`,
      `"${r.BranchName}"`,
      `"${r.CategoryName}"`,
      `"${r.RewardDesc}"`,
      r.Points,
      r.Amount,
      r.CurrencyCode,
      r.Status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `qryRptRew_incentives_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">إدارة الاستحقاقات المالية المعتمدة</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            سجل الحوافز والمكافآت (tblRewards)
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
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حافز جديد</span>
            </button>
          )}
        </div>
      </div>

      {employees.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>لا يوجد موظفون مسجلون حالياً. يمكنك الذهاب إلى تبويب "دليل الموظفين" لإضافة الفروع والأقسام والموظفين.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالموظف، الكود، أو البيان..."
            className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-800"
          />
        </div>

        {/* Status Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {(['All', 'Approved', 'Pending', 'Rejected'] as const).map((st) => {
            const labels = {
              All: 'الكل',
              Approved: 'معتمد',
              Pending: 'معلق',
              Rejected: 'مرفوض',
            };
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* SQL View Info Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-700 text-white rounded font-mono font-bold text-[10px]">
            SQLite View
          </span>
          <span className="font-semibold text-blue-900 font-mono">qryRptRew</span>
          <span className="text-blue-700">مربوط بالاستعلام المحاكي لـ access_queries.sql</span>
        </div>
        <div className="text-[11px] text-blue-600 font-mono break-words">
          SELECT R.RewardDate, E.EmpCode, E.FullName, RC.CategoryName, T.RewardDesc, R.Points, R.Amount, R.Status
        </div>
      </div>

      {/* Mobile Cards View (< md) */}
      <div className="md:hidden space-y-3">
        {qryRewList.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            لا توجد بيانات حوافز متطابقة مع شروط البحث أو استعلام qryRptRew
          </div>
        ) : (
          qryRewList.map((r) => (
            <div key={r.RewardID} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{r.FullName}</div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {r.EmpCode} • سند REC-{(r.RewardID + 1000).toString()}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold shrink-0 ${
                    r.Status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : r.Status === 'Pending'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {r.Status === 'Approved' ? 'معتمد' : r.Status === 'Pending' ? 'معلق' : 'مرفوض'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">الفرع:</span>
                  <span className="font-semibold text-slate-800">{r.BranchName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">التاريخ:</span>
                  <span className="font-mono text-slate-700">{r.RewardDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">النقاط:</span>
                  <span className="font-mono font-bold text-blue-700">{r.Points} نقطة</span>
                </div>
                <div>
                  <span className="text-slate-400 block">المبلغ:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {r.Amount.toLocaleString()} {r.CurrencyCode}
                  </span>
                </div>
              </div>

              <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-900">{r.RewardDesc}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  <span className="text-blue-800 font-semibold">{r.CategoryName}</span>
                  {r.Notes && <span> • {r.Notes}</span>}
                </div>
              </div>

              {(canPrint || canApprove || canEdit || canDelete) && (
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  {canPrint && (
                    <button
                      onClick={() => setSelectedRewardForPrint(r)}
                      className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>
                  )}
                  {canApprove && r.Status === 'Pending' && (
                    <button
                      onClick={() => handleQuickStatus(r.RewardID, 'Approved')}
                      className="flex items-center gap-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعتماد</span>
                    </button>
                  )}
                  {canApprove && r.Status === 'Approved' && (
                    <button
                      onClick={() => handleQuickStatus(r.RewardID, 'Rejected')}
                      className="flex items-center gap-1 px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md cursor-pointer text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>إلغاء الاعتماد</span>
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(r.RewardID)}
                      className="flex items-center gap-1 px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Rewards Data Table (Desktop >= md) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">رقم السند</th>
                <th className="py-3 px-4 font-semibold">الموظف (FullName)</th>
                <th className="py-3 px-4 font-semibold">الفرع</th>
                <th className="py-3 px-4 font-semibold">البيان (Category / RewardDesc)</th>
                <th className="py-3 px-4 font-semibold text-center">النقاط (Points)</th>
                <th className="py-3 px-4 font-semibold text-left">المبلغ (Amount)</th>
                <th className="py-3 px-4 font-semibold">التاريخ (RewardDate)</th>
                <th className="py-3 px-4 font-semibold">الحالة (Status)</th>
                {(canPrint || canApprove || canEdit || canDelete) && (
                  <th className="py-3 px-4 font-semibold text-center">إجراءات موحدة</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qryRewList.length === 0 ? (
                <tr>
                  <td colSpan={(canPrint || canApprove || canEdit || canDelete) ? 9 : 8} className="py-8 text-center text-slate-400">
                    لا توجد بيانات حوافز متطابقة مع شروط البحث أو استعلام qryRptRew
                  </td>
                </tr>
              ) : (
                qryRewList.map((r) => (
                  <tr key={r.RewardID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500 font-medium">
                      REC-{(r.RewardID + 1000).toString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.FullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.EmpCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{r.BranchName}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">{r.RewardDesc}</div>
                      <div className="text-[10px] text-slate-500">
                        <span className="font-semibold text-blue-800">{r.CategoryName}</span>
                        {r.Notes && <span> • {r.Notes}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono tabular-nums font-bold text-blue-700">{r.Points}</span>
                    </td>
                    <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                      {r.Amount.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-500 font-sans font-normal">{r.CurrencyCode}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">{r.RewardDate}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold ${
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
                    {(canPrint || canApprove || canEdit || canDelete) && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {/* Print Voucher */}
                          {canPrint && (
                            <button
                              onClick={() => setSelectedRewardForPrint(r)}
                              title="طباعة سند الصرف"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          {/* Approval Toggle */}
                          {canApprove && r.Status === 'Pending' && (
                            <button
                              onClick={() => handleQuickStatus(r.RewardID, 'Approved')}
                              title="اعتماد الحافز"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {canApprove && r.Status === 'Approved' && (
                            <button
                              onClick={() => handleQuickStatus(r.RewardID, 'Rejected')}
                              title="إلغاء الاعتماد"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {/* Edit Button */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(r)}
                              title="تعديل"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {/* Delete Button */}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(r.RewardID)}
                              title="حذف"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Reward Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-lg p-5 sm:p-6 border border-slate-200 my-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">
                {editingRewardId ? 'تعديل بيانات الحافز' : 'إضافة حافز جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              إدخال تفاصيل المكافأة والاستحقاق المالي للموظف
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">الموظف</label>
                <select
                  value={formData.EmpID}
                  onChange={(e) => handleEmployeeChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900"
                >
                  {employees.map((emp) => (
                    <option key={emp.EmpID} value={emp.EmpID}>
                      {emp.FullName} ({emp.EmpCode}) - {emp.branchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الفرع</label>
                  <select
                    value={formData.BranchID}
                    onChange={(e) => setFormData({ ...formData, BranchID: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {branches.map((b) => (
                      <option key={b.BranchID} value={b.BranchID}>
                        {b.BranchName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={formData.RewardDate}
                    onChange={(e) => setFormData({ ...formData, RewardDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Category Filter and Reward Type (Cascading) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    تصنيف الحافز
                  </label>
                  <select
                    value={formData.RewardTypeID ? (rewardTypes.find(t => t.RewardTypeID === formData.RewardTypeID)?.CategoryID || '') : ''}
                    onChange={(e) => {
                      const catId = Number(e.target.value);
                      const matchingTypes = rewardTypes.filter((t) => t.CategoryID === catId);
                      if (matchingTypes[0]) {
                        handleRewardTypeChange(matchingTypes[0].RewardTypeID);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {dbState.rewardCategories.map((cat) => (
                      <option key={cat.CategoryID} value={cat.CategoryID}>
                        {cat.CategoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    نوع المكافأة
                  </label>
                  <select
                    value={formData.RewardTypeID}
                    onChange={(e) => handleRewardTypeChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {rewardTypes
                      .filter((rt) => {
                        const currentCatId = rewardTypes.find((t) => t.RewardTypeID === formData.RewardTypeID)?.CategoryID;
                        return currentCatId ? rt.CategoryID === currentCatId : true;
                      })
                      .map((rt) => (
                        <option key={rt.RewardTypeID} value={rt.RewardTypeID}>
                          {rt.RewardDesc} ({rt.DefaultPoints} نقطة / {rt.DefaultAmount.toLocaleString()} ريال)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Points & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">النقاط</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.Points}
                    onChange={(e) => setFormData({ ...formData, Points: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">المبلغ المالي</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.Amount}
                    onChange={(e) => setFormData({ ...formData, Amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">العملة</label>
                  <select
                    value={formData.CurrencyID}
                    onChange={(e) => setFormData({ ...formData, CurrencyID: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {currencies.map((c) => (
                      <option key={c.CurrencyID} value={c.CurrencyID}>
                        {c.CurrencyCode} ({c.CurrencyName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">حالة الاعتماد</label>
                <select
                  value={formData.Status}
                  onChange={(e) => setFormData({ ...formData, Status: e.target.value as Reward['Status'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Approved">معتمد (Approved)</option>
                  <option value="Pending">معلق (Pending)</option>
                  <option value="Rejected">مرفوض (Rejected)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={formData.Notes}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  placeholder="أي تفاصيل أو سبب المنح..."
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
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  {editingRewardId ? 'حفظ التعديلات' : 'إضافة الحافز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {selectedRewardForPrint && (
        <RewardVoucherModal
          reward={selectedRewardForPrint}
          onClose={() => setSelectedRewardForPrint(null)}
        />
      )}
    </div>
  );
};

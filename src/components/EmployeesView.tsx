import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { Employee } from '../types/database';
import {
  Plus,
  Search,
  Building,
  Briefcase,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  Download,
  X,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { currentUser, selectedBranchFilter, hasPermission } = useAuth();
  const [, setVersion] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setVersion((v) => v + 1));
  }, []);

  const dbState = db.getState();
  const employees = db.getEmployeesWithDetails();
  const branches = dbState.branches;
  const departments = dbState.departments;
  const jobTitles = dbState.jobTitles;
  const currencies = dbState.currencies;

  // Permissions for employees, branches, and departments
  const canCreateEmp = hasPermission('employees', 'create');
  const canEditEmp = hasPermission('employees', 'edit');
  const canDeleteEmp = hasPermission('employees', 'delete');
  const canExportEmp = hasPermission('employees', 'export');

  const canViewBranches = hasPermission('branches', 'view');
  const canCreateBranch = hasPermission('branches', 'create');
  const canEditBranch = hasPermission('branches', 'edit');
  const canDeleteBranch = hasPermission('branches', 'delete');

  const canViewDepts = hasPermission('departments', 'view');
  const canCreateDept = hasPermission('departments', 'create');
  const canDeleteDept = hasPermission('departments', 'delete');

  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'branches' | 'departments' | 'jobs'>('employees');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);
  const [empForm, setEmpForm] = useState({
    EmpCode: 'EMP-001',
    FullName: '',
    BranchID: branches[0]?.BranchID || 1,
    DeptID: departments[0]?.DeptID || null as number | null,
    JobID: jobTitles[0]?.JobID || null as number | null,
    CurrencyID: currencies[0]?.CurrencyID || 1,
    Phone: '',
    HireDate: new Date().toISOString().split('T')[0],
    IsActive: 1,
  });

  // Branch Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ BranchName: '', BranchCode: '', IsActive: 1 });

  // Dept Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ DeptName: '', BranchID: branches[0]?.BranchID || 1 });

  const handleOpenAddEmp = () => {
    if (!canCreateEmp) return;
    if (branches.length === 0) {
      alert('يرجى إضافة فرع أولاً من تبويب "الفروع" قبل إضافة الموظفين.');
      if (canViewBranches) setActiveSubTab('branches');
      return;
    }
    setEditingEmpId(null);
    const nextCode = `EMP-${(employees.length + 1).toString().padStart(3, '0')}`;
    const firstBranch = branches[0];
    const branchDepts = firstBranch ? db.getDepartmentsByBranch(firstBranch.BranchID) : [];

    setEmpForm({
      EmpCode: nextCode,
      FullName: '',
      BranchID: firstBranch.BranchID,
      DeptID: branchDepts[0]?.DeptID || null,
      JobID: jobTitles[0]?.JobID || null,
      CurrencyID: currencies[0]?.CurrencyID || 1,
      Phone: '',
      HireDate: new Date().toISOString().split('T')[0],
      IsActive: 1,
    });
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: Employee) => {
    if (!canEditEmp) return;
    setEditingEmpId(emp.EmpID);
    setEmpForm({
      EmpCode: emp.EmpCode,
      FullName: emp.FullName,
      BranchID: emp.BranchID,
      DeptID: emp.DeptID || null,
      JobID: emp.JobID || null,
      CurrencyID: emp.CurrencyID,
      Phone: emp.Phone || '',
      HireDate: emp.HireDate,
      IsActive: emp.IsActive,
    });
    setIsEmpModalOpen(true);
  };

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !empForm.FullName.trim()) return;

    if (editingEmpId) {
      if (!canEditEmp) return;
      const existing = dbState.employees.find((e) => e.EmpID === editingEmpId);
      if (existing) {
        db.updateEmployee(
          {
            ...existing,
            EmpCode: empForm.EmpCode,
            FullName: empForm.FullName,
            BranchID: Number(empForm.BranchID),
            DeptID: empForm.DeptID ? Number(empForm.DeptID) : null,
            JobID: empForm.JobID ? Number(empForm.JobID) : null,
            CurrencyID: Number(empForm.CurrencyID),
            Phone: empForm.Phone,
            HireDate: empForm.HireDate,
            IsActive: empForm.IsActive,
          },
          currentUser.UserID
        );
      }
    } else {
      if (!canCreateEmp) return;
      db.addEmployee(
        {
          EmpCode: empForm.EmpCode,
          FullName: empForm.FullName,
          BranchID: Number(empForm.BranchID),
          DeptID: empForm.DeptID ? Number(empForm.DeptID) : null,
          JobID: empForm.JobID ? Number(empForm.JobID) : null,
          CurrencyID: Number(empForm.CurrencyID),
          Phone: empForm.Phone,
          HireDate: empForm.HireDate,
          IsActive: 1,
        },
        currentUser.UserID
      );
    }
    setIsEmpModalOpen(false);
  };

  const handleDeleteEmp = (empId: number) => {
    if (!currentUser || !canDeleteEmp) return;
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟')) {
      db.deleteEmployee(empId, currentUser.UserID);
    }
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !canCreateBranch || !branchForm.BranchName.trim()) return;
    db.addBranch(
      {
        BranchName: branchForm.BranchName,
        BranchCode: branchForm.BranchCode,
        IsActive: 1,
      },
      currentUser.UserID
    );
    setBranchForm({ BranchName: '', BranchCode: '', IsActive: 1 });
    setIsBranchModalOpen(false);
  };

  const handleDeleteBranch = (branchId: number) => {
    if (!currentUser || !canDeleteBranch) return;
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      const res = db.deleteBranch(branchId, currentUser.UserID);
      if (!res.success && res.message) {
        alert(res.message);
      }
    }
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !canCreateDept || !deptForm.DeptName.trim()) return;
    db.addDepartment(
      {
        DeptName: deptForm.DeptName,
        BranchID: Number(deptForm.BranchID),
      },
      currentUser.UserID
    );
    setDeptForm({ DeptName: '', BranchID: branches[0]?.BranchID || 1 });
    setIsDeptModalOpen(false);
  };

  const handleDeleteDept = (deptId: number) => {
    if (!currentUser || !canDeleteDept) return;
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      const res = db.deleteDepartment(deptId, currentUser.UserID);
      if (!res.success && res.message) {
        alert(res.message);
      }
    }
  };

  const filteredEmployees = employees.filter((e) => {
    if (selectedBranchFilter && e.BranchID !== selectedBranchFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = e.FullName.toLowerCase().includes(term);
      const matchCode = e.EmpCode.toLowerCase().includes(term);
      const matchPhone = (e.Phone || '').includes(term);
      if (!matchName && !matchCode && !matchPhone) return false;
    }
    return true;
  });

  const exportCsv = () => {
    if (!canExportEmp) return;
    const headers = ['الرقم الوظيفي', 'الاسم الكامل', 'الفرع', 'القسم', 'المسمى الوظيفي', 'الهاتف', 'تاريخ التعيين', 'الحالة'];
    const rows = filteredEmployees.map((e) => [
      e.EmpCode,
      `"${e.FullName}"`,
      `"${e.branchName}"`,
      `"${e.deptName}"`,
      `"${e.jobTitle}"`,
      e.Phone || '',
      e.HireDate,
      e.IsActive === 1 ? 'نشط' : 'معطل',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">الهيكل الإداري والوظيفي لمجموعة البحري</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            دليل الموظفين والفروع والأقسام
          </h1>
        </div>

        {/* Action Buttons: Unified and strictly permission-driven */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'employees' && canExportEmp && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          )}

          {activeSubTab === 'employees' && canCreateEmp && (
            <button
              onClick={handleOpenAddEmp}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          )}

          {activeSubTab === 'branches' && canCreateBranch && (
            <button
              onClick={() => setIsBranchModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع</span>
            </button>
          )}

          {activeSubTab === 'departments' && canCreateDept && (
            <button
              onClick={() => {
                if (branches.length === 0) {
                  alert('يرجى إضافة فرع أولاً قبل إنشاء الأقسام.');
                  setActiveSubTab('branches');
                  return;
                }
                setDeptForm({ DeptName: '', BranchID: branches[0]?.BranchID || 1 });
                setIsDeptModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-fit">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === 'employees' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>الموظفون ({employees.length})</span>
        </button>

        {canViewBranches && (
          <button
            onClick={() => setActiveSubTab('branches')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'branches' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>الفروع ({branches.length})</span>
          </button>
        )}

        {canViewDepts && (
          <button
            onClick={() => setActiveSubTab('departments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>الأقسام ({departments.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('jobs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === 'jobs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>المسميات الوظيفية ({jobTitles.length})</span>
        </button>
      </div>

      {/* 1. EMPLOYEES TAB */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم، الكود، أو رقم الهاتف..."
                className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredEmployees.map((emp) => (
              <div key={emp.EmpID} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{emp.FullName}</div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">{emp.EmpCode}</div>
                  </div>
                  <div className="shrink-0">
                    {canEditEmp ? (
                      <button
                        onClick={() => currentUser && db.toggleEmployeeActive(emp.EmpID, currentUser.UserID)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border ${
                          emp.IsActive === 1
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {emp.IsActive === 1 ? 'نشط' : 'معطل'}
                      </button>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          emp.IsActive === 1 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                        }`}
                      >
                        {emp.IsActive === 1 ? 'نشط' : 'معطل'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">الفرع:</span>
                    <span className="font-semibold text-slate-800">{emp.branchName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">القسم:</span>
                    <span className="font-semibold text-slate-800">{emp.deptName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المسمى الوظيفي:</span>
                    <span className="font-semibold text-slate-800">{emp.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">رقم الهاتف:</span>
                    <span className="font-mono text-slate-700">{emp.Phone || '-'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-mono">تاريخ التعيين: {emp.HireDate}</span>
                  {(canEditEmp || canDeleteEmp) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {canEditEmp && (
                        <button
                          onClick={() => handleOpenEditEmp(emp)}
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      )}
                      {canDeleteEmp && (
                        <button
                          onClick={() => handleDeleteEmp(emp.EmpID)}
                          className="flex items-center gap-1 px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                لا يوجد موظفون مسجلون حالياً
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">الكود</th>
                    <th className="py-3 px-4 font-semibold">الاسم الرباعي</th>
                    <th className="py-3 px-4 font-semibold">الفرع</th>
                    <th className="py-3 px-4 font-semibold">القسم</th>
                    <th className="py-3 px-4 font-semibold">المسمى الوظيفي</th>
                    <th className="py-3 px-4 font-semibold">الهاتف</th>
                    <th className="py-3 px-4 font-semibold">تاريخ التعيين</th>
                    <th className="py-3 px-4 font-semibold text-center">الحالة</th>
                    {(canEditEmp || canDeleteEmp) && (
                      <th className="py-3 px-4 font-semibold text-center">إجراءات موحدة</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.EmpID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{emp.EmpCode}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{emp.FullName}</td>
                      <td className="py-3.5 px-4 text-slate-700">{emp.branchName}</td>
                      <td className="py-3.5 px-4 text-slate-700">{emp.deptName}</td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">{emp.jobTitle}</td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">{emp.Phone || '-'}</td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500">{emp.HireDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        {canEditEmp ? (
                          <button
                            onClick={() => currentUser && db.toggleEmployeeActive(emp.EmpID, currentUser.UserID)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer border ${
                              emp.IsActive === 1
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {emp.IsActive === 1 ? 'نشط' : 'معطل'}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              emp.IsActive === 1 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                            }`}
                          >
                            {emp.IsActive === 1 ? 'نشط' : 'معطل'}
                          </span>
                        )}
                      </td>

                      {/* Unified Actions: Only visible if user has edit or delete permission */}
                      {(canEditEmp || canDeleteEmp) && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {canEditEmp && (
                              <button
                                onClick={() => handleOpenEditEmp(emp)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                                title="تعديل"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteEmp && (
                              <button
                                onClick={() => handleDeleteEmp(emp.EmpID)}
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
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={canEditEmp || canDeleteEmp ? 9 : 8} className="py-12 text-center text-slate-400">
                        لا يوجد موظفون مسجلون حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. BRANCHES TAB */}
      {activeSubTab === 'branches' && canViewBranches && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {branches.map((b) => {
            const branchEmpCount = employees.filter((e) => e.BranchID === b.BranchID).length;
            return (
              <div key={b.BranchID} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{b.BranchName}</div>
                  <span className="font-mono text-xs text-slate-400">{b.BranchCode || `BR-${b.BranchID}`}</span>
                </div>
                <div className="text-xs text-slate-500">
                  الموظفون التابعون: <span className="font-mono font-bold text-slate-800">{branchEmpCount} موظف</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-emerald-700 font-semibold">{b.IsActive ? 'فرع نشط' : 'فرع معطل'}</span>
                  {canDeleteBranch && (
                    <button
                      onClick={() => handleDeleteBranch(b.BranchID)}
                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      title="حذف الفرع"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {branches.length === 0 && (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              لا توجد فروع مسجلة. {canCreateBranch && 'اضغط على "إضافة فرع" لبدء إدخال فروع المجموعة.'}
            </div>
          )}
        </div>
      )}

      {/* 3. DEPARTMENTS TAB */}
      {activeSubTab === 'departments' && canViewDepts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const branch = branches.find((b) => b.BranchID === d.BranchID);
            const deptEmpCount = employees.filter((e) => e.DeptID === d.DeptID).length;
            return (
              <div key={d.DeptID} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{d.DeptName}</div>
                <div className="text-xs text-slate-500">
                  الفرع التابع: <span className="font-semibold text-slate-700">{branch?.BranchName || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600">
                    الموظفون في القسم: <span className="font-mono font-bold text-slate-800">{deptEmpCount} موظف</span>
                  </span>
                  {canDeleteDept && (
                    <button
                      onClick={() => handleDeleteDept(d.DeptID)}
                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {departments.length === 0 && (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              لا توجد أقسام مسجلة. {canCreateDept && 'اضغط على "إضافة قسم" لإنشاء الأقسام الإدارية والتشغيلية.'}
            </div>
          )}
        </div>
      )}

      {/* 4. JOBS & DUTIES TAB */}
      {activeSubTab === 'jobs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {jobTitles.map((j) => {
            const duties = dbState.jobDuties.filter((d) => d.JobID === j.JobID);
            return (
              <div key={j.JobID} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm">{j.JobTitle}</div>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block font-semibold">المهام والواجبات الرئيسية:</span>
                  {duties.map((duty) => (
                    <div key={duty.DutyID} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span>{duty.DutyDesc}</span>
                    </div>
                  ))}
                  {duties.length === 0 && (
                    <div className="text-xs text-slate-400 italic">لا توجد مهام مسجلة لهذا المسمى</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-lg p-5 sm:p-6 border border-slate-200 my-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmpId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEmpModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              تسجيل موظف جديد في قاعدة بيانات المجموعة
            </p>
            <form onSubmit={handleEmpSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الرقم الوظيفي</label>
                  <input
                    type="text"
                    required
                    value={empForm.EmpCode}
                    onChange={(e) => setEmpForm({ ...empForm, EmpCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={empForm.FullName}
                    onChange={(e) => setEmpForm({ ...empForm, FullName: e.target.value })}
                    placeholder="الاسم الرباعي"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الفرع</label>
                  <select
                    value={empForm.BranchID}
                    onChange={(e) => {
                      const newBranchId = Number(e.target.value);
                      const branchDepts = db.getDepartmentsByBranch(newBranchId);
                      setEmpForm({
                        ...empForm,
                        BranchID: newBranchId,
                        DeptID: branchDepts[0]?.DeptID || null,
                      });
                    }}
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">القسم</label>
                  <select
                    value={empForm.DeptID || ''}
                    onChange={(e) => setEmpForm({ ...empForm, DeptID: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">(بدون قسم)</option>
                    {(db.getDepartmentsByBranch(empForm.BranchID).length > 0
                      ? db.getDepartmentsByBranch(empForm.BranchID)
                      : departments
                    ).map((d) => (
                      <option key={d.DeptID} value={d.DeptID}>
                        {d.DeptName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">المسمى الوظيفي</label>
                  <select
                    value={empForm.JobID || ''}
                    onChange={(e) => setEmpForm({ ...empForm, JobID: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">(بدون مسمى)</option>
                    {jobTitles.map((j) => (
                      <option key={j.JobID} value={j.JobID}>
                        {j.JobTitle}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">عملة الراتب</label>
                  <select
                    value={empForm.CurrencyID}
                    onChange={(e) => setEmpForm({ ...empForm, CurrencyID: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {currencies.map((c) => (
                      <option key={c.CurrencyID} value={c.CurrencyID}>
                        {c.CurrencyName} ({c.CurrencyCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={empForm.Phone}
                    onChange={(e) => setEmpForm({ ...empForm, Phone: e.target.value })}
                    placeholder="777123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">تاريخ التعيين</label>
                  <input
                    type="date"
                    required
                    value={empForm.HireDate}
                    onChange={(e) => setEmpForm({ ...empForm, HireDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  {editingEmpId ? 'حفظ التعديلات' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-[95vw] max-w-sm p-5 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">إضافة فرع جديد</h3>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBranchSubmit} className="space-y-4 mt-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">اسم الفرع</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فرع صنعاء الرئيسي"
                  value={branchForm.BranchName}
                  onChange={(e) => setBranchForm({ ...branchForm, BranchName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">كود الفرع</label>
                <input
                  type="text"
                  placeholder="BR-01"
                  value={branchForm.BranchCode}
                  onChange={(e) => setBranchForm({ ...branchForm, BranchCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  إضافة الفرع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dept Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-[95vw] max-w-sm p-5 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">إضافة قسم جديد</h3>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeptSubmit} className="space-y-4 mt-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">اسم القسم</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قسم المبيعات"
                  value={deptForm.DeptName}
                  onChange={(e) => setDeptForm({ ...deptForm, DeptName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">الفرع التابع</label>
                <select
                  value={deptForm.BranchID}
                  onChange={(e) => setDeptForm({ ...deptForm, BranchID: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {branches.map((b) => (
                    <option key={b.BranchID} value={b.BranchID}>
                      {b.BranchName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, ALL_SCREENS, ALL_ACTIONS } from '../services/dbStore';
import { User, Role, ScreenKey, ActionKey } from '../types/database';
import {
  Plus,
  Search,
  Shield,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  Users as UsersIcon,
  ShieldCheck,
  Grid,
  Check,
  Save,
  RotateCcw,
  X,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const dbState = db.getState();
  const users = dbState.users;
  const roles = dbState.roles;
  const employees = db.getEmployeesWithDetails();
  const branches = dbState.branches;

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'matrix'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  // Permission flags for the Users module itself
  const canCreate = hasPermission('users', 'create');
  const canEdit = hasPermission('users', 'edit');
  const canDelete = hasPermission('users', 'delete');

  // --- 1. USER MODAL STATE ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userFormData, setUserFormData] = useState({
    UserName: '',
    PasswordHash: '123456',
    FullName: '',
    EmpID: null as number | null,
    BranchID: null as number | null,
    RoleID: roles[0]?.RoleID || 1,
    IsActive: 1,
  });

  // --- 2. ROLE MODAL STATE ---
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    RoleName: '',
    Description: '',
  });

  // --- 3. PERMISSION MATRIX STATE ---
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<number>(roles[1]?.RoleID || 2);
  const [matrixState, setMatrixState] = useState<Record<string, ActionKey[]>>(() => {
    const roleId = roles[1]?.RoleID || 2;
    const perms = db.getRolePermissions(roleId);
    const map: Record<string, ActionKey[]> = {};
    ALL_SCREENS.forEach((s) => {
      const found = perms.find((p) => p.Screen === s.key);
      map[s.key] = found ? [...found.Actions] : [];
    });
    return map;
  });
  const [matrixSaveSuccess, setMatrixSaveSuccess] = useState(false);

  // Switch role in matrix
  const handleSelectRoleInMatrix = (roleId: number) => {
    setSelectedRoleForMatrix(roleId);
    const perms = db.getRolePermissions(roleId);
    const map: Record<string, ActionKey[]> = {};
    ALL_SCREENS.forEach((s) => {
      const found = perms.find((p) => p.Screen === s.key);
      map[s.key] = found ? [...found.Actions] : [];
    });
    setMatrixState(map);
    setMatrixSaveSuccess(false);
  };

  const handleToggleMatrixAction = (screen: ScreenKey, action: ActionKey) => {
    if (selectedRoleForMatrix === 1) return; // Admin is immutable
    setMatrixState((prev) => {
      const current = prev[screen] || [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [screen]: next };
    });
    setMatrixSaveSuccess(false);
  };

  const handleToggleAllActionsForScreen = (screen: ScreenKey) => {
    if (selectedRoleForMatrix === 1) return;
    setMatrixState((prev) => {
      const current = prev[screen] || [];
      const allActionKeys = ALL_ACTIONS.map((a) => a.key);
      const isAllSelected = current.length === allActionKeys.length;
      return {
        ...prev,
        [screen]: isAllSelected ? [] : allActionKeys,
      };
    });
    setMatrixSaveSuccess(false);
  };

  const handleSelectAllMatrix = () => {
    if (selectedRoleForMatrix === 1) return;
    const map: Record<string, ActionKey[]> = {};
    const allActionKeys = ALL_ACTIONS.map((a) => a.key);
    ALL_SCREENS.forEach((s) => {
      map[s.key] = allActionKeys;
    });
    setMatrixState(map);
    setMatrixSaveSuccess(false);
  };

  const handleClearAllMatrix = () => {
    if (selectedRoleForMatrix === 1) return;
    const map: Record<string, ActionKey[]> = {};
    ALL_SCREENS.forEach((s) => {
      map[s.key] = [];
    });
    setMatrixState(map);
    setMatrixSaveSuccess(false);
  };

  const handleSaveMatrix = () => {
    if (!currentUser || selectedRoleForMatrix === 1) return;
    const permissionsPayload = Object.entries(matrixState).map(([screen, actions]) => ({
      screen: screen as ScreenKey,
      actions,
    }));
    db.setAllRolePermissions(selectedRoleForMatrix, permissionsPayload, currentUser.UserID);
    setMatrixSaveSuccess(true);
    setTimeout(() => setMatrixSaveSuccess(false), 2500);
  };

  // --- USER CRUD HANDLERS ---
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserFormData({
      UserName: '',
      PasswordHash: '123456',
      FullName: '',
      EmpID: null,
      BranchID: null,
      RoleID: roles[1]?.RoleID || roles[0]?.RoleID || 1,
      IsActive: 1,
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUserId(user.UserID);
    setUserFormData({
      UserName: user.UserName,
      PasswordHash: user.PasswordHash,
      FullName: user.FullName,
      EmpID: user.EmpID || null,
      BranchID: user.BranchID || null,
      RoleID: user.RoleID || 1,
      IsActive: user.IsActive,
    });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userFormData.UserName.trim() || !userFormData.FullName.trim()) return;

    const selectedRole = roles.find((r) => r.RoleID === Number(userFormData.RoleID));

    if (editingUserId) {
      const existing = users.find((u) => u.UserID === editingUserId);
      if (existing) {
        const res = db.updateUser(
          {
            ...existing,
            UserName: userFormData.UserName.trim(),
            FullName: userFormData.FullName.trim(),
            PasswordHash: userFormData.PasswordHash,
            EmpID: userFormData.EmpID ? Number(userFormData.EmpID) : null,
            BranchID: userFormData.BranchID ? Number(userFormData.BranchID) : null,
            RoleID: Number(userFormData.RoleID),
            Role: selectedRole?.RoleName || existing.Role,
            IsActive: userFormData.IsActive,
          },
          currentUser.UserID
        );
        if (!res.success && res.message) {
          alert(res.message);
          return;
        }
      }
    } else {
      db.addUser(
        {
          UserName: userFormData.UserName.trim().toLowerCase(),
          PasswordHash: userFormData.PasswordHash,
          FullName: userFormData.FullName.trim(),
          EmpID: userFormData.EmpID ? Number(userFormData.EmpID) : null,
          BranchID: userFormData.BranchID ? Number(userFormData.BranchID) : null,
          RoleID: Number(userFormData.RoleID),
          Role: selectedRole?.RoleName || 'User',
          IsActive: userFormData.IsActive,
        },
        currentUser.UserID
      );
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (userId: number) => {
    if (!currentUser) return;
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) {
      const res = db.deleteUser(userId, currentUser.UserID);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleToggleUserStatus = (userId: number) => {
    if (!currentUser) return;
    const res = db.toggleUserActive(userId, currentUser.UserID);
    if (!res.success && res.message) {
      alert(res.message);
    }
  };

  // --- ROLE CRUD HANDLERS ---
  const handleOpenAddRole = () => {
    setEditingRoleId(null);
    setRoleFormData({ RoleName: '', Description: '' });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setEditingRoleId(role.RoleID);
    setRoleFormData({ RoleName: role.RoleName, Description: role.Description || '' });
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !roleFormData.RoleName.trim()) return;

    if (editingRoleId) {
      const existing = roles.find((r) => r.RoleID === editingRoleId);
      if (existing) {
        const res = db.updateRole(
          {
            ...existing,
            RoleName: roleFormData.RoleName.trim(),
            Description: roleFormData.Description.trim(),
          },
          currentUser.UserID
        );
        if (!res.success && res.message) {
          alert(res.message);
          return;
        }
      }
    } else {
      db.addRole(
        {
          RoleName: roleFormData.RoleName.trim(),
          Description: roleFormData.Description.trim(),
        },
        currentUser.UserID
      );
    }
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (roleId: number) => {
    if (!currentUser) return;
    if (window.confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      const res = db.deleteRole(roleId, currentUser.UserID);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.FullName.toLowerCase().includes(term);
      const matchUsername = u.UserName.toLowerCase().includes(term);
      if (!matchName && !matchUsername) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">إدارة الحسابات والأدوار ومصفوفة الصلاحيات</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            نظام إدارة المستخدمين والصلاحيات
          </h1>
        </div>

        {/* Global Action Button based on sub-tab */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'users' && canCreate && (
            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          )}
          {activeTab === 'roles' && canCreate && (
            <button
              onClick={handleOpenAddRole}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة دور وظيفي</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UsersIcon className="w-3.5 h-3.5" />
          <span>إدارة المستخدمين ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            activeTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>إدارة الأدوار ({roles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>مصفوفة الصلاحيات</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. USERS TAB */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Rules Banner */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">قواعد صلاحيات المستخدمين:</span>
              <p>
                • <strong>مدير النظام (admin):</strong> يمتلك كافة الصلاحيات بصورة دائمة ومحمية ولا يمكن إيقافه أو حذفه.<br />
                • <strong>الحالة:</strong> المستخدم الموقف (غير النشط) يُمنع من تسجيل الدخول فورياً.<br />
                • <strong>نطاق الفرع:</strong> المستخدم المقيد بفرع لا يرى سوى بيانات فرعه المحدد.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم المستخدم أو الاسم الكامل..."
                className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* Users Data (Mobile Cards + Desktop Table) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const branch = branches.find((b) => b.BranchID === u.BranchID);
                const emp = employees.find((e) => e.EmpID === u.EmpID);
                const roleObj = roles.find((r) => r.RoleID === u.RoleID);
                const isAdminUser = u.UserID === 1 || u.UserName.toLowerCase() === 'admin';

                return (
                  <div key={u.UserID} className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{u.FullName}</div>
                        <div className="font-mono text-slate-500 text-xs flex items-center gap-1.5">
                          <span>@{u.UserName}</span>
                          {isAdminUser && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px] font-sans">
                              أساسي
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                          u.RoleID === 1
                            ? 'bg-slate-900 text-white'
                            : u.RoleID === 2
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {roleObj?.RoleName || u.Role}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">نطاق الفرع:</span>
                        <span className="font-medium text-slate-800">
                          {u.BranchID ? branch?.BranchName || `فرع #${u.BranchID}` : <span className="text-emerald-700 font-semibold">كافة الفروع</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">الموظف المرتبط:</span>
                        <span className="text-slate-700">{emp ? `${emp.FullName} (${emp.EmpCode})` : 'حساب نظامي'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div>
                        {canEdit ? (
                          <button
                            disabled={isAdminUser}
                            onClick={() => handleToggleUserStatus(u.UserID)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                              u.IsActive === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {u.IsActive === 1 ? 'نشط' : 'موقف'}
                          </button>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${u.IsActive === 1 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                            {u.IsActive === 1 ? 'نشط' : 'موقف'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        )}
                        {canDelete && !isAdminUser && (
                          <button
                            onClick={() => handleDeleteUser(u.UserID)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">اسم الدخول</th>
                    <th className="py-3 px-4 font-semibold">الاسم الكامل</th>
                    <th className="py-3 px-4 font-semibold">الدور الإداري</th>
                    <th className="py-3 px-4 font-semibold">نطاق الفرع</th>
                    <th className="py-3 px-4 font-semibold">الموظف المرتبط</th>
                    <th className="py-3 px-4 font-semibold text-center">الحالة</th>
                    <th className="py-3 px-4 font-semibold text-center">إجراءات موحدة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const branch = branches.find((b) => b.BranchID === u.BranchID);
                    const emp = employees.find((e) => e.EmpID === u.EmpID);
                    const roleObj = roles.find((r) => r.RoleID === u.RoleID);
                    const isAdminUser = u.UserID === 1 || u.UserName.toLowerCase() === 'admin';

                    return (
                      <tr key={u.UserID} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {u.UserName}
                          {isAdminUser && (
                            <span className="mr-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-sans">
                              أساسي
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.FullName}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              u.RoleID === 1
                                ? 'bg-slate-900 text-white'
                                : u.RoleID === 2
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {roleObj?.RoleName || u.Role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {u.BranchID ? (
                            branch?.BranchName || `فرع #${u.BranchID}`
                          ) : (
                            <span className="text-emerald-700 font-semibold">كافة الفروع</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {emp ? `${emp.FullName} (${emp.EmpCode})` : <span className="text-slate-400">حساب نظامي</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {canEdit ? (
                            <button
                              disabled={isAdminUser}
                              onClick={() => handleToggleUserStatus(u.UserID)}
                              title={isAdminUser ? 'لا يمكن إيقاف حساب المدير العام' : 'تغيير الحالة'}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                u.IsActive === 1
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              }`}
                            >
                              {u.IsActive === 1 ? 'نشط' : 'موقف'}
                            </button>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                                u.IsActive === 1 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                              }`}
                            >
                              {u.IsActive === 1 ? 'نشط' : 'موقف'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                                title="تعديل المستخدم"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && !isAdminUser && (
                              <button
                                onClick={() => handleDeleteUser(u.UserID)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        لا يوجد مستخدمين مطابقين للبحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ROLES TAB */}
      {/* ============================================================ */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">سجل الأدوار الوظيفية (tblRoles)</h3>
                <p className="text-xs text-slate-500">الأدوار المعتمدة وتوزيع الصلاحيات على المستخدمين</p>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {roles.map((r) => {
                const assignedCount = users.filter((u) => u.RoleID === r.RoleID).length;
                const isSystemRole = r.IsSystem === 1 || r.RoleID === 1;

                return (
                  <div key={r.RoleID} className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">#{r.RoleID} • {r.RoleName}</div>
                        <div className="text-slate-600 mt-0.5">{r.Description || '-'}</div>
                      </div>
                      {isSystemRole ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                          نظامي أساسي
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                          مخصص
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="font-mono font-bold text-blue-700">{assignedCount} مستخدم مسند</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditRole(r)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleSelectRoleInMatrix(r.RoleID);
                            setActiveTab('matrix');
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold cursor-pointer"
                        >
                          الصلاحيات
                        </button>
                        {canDelete && !isSystemRole && (
                          <button
                            onClick={() => handleDeleteRole(r.RoleID)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">اسم الدور</th>
                    <th className="py-3 px-4 font-semibold">الوصف</th>
                    <th className="py-3 px-4 font-semibold text-center">المستخدمون المسندون</th>
                    <th className="py-3 px-4 font-semibold text-center">نوع الدور</th>
                    <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.map((r) => {
                    const assignedCount = users.filter((u) => u.RoleID === r.RoleID).length;
                    const isSystemRole = r.IsSystem === 1 || r.RoleID === 1;

                    return (
                      <tr key={r.RoleID} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{r.RoleID}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{r.RoleName}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-md">{r.Description || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-blue-700">
                          {assignedCount} مستخدم
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isSystemRole ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              نظامي أساسي
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              مخصص
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEditRole(r)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                                title="تعديل الدور"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleSelectRoleInMatrix(r.RoleID);
                                setActiveTab('matrix');
                              }}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold cursor-pointer transition-colors"
                              title="تعديل الصلاحيات في المصفوفة"
                            >
                              الصلاحيات
                            </button>
                            {canDelete && !isSystemRole && (
                              <button
                                onClick={() => handleDeleteRole(r.RoleID)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                                title="حذف الدور"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. PERMISSION MATRIX TAB */}
      {/* ============================================================ */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Top Selection & Action Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700">اختيار الدور المستهدف:</span>
              <select
                value={selectedRoleForMatrix}
                onChange={(e) => handleSelectRoleInMatrix(Number(e.target.value))}
                className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-slate-50 focus:ring-1 focus:ring-slate-900"
              >
                {roles.map((r) => (
                  <option key={r.RoleID} value={r.RoleID}>
                    {r.RoleName} {r.IsSystem === 1 ? '(مدير النظام - كامل الصلاحيات دائماً)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedRoleForMatrix === 1 ? (
              <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>دور مدير النظام يمتلك كافة الصلاحيات على جميع الشاشات والإجراءات بصورة دائمة.</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSelectAllMatrix}
                  type="button"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  تحديد الكل
                </button>
                <button
                  onClick={handleClearAllMatrix}
                  type="button"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  إلغاء التحديد
                </button>
                {canEdit && (
                  <button
                    onClick={handleSaveMatrix}
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ مصفوفة الصلاحيات</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {matrixSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ مصفوفة الصلاحيات للدور بنجاح وتفعيل التغييرات فورياً!</span>
            </div>
          )}

          {/* Matrix Grid Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold min-w-44">الشاشة / الوحدة</th>
                    {ALL_ACTIONS.map((action) => (
                      <th key={action.key} className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                        {action.label}
                      </th>
                    ))}
                    {selectedRoleForMatrix !== 1 && (
                      <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                        تحكم
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_SCREENS.map((screen) => {
                    const currentActions = matrixState[screen.key] || [];
                    const isAllScreenSelected = currentActions.length === ALL_ACTIONS.length;
                    const isAdmin = selectedRoleForMatrix === 1;

                    return (
                      <tr key={screen.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{screen.label}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{screen.desc}</div>
                        </td>
                        {ALL_ACTIONS.map((action) => {
                          const isChecked = isAdmin ? true : currentActions.includes(action.key);

                          return (
                            <td key={action.key} className="py-3.5 px-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={isAdmin || !canEdit}
                                  checked={isChecked}
                                  onChange={() => handleToggleMatrixAction(screen.key, action.key)}
                                  className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-slate-900 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </label>
                            </td>
                          );
                        })}
                        {!isAdmin && (
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => handleToggleAllActionsForScreen(screen.key)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                            >
                              {isAllScreenSelected ? 'إلغاء' : 'الكل'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* USER MODAL */}
      {/* ============================================================ */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-md p-4 sm:p-6 border border-slate-200 my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {editingUserId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                </h3>
                <p className="text-xs text-slate-500">
                  تحديد بيانات الاعتماد والدور الإداري والفرع المخصص
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shrink-0"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">اسم المستخدم (Username)</label>
                <input
                  type="text"
                  required
                  value={userFormData.UserName}
                  onChange={(e) => setUserFormData({ ...userFormData, UserName: e.target.value })}
                  placeholder="مثال: tareq_sales"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={userFormData.FullName}
                  onChange={(e) => setUserFormData({ ...userFormData, FullName: e.target.value })}
                  placeholder="الاسم الرباعي"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">كلمة المرور</label>
                <input
                  type="text"
                  required
                  value={userFormData.PasswordHash}
                  onChange={(e) => setUserFormData({ ...userFormData, PasswordHash: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الدور الإداري</label>
                  <select
                    value={userFormData.RoleID}
                    onChange={(e) => setUserFormData({ ...userFormData, RoleID: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {roles.map((r) => (
                      <option key={r.RoleID} value={r.RoleID}>
                        {r.RoleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الفرع المخصص</label>
                  <select
                    value={userFormData.BranchID || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, BranchID: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">كافة الفروع (غير مقيد)</option>
                    {branches.map((b) => (
                      <option key={b.BranchID} value={b.BranchID}>
                        {b.BranchName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">الحالة</label>
                  <select
                    value={userFormData.IsActive}
                    onChange={(e) => setUserFormData({ ...userFormData, IsActive: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value={1}>نشط (مفعل)</option>
                    <option value={0}>موقف (معطل)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">ربط بموظف (اختياري)</label>
                  <select
                    value={userFormData.EmpID || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, EmpID: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">(بدون ربط)</option>
                    {employees.map((emp) => (
                      <option key={emp.EmpID} value={emp.EmpID}>
                        {emp.FullName} ({emp.EmpCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  {editingUserId ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ROLE MODAL */}
      {/* ============================================================ */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-sm p-4 sm:p-6 border border-slate-200 my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {editingRoleId ? 'تعديل الدور' : 'إضافة دور جديد'}
                </h3>
                <p className="text-xs text-slate-500">
                  تعريف مسمى الدور والوصف الوظيفي
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shrink-0"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">اسم الدور</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مسؤول المخازن"
                  value={roleFormData.RoleName}
                  onChange={(e) => setRoleFormData({ ...roleFormData, RoleName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">وصف الصلاحيات</label>
                <textarea
                  rows={3}
                  placeholder="وصف مختصر لمسؤوليات وصلاحيات هذا الدور..."
                  value={roleFormData.Description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, Description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  {editingRoleId ? 'حفظ التعديل' : 'إضافة الدور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

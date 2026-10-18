import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import {
  Currency,
  Branch,
} from '../types/database';
import {
  Download,
  Upload,
  RefreshCw,
  Check,
  Copy,
  AlertOctagon,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { AndroidAppModal } from './AndroidAppModal';

export const SettingsView: React.FC = () => {
  const { currentUser, hasPermission, canAccessScreen } = useAuth();
  const dbState = db.getState();

  const canView = canAccessScreen('settings');
  const canCreate = hasPermission('settings', 'create');
  const canEdit = hasPermission('settings', 'edit');
  const canDelete = hasPermission('settings', 'delete');
  const canExport = hasPermission('imports', 'export') || hasPermission('settings', 'export');
  const canImport = hasPermission('imports', 'import') || hasPermission('settings', 'import');

  type TabKey =
    | 'branches'
    | 'departments'
    | 'currencies'
    | 'jobs'
    | 'reward_categories'
    | 'reward_types'
    | 'violation_types'
    | 'violation_degrees'
    | 'admin_actions'
    | 'company'
    | 'sql'
    | 'android';

  const [activeTab, setActiveTab] = useState<TabKey>('branches');
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedSqlView, setSelectedSqlView] = useState<'qryRptRew' | 'qryRptEmpPerf' | 'qryStats'>('qryRptRew');

  // Forms
  const [newBranch, setNewBranch] = useState({ BranchName: '', BranchCode: '', IsActive: 1 });
  const [newDept, setNewDept] = useState({ DeptName: '', BranchID: dbState.branches[0]?.BranchID || 1 });
  const [newCurrency, setNewCurrency] = useState({ CurrencyName: '', CurrencyCode: '', ExchangeRate: 1, IsDefault: 0 });
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newRewardCat, setNewRewardCat] = useState('');
  const [newRewardType, setNewRewardType] = useState({
    CategoryID: dbState.rewardCategories[0]?.CategoryID || 1,
    RewardDesc: '',
    DefaultPoints: 30,
    DefaultAmount: 20000,
  });
  const [newViolationType, setNewViolationType] = useState('');
  const [newViolationDegree, setNewViolationDegree] = useState({ DegreeName: '', DefaultPenalty: 5000 });
  const [newAdminAction, setNewAdminAction] = useState('');

  // Company settings
  const [companyName, setCompanyName] = useState(db.getSetting('CompanyName', 'مجموعة البحري التجارية'));
  const [headerNote, setHeaderNote] = useState(db.getSetting('HeaderNote', 'الإدارة العامة للموارد البشرية والرقابة الإدارية'));
  const [voucherFooter, setVoucherFooter] = useState(db.getSetting('VoucherFooter', 'تم إنشاء هذا السند عبر نظام الحوافز المعتمد لمجموعة البحري التجارية.'));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Access Restriction: Checked via permissions engine
  if (!currentUser || !canView) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-3 font-['Cairo',sans-serif]">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">لا تملك صلاحية</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          عذراً، حسابك الحالي لا يمتلك صلاحية عرض أو استخدام شاشة إعدادات النظام وقواعد البيانات.
        </p>
      </div>
    );
  }

  const handleToggleBranchActive = (b: Branch) => {
    db.updateBranch({ ...b, IsActive: b.IsActive === 1 ? 0 : 1 }, currentUser.UserID);
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.BranchName.trim()) return;
    db.addBranch({ BranchName: newBranch.BranchName, BranchCode: newBranch.BranchCode, IsActive: 1 }, currentUser.UserID);
    setNewBranch({ BranchName: '', BranchCode: '', IsActive: 1 });
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.DeptName.trim()) return;
    db.addDepartment({ DeptName: newDept.DeptName, BranchID: Number(newDept.BranchID) }, currentUser.UserID);
    setNewDept({ DeptName: '', BranchID: dbState.branches[0]?.BranchID || 1 });
  };

  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrency.CurrencyName || !newCurrency.CurrencyCode) return;
    db.addCurrency(
      {
        CurrencyName: newCurrency.CurrencyName,
        CurrencyCode: newCurrency.CurrencyCode.toUpperCase(),
        ExchangeRate: Number(newCurrency.ExchangeRate),
        IsDefault: newCurrency.IsDefault,
      },
      currentUser.UserID
    );
    setNewCurrency({ CurrencyName: '', CurrencyCode: '', ExchangeRate: 1, IsDefault: 0 });
  };

  const handleSetDefaultCurrency = (c: Currency) => {
    db.updateCurrency({ ...c, IsDefault: 1 }, currentUser.UserID);
  };

  const handleAddJobTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;
    const newId = (dbState.jobTitles.length ? Math.max(...dbState.jobTitles.map((j) => j.JobID)) : 0) + 1;
    dbState.jobTitles.push({ JobID: newId, JobTitle: newJobTitle.trim() });
    db.logAudit(currentUser.UserID, 'INSERT', 'tblJobTitles', newId, `إضافة مسمى وظيفي: ${newJobTitle}`);
    db.getState();
    setNewJobTitle('');
  };

  const handleAddRewardCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardCat.trim()) return;
    const newId = (dbState.rewardCategories.length ? Math.max(...dbState.rewardCategories.map((c) => c.CategoryID)) : 0) + 1;
    dbState.rewardCategories.push({ CategoryID: newId, CategoryName: newRewardCat.trim() });
    db.logAudit(currentUser.UserID, 'INSERT', 'tblRewardCategories', newId, `إضافة تصنيف حوافز: ${newRewardCat}`);
    setNewRewardCat('');
  };

  const handleAddRewardType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardType.RewardDesc.trim()) return;
    db.addRewardType(
      {
        CategoryID: Number(newRewardType.CategoryID),
        RewardDesc: newRewardType.RewardDesc,
        DefaultPoints: Number(newRewardType.DefaultPoints),
        DefaultAmount: Number(newRewardType.DefaultAmount),
      },
      currentUser.UserID
    );
    setNewRewardType({
      CategoryID: dbState.rewardCategories[0]?.CategoryID || 1,
      RewardDesc: '',
      DefaultPoints: 30,
      DefaultAmount: 20000,
    });
  };

  const handleAddViolationType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViolationType.trim()) return;
    db.addViolationType({ ViolationName: newViolationType.trim() }, currentUser.UserID);
    setNewViolationType('');
  };

  const handleAddViolationDegree = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViolationDegree.DegreeName.trim()) return;
    const newId = (dbState.violationDegrees.length ? Math.max(...dbState.violationDegrees.map((d) => d.DegreeID)) : 0) + 1;
    dbState.violationDegrees.push({
      DegreeID: newId,
      DegreeName: newViolationDegree.DegreeName.trim(),
      DefaultPenalty: Number(newViolationDegree.DefaultPenalty),
    });
    db.logAudit(currentUser.UserID, 'INSERT', 'tblViolationDegrees', newId, `إضافة درجة مخالفة: ${newViolationDegree.DegreeName}`);
    setNewViolationDegree({ DegreeName: '', DefaultPenalty: 5000 });
  };

  const handleAddAdminAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminAction.trim()) return;
    const newId = (dbState.adminActions.length ? Math.max(...dbState.adminActions.map((a) => a.ActionID)) : 0) + 1;
    dbState.adminActions.push({ ActionID: newId, ActionName: newAdminAction.trim() });
    db.logAudit(currentUser.UserID, 'INSERT', 'tblAdminActions', newId, `إضافة إجراء إداري: ${newAdminAction}`);
    setNewAdminAction('');
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSetting('CompanyName', companyName, currentUser.UserID);
    db.updateSetting('HeaderNote', headerNote, currentUser.UserID);
    db.updateSetting('VoucherFooter', voucherFooter, currentUser.UserID);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportSqlFile = () => {
    const sql = db.exportToSql();
    const blob = new Blob([sql], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `albahri_incentives_backup_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySql = () => {
    const sql = db.exportToSql();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportJsonFile = () => {
    const jsonStr = JSON.stringify(dbState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `albahri_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = db.importJson(content, currentUser.UserID);
      if (ok) {
        setImportStatus('تم استيراد البيانات بنجاح!');
      } else {
        setImportStatus('فشل استيراد الملف. تأكد من صحة التنسيق.');
      }
      setTimeout(() => setImportStatus(null), 3500);
    };
    reader.readAsText(file);
  };

  const handleResetFactory = () => {
    if (
      window.confirm(
        'تحذير: هل أنت متأكد من إعادة ضبط النظام للحالة الافتراضية؟ سيتم إفراغ الفروع والموظفين والحوافز.'
      )
    ) {
      db.resetToDefault(currentUser.UserID);
      alert('تمت إعادة ضبط النظام بنجاح.');
    }
  };

  const tabsConfig = [
    { id: 'branches', label: 'الفروع (tblBranches)' },
    { id: 'departments', label: 'الأقسام (tblDepartments)' },
    { id: 'currencies', label: 'العملات (tblCurrencies)' },
    { id: 'jobs', label: 'المسميات (tblJobTitles)' },
    { id: 'reward_categories', label: 'تصنيفات الحوافز' },
    { id: 'reward_types', label: 'أنواع الحوافز' },
    { id: 'violation_types', label: 'أنواع المخالفات' },
    { id: 'violation_degrees', label: 'درجات المخالفات' },
    { id: 'admin_actions', label: 'الإجراءات الإدارية' },
    { id: 'company', label: 'بيانات المؤسسة' },
    { id: 'sql', label: 'إدارة قاعدة بيانات SQL' },
    { id: 'android', label: 'تطبيق الأندرويد (App)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="text-xs text-slate-500 mb-1">لوحة الإدارة الفنية (Admin Only)</div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          إعدادات النظام وقاعدة بيانات SQLite
        </h1>
        <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
          ملاحظة: لحماية تكامل البيانات والعلاقات الخارجية، يتم استخدام التعطيل الناعم (IsActive=0) بدلاً من الحذف المباشر للجداول المرتبطة.
        </p>
      </div>

      {/* Tabs Navbar */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        {tabsConfig.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabKey)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. BRANCHES (tblBranches) */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">سجل الفروع المعتمدة (tblBranches)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">اسم الفرع</th>
                    <th className="py-3 px-4 font-semibold">الكود</th>
                    <th className="py-3 px-4 font-semibold">الحالة (IsActive)</th>
                    <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.branches.map((b) => (
                    <tr key={b.BranchID} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{b.BranchID}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{b.BranchName}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{b.BranchCode || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${b.IsActive === 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {b.IsActive === 1 ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleBranchActive(b)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded cursor-pointer border border-slate-200"
                        >
                          {b.IsActive === 1 ? 'تعطيل (IsActive=0)' : 'تفعيل (IsActive=1)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dbState.branches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        لا توجد فروع مسجلة حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة فرع جديد</h4>
            <form onSubmit={handleAddBranch} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم الفرع"
                value={newBranch.BranchName}
                onChange={(e) => setNewBranch({ ...newBranch, BranchName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="كود الفرع (مثال: BR-01)"
                value={newBranch.BranchCode}
                onChange={(e) => setNewBranch({ ...newBranch, BranchCode: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة الفرع
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. DEPARTMENTS (tblDepartments) */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">سجل الأقسام (tblDepartments)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">اسم القسم</th>
                    <th className="py-3 px-4 font-semibold">الفرع التابع (BranchID)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.departments.map((d) => {
                    const b = dbState.branches.find((br) => br.BranchID === d.BranchID);
                    return (
                      <tr key={d.DeptID} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{d.DeptID}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{d.DeptName}</td>
                        <td className="py-3.5 px-4 text-slate-700">{b?.BranchName || 'غير محدد'}</td>
                      </tr>
                    );
                  })}
                  {dbState.departments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        لا توجد أقسام مسجلة حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة قسم جديد</h4>
            <form onSubmit={handleAddDept} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم القسم"
                value={newDept.DeptName}
                onChange={(e) => setNewDept({ ...newDept, DeptName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <select
                value={newDept.BranchID}
                onChange={(e) => setNewDept({ ...newDept, BranchID: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                {dbState.branches.map((b) => (
                  <option key={b.BranchID} value={b.BranchID}>
                    {b.BranchName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={dbState.branches.length === 0}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                إضافة القسم
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. CURRENCIES (tblCurrencies) */}
      {activeTab === 'currencies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">سجل العملات (tblCurrencies)</h3>
              <p className="text-xs text-slate-500">تعدد العملات والتحويل</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">اسم العملة</th>
                    <th className="py-3 px-4 font-semibold">الرمز (Code)</th>
                    <th className="py-3 px-4 font-semibold">سعر الصرف</th>
                    <th className="py-3 px-4 font-semibold">الافتراضية</th>
                    <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.currencies.map((c) => (
                    <tr key={c.CurrencyID} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.CurrencyName}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.CurrencyCode}</td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800 font-semibold">{c.ExchangeRate}</td>
                      <td className="py-3.5 px-4">
                        {c.IsDefault === 1 ? (
                          <span className="text-xs font-semibold text-emerald-700">نعم (الافتراضية)</span>
                        ) : (
                          <span className="text-xs text-slate-400">لا</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.IsDefault !== 1 && (
                          <button
                            onClick={() => handleSetDefaultCurrency(c)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded cursor-pointer border border-blue-200"
                          >
                            تعيين كافتراضية
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة عملة جديدة</h4>
            <form onSubmit={handleAddCurrency} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم العملة"
                value={newCurrency.CurrencyName}
                onChange={(e) => setNewCurrency({ ...newCurrency, CurrencyName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="text"
                required
                placeholder="رمز العملة (USD, SAR)"
                maxLength={5}
                value={newCurrency.CurrencyCode}
                onChange={(e) => setNewCurrency({ ...newCurrency, CurrencyCode: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono uppercase"
              />
              <input
                type="number"
                step="0.0001"
                required
                placeholder="سعر الصرف مقابل العملة الافتراضية"
                value={newCurrency.ExchangeRate}
                onChange={(e) => setNewCurrency({ ...newCurrency, ExchangeRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono tabular-nums"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة العملة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. JOB TITLES (tblJobTitles) */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">سجل المسميات الوظيفية (tblJobTitles)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">المسمى الوظيفي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.jobTitles.map((j) => (
                    <tr key={j.JobID} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{j.JobID}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{j.JobTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة مسمى وظيفي جديد</h4>
            <form onSubmit={handleAddJobTitle} className="space-y-3">
              <input
                type="text"
                required
                placeholder="المسمى الوظيفي"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة المسمى
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. REWARD CATEGORIES (tblRewardCategories) */}
      {activeTab === 'reward_categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">تصنيفات الحوافز (tblRewardCategories)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">اسم التصنيف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.rewardCategories.map((c) => (
                    <tr key={c.CategoryID} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{c.CategoryID}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.CategoryName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة تصنيف جديد</h4>
            <form onSubmit={handleAddRewardCategory} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم التصنيف"
                value={newRewardCat}
                onChange={(e) => setNewRewardCat(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة التصنيف
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. REWARD TYPES (tblRewardTypes) */}
      {activeTab === 'reward_types' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">أنواع الحوافز والبنود (tblRewardTypes)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">التصنيف</th>
                    <th className="py-3 px-4 font-semibold">بيان الحافز</th>
                    <th className="py-3 px-4 font-semibold text-center">النقاط الافتراضية</th>
                    <th className="py-3 px-4 font-semibold text-left">المبلغ الافتراضي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.rewardTypes.map((rt) => {
                    const cat = dbState.rewardCategories.find((c) => c.CategoryID === rt.CategoryID);
                    return (
                      <tr key={rt.RewardTypeID} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{cat?.CategoryName || 'عام'}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">{rt.RewardDesc}</td>
                        <td className="py-3.5 px-4 text-center font-mono tabular-nums text-blue-700 font-bold">{rt.DefaultPoints}</td>
                        <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-slate-900">
                          {rt.DefaultAmount.toLocaleString()} ريال
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-lg">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة نوع حافز جديد</h4>
            <form onSubmit={handleAddRewardType} className="space-y-3">
              <select
                value={newRewardType.CategoryID}
                onChange={(e) => setNewRewardType({ ...newRewardType, CategoryID: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                {dbState.rewardCategories.map((c) => (
                  <option key={c.CategoryID} value={c.CategoryID}>
                    {c.CategoryName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="بيان الحافز وسببه"
                value={newRewardType.RewardDesc}
                onChange={(e) => setNewRewardType({ ...newRewardType, RewardDesc: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="النقاط"
                  required
                  value={newRewardType.DefaultPoints}
                  onChange={(e) => setNewRewardType({ ...newRewardType, DefaultPoints: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <input
                  type="number"
                  placeholder="المبلغ المالي"
                  required
                  value={newRewardType.DefaultAmount}
                  onChange={(e) => setNewRewardType({ ...newRewardType, DefaultAmount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة نوع الحافز
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. VIOLATION TYPES (tblViolationTypes) */}
      {activeTab === 'violation_types' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">سجل أنواع المخالفات (tblViolationTypes)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">نوع المخالفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.violationTypes.map((vt) => (
                    <tr key={vt.ViolationTypeID} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{vt.ViolationTypeID}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{vt.ViolationName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة نوع مخالفة جديد</h4>
            <form onSubmit={handleAddViolationType} className="space-y-3">
              <input
                type="text"
                required
                placeholder="بيان نوع المخالفة"
                value={newViolationType}
                onChange={(e) => setNewViolationType(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة النوع
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 8. VIOLATION DEGREES (tblViolationDegrees) */}
      {activeTab === 'violation_degrees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">درجات المخالفات (tblViolationDegrees)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">درجة المخالفة</th>
                    <th className="py-3 px-4 font-semibold text-left">الخصم الافتراضي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.violationDegrees.map((vd) => (
                    <tr key={vd.DegreeID} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{vd.DegreeID}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{vd.DegreeName}</td>
                      <td className="py-3.5 px-4 text-left font-mono tabular-nums font-bold text-red-700">
                        {vd.DefaultPenalty.toLocaleString()} ريال
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة درجة مخالفة جديدة</h4>
            <form onSubmit={handleAddViolationDegree} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم الدرجة"
                value={newViolationDegree.DegreeName}
                onChange={(e) => setNewViolationDegree({ ...newViolationDegree, DegreeName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="number"
                required
                placeholder="الخصم الافتراضي"
                value={newViolationDegree.DefaultPenalty}
                onChange={(e) => setNewViolationDegree({ ...newViolationDegree, DefaultPenalty: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة الدرجة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. ADMIN ACTIONS (tblAdminActions) */}
      {activeTab === 'admin_actions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">الإجراءات والقرارات الإدارية (tblAdminActions)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">المعرف</th>
                    <th className="py-3 px-4 font-semibold">الإجراء الإداري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbState.adminActions.map((aa) => (
                    <tr key={aa.ActionID} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{aa.ActionID}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{aa.ActionName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-md">
            <h4 className="text-xs font-bold text-slate-900 mb-3">إضافة إجراء إداري جديد</h4>
            <form onSubmit={handleAddAdminAction} className="space-y-3">
              <input
                type="text"
                required
                placeholder="اسم الإجراء الإداري"
                value={newAdminAction}
                onChange={(e) => setNewAdminAction(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                إضافة الإجراء
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. COMPANY SETTINGS */}
      {activeTab === 'company' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">بيانات المؤسسة والترويسة الرسمية</h3>
          <form onSubmit={handleSaveCompanySettings} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">اسم الشركة / المجموعة</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">الترويسة الإدارية</label>
              <input
                type="text"
                value={headerNote}
                onChange={(e) => setHeaderNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">تذييل السندات الرسمية</label>
              <textarea
                rows={3}
                value={voucherFooter}
                onChange={(e) => setVoucherFooter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded text-xs border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تم حفظ إعدادات المؤسسة بنجاح</span>
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              حفظ الإعدادات
            </button>
          </form>
        </div>
      )}

      {/* 11. SQL & BACKUP */}
      {activeTab === 'sql' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">إدارة وتصدير قاعدة بيانات SQLite / SQL</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                تصدير نسخة كاملة من كود SQL متوافقة مع محرك SQLite مع تعطيل وفحص المفاتيح الخارجية بأمان.
              </p>
            </div>

            {importStatus && (
              <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-xs font-medium border border-blue-200">
                {importStatus}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {canExport && (
                <>
                  <button
                    onClick={handleExportSqlFile}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير ملف SQL (.sql)</span>
                  </button>

                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSql ? 'تم نسخ كود SQL!' : 'نسخ كود SQL'}</span>
                  </button>

                  <button
                    onClick={handleExportJsonFile}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير نسخة JSON</span>
                  </button>
                </>
              )}

              {canImport && (
                <label className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>استيراد نسخة JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJsonFile}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* SQLite Views Inspector (access_queries.sql) */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-700 text-white rounded font-mono font-bold text-[10px]">
                      access_queries.sql
                    </span>
                    <span>معاينة استعلامات SQLite Views المعتمدة</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    استعلامات التقارير المحولة من Access إلى Views في قاعدة SQLite المحلية
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setSelectedSqlView('qryRptRew')}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      selectedSqlView === 'qryRptRew'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    qryRptRew (كشف الحوافز)
                  </button>
                  <button
                    onClick={() => setSelectedSqlView('qryRptEmpPerf')}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      selectedSqlView === 'qryRptEmpPerf'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    qryRptEmpPerf (أداء الموظفين)
                  </button>
                  <button
                    onClick={() => setSelectedSqlView('qryStats')}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      selectedSqlView === 'qryStats'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    qryStats (الإحصائيات)
                  </button>
                </div>
              </div>

              {/* View Query Preview & SQL Code */}
              <div className="bg-slate-900 rounded-lg p-3 text-slate-100 font-mono text-[11px] leading-relaxed dir-ltr text-left overflow-x-auto mb-4">
                {selectedSqlView === 'qryRptRew' && (
                  <pre>{`-- 1) qryRptRew : تقرير كشف الحوافز
CREATE VIEW IF NOT EXISTS qryRptRew AS
SELECT
  R.RewardDate,
  E.EmpCode,
  E.FullName,
  RC.CategoryName,
  T.RewardDesc,
  R.Points,
  R.Amount,
  R.Status
FROM tblRewards AS R
INNER JOIN tblEmployees AS E ON R.EmpID = E.EmpID
LEFT JOIN tblRewardTypes AS T ON R.RewardTypeID = T.RewardTypeID
LEFT JOIN tblRewardCategories AS RC ON T.CategoryID = RC.CategoryID
ORDER BY R.RewardDate DESC;`}</pre>
                )}
                {selectedSqlView === 'qryRptEmpPerf' && (
                  <pre>{`-- 2) qryRptEmpPerf : ملخص أداء الموظفين
CREATE VIEW IF NOT EXISTS qryRptEmpPerf AS
SELECT
  E.EmpCode,
  E.FullName,
  B.BranchName,
  D.DeptName,
  IFNULL((SELECT COUNT(*) FROM tblViolations V WHERE V.EmpID = E.EmpID), 0) AS VioCount,
  IFNULL((SELECT SUM(V2.PenaltyAmount) FROM tblViolations V2 WHERE V2.EmpID = E.EmpID), 0) AS VioAmt,
  IFNULL((SELECT COUNT(*) FROM tblRewards R WHERE R.EmpID = E.EmpID), 0) AS RewCount,
  IFNULL((SELECT SUM(R2.Amount) FROM tblRewards R2 WHERE R2.EmpID = E.EmpID), 0) AS RewAmt,
  IFNULL((SELECT SUM(R3.Points) FROM tblRewards R3 WHERE R3.EmpID = E.EmpID), 0) AS Points
FROM tblEmployees AS E
LEFT JOIN tblBranches AS B ON E.BranchID = B.BranchID
LEFT JOIN tblDepartments AS D ON E.DeptID = D.DeptID
WHERE E.IsActive = 1
ORDER BY VioCount DESC, Points DESC;`}</pre>
                )}
                {selectedSqlView === 'qryStats' && (
                  <pre>{`-- 3) qryStats : إحصائيات شهرية
CREATE VIEW IF NOT EXISTS qryStats AS
SELECT
  strftime('%Y-%m', R.RewardDate) AS YearMonth,
  COUNT(DISTINCT R.EmpID) AS EmployeesWithRewards,
  COUNT(R.RewardID) AS RewardsCount,
  IFNULL(SUM(R.Amount), 0) AS RewardsAmount,
  IFNULL(SUM(R.Points), 0) AS TotalPoints,
  (SELECT COUNT(*) FROM tblViolations V WHERE strftime('%Y-%m', V.ViolationDate) = strftime('%Y-%m', R.RewardDate)) AS ViolationsCount,
  (SELECT IFNULL(SUM(V2.PenaltyAmount), 0) FROM tblViolations V2 WHERE strftime('%Y-%m', V2.ViolationDate) = strftime('%Y-%m', R.RewardDate)) AS ViolationsAmount
FROM tblRewards AS R
GROUP BY strftime('%Y-%m', R.RewardDate)
ORDER BY YearMonth DESC;`}</pre>
                )}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">مخطط SQLite الكامل (DDL + DML + Views):</span>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-[11px] font-mono h-60 overflow-y-auto leading-relaxed dir-ltr text-left">
                {db.exportToSql()}
              </pre>
            </div>
          </div>

          <div className="bg-red-50/50 border border-red-200 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs mb-1">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>إعادة ضبط المصنع (Factory Reset)</span>
              </div>
              <p className="text-[11px] text-red-700">
                إرجاع النظام لحالته الأولية مع تفريغ سجلات الفروع والموظفين والمخالفات والحوافز.
              </p>
            </div>
            <button
              onClick={handleResetFactory}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة الضبط</span>
            </button>
          </div>
        </div>
      )}

      {/* 12. ANDROID APP & PWA CENTER */}
      {activeTab === 'android' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">تطبيق الأندرويد والتوافق الشامل مع كافة الشاشات</h3>
                  <p className="text-xs text-slate-500">
                    تهيئة نظام التشغيل كـ App أندرويد مستقل وتصدير حزمة ملفات البناء (Android Package .zip)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAndroidModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                <span>فتح مركز تطبيق الأندرويد والتصدير</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-900">1. التثبيت المباشر الفوري:</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  تثبيت فوري على هواتف سامسونج، شاومي، بكسل وغيرها كـ WebAPK رسمي مدمج في النظام.
                </p>
                <button
                  onClick={() => setShowAndroidModal(true)}
                  className="w-full mt-2 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  بدء التثبيت على الهاتف
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-900">2. تصدير ملفات APK والمشروع:</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  تنزيل ملف .zip يحتوي على AndroidManifest.xml وأيقونات mipmap وإعدادات Gradle للبناء.
                </p>
                <button
                  onClick={() => setShowAndroidModal(true)}
                  className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                >
                  تصدير حزمة الأندرويد (.zip)
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-900">3. محاكي توافق الشاشات:</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  معاينة واجهات النظام على مختلف مقاسات الهواتف والأجهزة اللوحية (360px إلى 1024px+).
                </p>
                <button
                  onClick={() => setShowAndroidModal(true)}
                  className="w-full mt-2 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 cursor-pointer"
                >
                  تشغيل محاكي الشاشات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Android Center Modal */}
      <AndroidAppModal isOpen={showAndroidModal} onClose={() => setShowAndroidModal(false)} />
    </div>
  );
};

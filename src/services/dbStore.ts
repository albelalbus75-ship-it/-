import {
  Currency,
  Branch,
  Department,
  JobTitle,
  JobDuty,
  Employee,
  User,
  Setting,
  RewardCategory,
  RewardType,
  Reward,
  ExtraWork,
  PerformanceEval,
  ViolationType,
  ViolationDegree,
  AdminAction,
  Violation,
  AuditLog,
  DatabaseState,
  Role,
  RolePermission,
  ScreenKey,
  ActionKey,
  ImportLog,
  ImportLogError,
  SyncLog,
} from '../types/database';

export const ALL_SCREENS: { key: ScreenKey; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'لوحة التحكم', desc: 'مؤشرات الأداء المركزية والإحصاءات العامة' },
  { key: 'employees', label: 'الموظفين', desc: 'دليل وبيانات وسجلات الموظفين' },
  { key: 'branches', label: 'الفروع', desc: 'إدارة فروع المؤسسة وتسكين الموظفين' },
  { key: 'departments', label: 'الأقسام', desc: 'إدارة الهيكل الإداري والأقسام' },
  { key: 'rewards', label: 'الحوافز', desc: 'صرف واعتماد وتعديل الحوافز والمكافآت' },
  { key: 'violations', label: 'المخالفات', desc: 'تسجيل وتوثيق المخالفات والوقائع' },
  { key: 'penalties', label: 'الجزاءات', desc: 'إجراءات وخصومات الجزاءات الإدارية' },
  { key: 'reports', label: 'التقارير', desc: 'تقارير الأداء، الإحصائيات، وكشوفات الحساب' },
  { key: 'users', label: 'المستخدمين', desc: 'إدارة المستخدمين والأدوار ومصفوفة الصلاحيات' },
  { key: 'settings', label: 'الإعدادات', desc: 'إعدادات النظام العامة وقواعد البيانات' },
  { key: 'imports', label: 'الاستيراد', desc: 'استيراد وتصدير النسخ الاحتياطية' },
];

export const ALL_ACTIONS: { key: ActionKey; label: string; badge: string }[] = [
  { key: 'view', label: 'عرض', badge: 'bg-slate-100 text-slate-800' },
  { key: 'create', label: 'إضافة', badge: 'bg-emerald-100 text-emerald-800' },
  { key: 'edit', label: 'حفظ/تعديل', badge: 'bg-blue-100 text-blue-800' },
  { key: 'delete', label: 'حذف', badge: 'bg-red-100 text-red-800' },
  { key: 'approve', label: 'اعتماد', badge: 'bg-purple-100 text-purple-800' },
  { key: 'print', label: 'طباعة', badge: 'bg-amber-100 text-amber-800' },
  { key: 'export', label: 'تصدير', badge: 'bg-indigo-100 text-indigo-800' },
  { key: 'import', label: 'استيراد', badge: 'bg-teal-100 text-teal-800' },
];

const STORAGE_KEY = 'albahri_incentives_db_v4';

// Initial state with branches, departments, and employees empty at first launch
const INITIAL_STATE: DatabaseState = {
  currencies: [
    { CurrencyID: 1, CurrencyName: 'ريال يمني', CurrencyCode: 'YER', ExchangeRate: 1, IsDefault: 1 },
    { CurrencyID: 2, CurrencyName: 'ريال سعودي', CurrencyCode: 'SAR', ExchangeRate: 420, IsDefault: 0 },
    { CurrencyID: 3, CurrencyName: 'دولار أمريكي', CurrencyCode: 'USD', ExchangeRate: 1610, IsDefault: 0 },
  ],
  branches: [],
  departments: [],
  jobTitles: [
    { JobID: 1, JobTitle: 'مدير فرع' },
    { JobID: 2, JobTitle: 'محاسب عام' },
    { JobID: 3, JobTitle: 'مسؤول مبيعات' },
    { JobID: 4, JobTitle: 'أمين مخزن' },
    { JobID: 5, JobTitle: 'مشرف تسويق' },
    { JobID: 6, JobTitle: 'فني صيانة' },
    { JobID: 7, JobTitle: 'سائق توزيع' },
    { JobID: 8, JobTitle: 'خدمة عملاء' },
  ],
  jobDuties: [
    { DutyID: 1, JobID: 1, DutyDesc: 'إدارة العمليات التشغيلية اليومية للفرع' },
    { DutyID: 2, JobID: 2, DutyDesc: 'إعداد التقارير المالية وضبط الحسابات' },
    { DutyID: 3, JobID: 3, DutyDesc: 'متابعة العملاء وتحقيق مستهدفات المبيعات' },
    { DutyID: 4, JobID: 4, DutyDesc: 'إدارة حركة المخزون وضبط الوارد والمنصرف' },
    { DutyID: 5, JobID: 5, DutyDesc: 'تنفيذ الخطط التسويقية الميدانية' },
    { DutyID: 6, JobID: 6, DutyDesc: 'صيانة ومتابعة المعدات التقنية والتشغيلية' },
    { DutyID: 7, JobID: 7, DutyDesc: 'توزيع البضائع للعملاء والالتزام بالجدول' },
    { DutyID: 8, JobID: 8, DutyDesc: 'استقبال بلاغات العملاء وتقديم الدعم' },
  ],
  employees: [],
  roles: [
    {
      RoleID: 1,
      RoleName: 'مدير النظام (Admin)',
      Description: 'صلاحيات كاملة وغير مقيدة على كافة الشاشات والإجراءات',
      IsSystem: 1,
    },
    {
      RoleID: 2,
      RoleName: 'مدير فرع (Manager)',
      Description: 'إدارة العمليات والاعتماد والتقارير ضمن الفرع',
      IsSystem: 0,
    },
    {
      RoleID: 3,
      RoleName: 'مستخدم تشغيلي (User)',
      Description: 'إدخال ومتابعة الحوافز والعمليات اليومية',
      IsSystem: 0,
    },
    {
      RoleID: 4,
      RoleName: 'مستعرض الموظفين (Viewer)',
      Description: 'صلاحية استعراض بيانات الموظفين فقط بدون صلاحيات تعديل أو إضافة',
      IsSystem: 0,
    },
  ],
  rolePermissions: [
    // Manager permissions
    { RoleID: 2, Screen: 'dashboard', Actions: ['view', 'print', 'export'] },
    { RoleID: 2, Screen: 'employees', Actions: ['view', 'create', 'edit', 'print', 'export'] },
    { RoleID: 2, Screen: 'branches', Actions: ['view'] },
    { RoleID: 2, Screen: 'departments', Actions: ['view'] },
    { RoleID: 2, Screen: 'rewards', Actions: ['view', 'create', 'edit', 'approve', 'print', 'export'] },
    { RoleID: 2, Screen: 'violations', Actions: ['view', 'create', 'edit', 'approve', 'print', 'export'] },
    { RoleID: 2, Screen: 'penalties', Actions: ['view', 'print', 'export'] },
    { RoleID: 2, Screen: 'reports', Actions: ['view', 'print', 'export'] },
    { RoleID: 2, Screen: 'users', Actions: ['view'] },
    { RoleID: 2, Screen: 'settings', Actions: ['view'] },
    { RoleID: 2, Screen: 'imports', Actions: ['view', 'import'] },

    // User permissions
    { RoleID: 3, Screen: 'dashboard', Actions: ['view'] },
    { RoleID: 3, Screen: 'employees', Actions: ['view'] },
    { RoleID: 3, Screen: 'branches', Actions: ['view'] },
    { RoleID: 3, Screen: 'departments', Actions: ['view'] },
    { RoleID: 3, Screen: 'rewards', Actions: ['view', 'create', 'print'] },
    { RoleID: 3, Screen: 'violations', Actions: ['view', 'create', 'print'] },
    { RoleID: 3, Screen: 'penalties', Actions: ['view'] },
    { RoleID: 3, Screen: 'reports', Actions: ['view', 'print'] },

    // Viewer permissions: ONLY view on employees! Requirement 7
    { RoleID: 4, Screen: 'employees', Actions: ['view'] },
  ],
  users: [
    {
      UserID: 1,
      UserName: 'admin',
      PasswordHash: 'admin123',
      FullName: 'المدير العام (النظام)',
      EmpID: null,
      BranchID: null,
      RoleID: 1,
      Role: 'Admin',
      IsActive: 1,
    },
    {
      UserID: 2,
      UserName: 'hrmanager',
      PasswordHash: 'hr123',
      FullName: 'مسؤول الموارد البشرية',
      EmpID: null,
      BranchID: null,
      RoleID: 2,
      Role: 'Manager',
      IsActive: 1,
    },
    {
      UserID: 3,
      UserName: 'accountant',
      PasswordHash: 'acc123',
      FullName: 'المحاسب المالي',
      EmpID: null,
      BranchID: null,
      RoleID: 3,
      Role: 'User',
      IsActive: 1,
    },
    {
      UserID: 4,
      UserName: 'viewer',
      PasswordHash: 'viewer123',
      FullName: 'مستعرض الموظفين (تجربة الصلاحيات)',
      EmpID: null,
      BranchID: null,
      RoleID: 4,
      Role: 'Viewer',
      IsActive: 1,
    },
  ],
  settings: [
    { SettingID: 1, SettingKey: 'CompanyName', SettingValue: 'مجموعة البحري التجارية' },
    { SettingID: 2, SettingKey: 'SystemTitle', SettingValue: 'نظام إدارة الحوافز والمكافآت' },
    { SettingID: 3, SettingKey: 'TaxId', SettingValue: 'TAX-YER-998842' },
    { SettingID: 4, SettingKey: 'HeaderNote', SettingValue: 'الإدارة العامة للموارد البشرية والرقابة الإدارية' },
    { SettingID: 5, SettingKey: 'VoucherFooter', SettingValue: 'تم إنشاء هذا السند عبر نظام الحوافز المعتمد لمجموعة البحري التجارية.' },
    { SettingID: 6, SettingKey: 'AllowManagerPenaltyEntry', SettingValue: '1' },
  ],
  rewardCategories: [
    { CategoryID: 1, CategoryName: 'حوافز الإنتاجية والمبيعات' },
    { CategoryID: 2, CategoryName: 'حوافز الانضباط والالتزام' },
    { CategoryID: 3, CategoryName: 'مكافآت الإنجاز والتميز' },
  ],
  rewardTypes: [
    { RewardTypeID: 1, CategoryID: 1, RewardDesc: 'تحقيق المستهدف البيعي الشهري', DefaultPoints: 50, DefaultAmount: 40000 },
    { RewardTypeID: 2, CategoryID: 1, RewardDesc: 'زيادة حجم المبيعات الميدانية', DefaultPoints: 20, DefaultAmount: 20000 },
    { RewardTypeID: 3, CategoryID: 2, RewardDesc: 'انضباط الحضور والانصراف الكامل', DefaultPoints: 30, DefaultAmount: 25000 },
    { RewardTypeID: 4, CategoryID: 3, RewardDesc: 'مبادرة متميزة وحل مشكلة تشغيلية', DefaultPoints: 100, DefaultAmount: 75000 },
    { RewardTypeID: 5, CategoryID: 3, RewardDesc: 'خدمة عملاء استثنائية وبلا شكاوى', DefaultPoints: 60, DefaultAmount: 50000 },
    { RewardTypeID: 6, CategoryID: 2, RewardDesc: 'الالتزام بمعايير السلامة المهنية', DefaultPoints: 25, DefaultAmount: 18000 },
  ],
  rewards: [],
  extraWork: [],
  performanceEvals: [],
  violationTypes: [
    { ViolationTypeID: 1, ViolationName: 'تأخر عن العمل بدون إذن مسبق' },
    { ViolationTypeID: 2, ViolationName: 'غياب بدون عذر مقبول' },
    { ViolationTypeID: 3, ViolationName: 'مخالفة التعليمات واللوائح الإدارية' },
    { ViolationTypeID: 4, ViolationName: 'إهمال العهدة والمعدات التشغيلية' },
    { ViolationTypeID: 5, ViolationName: 'سوء التعامل مع الزملاء أو العملاء' },
  ],
  violationDegrees: [
    { DegreeID: 1, DegreeName: 'الدرجة الأولى (مخالفة بسيطة)', DefaultPenalty: 3000 },
    { DegreeID: 2, DegreeName: 'الدرجة الثانية (مخالفة متوسطة)', DefaultPenalty: 7000 },
    { DegreeID: 3, DegreeName: 'الدرجة الثالثة (مخالفة جسيمة)', DefaultPenalty: 15000 },
  ],
  adminActions: [
    { ActionID: 1, ActionName: 'تنبيه شفهي مسجل' },
    { ActionID: 2, ActionName: 'إنذار كتابي رسمي' },
    { ActionID: 3, ActionName: 'خصم مالي مباشر من الحافز' },
    { ActionID: 4, ActionName: 'إيقاف مؤقت عن العمل' },
    { ActionID: 5, ActionName: 'إحالة إلى التحقيق الإداري' },
  ],
  violations: [],
  auditLogs: [
    {
      LogID: 1,
      UserID: 1,
      ActionType: 'LOGIN',
      TableName: 'tblUsers',
      RecordID: 1,
      LogDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      Details: 'تهيئة قاعدة البيانات ونظام الصلاحيات',
    },
  ],
  importLogs: [],
  syncLogs: [],
};

class DatabaseStore {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...INITIAL_STATE,
            ...parsed,
            // Ensure branches, departments, employees are never auto-seeded if empty
            branches: Array.isArray(parsed.branches) ? parsed.branches : [],
            departments: Array.isArray(parsed.departments) ? parsed.departments : [],
            employees: Array.isArray(parsed.employees) ? parsed.employees : [],
            roles: Array.isArray(parsed.roles) && parsed.roles.length ? parsed.roles : INITIAL_STATE.roles,
            rolePermissions: Array.isArray(parsed.rolePermissions) && parsed.rolePermissions.length ? parsed.rolePermissions : INITIAL_STATE.rolePermissions,
            users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : INITIAL_STATE.users,
            rewards: Array.isArray(parsed.rewards) ? parsed.rewards : [],
            violations: Array.isArray(parsed.violations) ? parsed.violations : [],
            extraWork: Array.isArray(parsed.extraWork) ? parsed.extraWork : [],
            performanceEvals: Array.isArray(parsed.performanceEvals) ? parsed.performanceEvals : [],
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
            importLogs: Array.isArray(parsed.importLogs) ? parsed.importLogs : [],
            syncLogs: Array.isArray(parsed.syncLogs) ? parsed.syncLogs : [],
          };
        }
      }
    } catch (e) {
      console.error('Failed to load database state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  private persist() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.error('Failed to save database state to localStorage:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToDefault(userId: number = 1): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.logAudit(userId, 'RESTORE', 'all', null, 'إعادة ضبط قاعدة البيانات للحالة الافتراضية');
    this.persist();
  }

  public logAudit(
    userId: number,
    actionType: AuditLog['ActionType'],
    tableName: string,
    recordId: number | null,
    details: string
  ): void {
    const newLog: AuditLog = {
      LogID: (this.state.auditLogs.length ? Math.max(...this.state.auditLogs.map((l) => l.LogID)) : 0) + 1,
      UserID: userId,
      ActionType: actionType,
      TableName: tableName,
      RecordID: recordId,
      LogDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      Details: details,
    };
    this.state.auditLogs.unshift(newLog);
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 200);
    }
  }

  // --- CRUD: REWARDS ---
  public addReward(reward: Omit<Reward, 'RewardID' | 'CreatedAt'>, currentUserId: number): Reward {
    const newId = (this.state.rewards.length ? Math.max(...this.state.rewards.map((r) => r.RewardID)) : 0) + 1;
    const newRecord: Reward = {
      ...reward,
      RewardID: newId,
      CreatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.state.rewards.unshift(newRecord);
    const emp = this.state.employees.find((e) => e.EmpID === reward.EmpID);
    this.logAudit(
      currentUserId,
      'INSERT',
      'tblRewards',
      newId,
      `إضافة حافز للموظف (${emp?.FullName || reward.EmpID}) بمبلغ ${reward.Amount} ونقاط ${reward.Points}`
    );
    this.persist();
    return newRecord;
  }

  public updateReward(reward: Reward, currentUserId: number): void {
    const idx = this.state.rewards.findIndex((r) => r.RewardID === reward.RewardID);
    if (idx !== -1) {
      this.state.rewards[idx] = { ...reward };
      this.logAudit(currentUserId, 'UPDATE', 'tblRewards', reward.RewardID, `تعديل سجل حافز #${reward.RewardID}`);
      this.persist();
    }
  }

  public deleteReward(rewardId: number, currentUserId: number): void {
    const target = this.state.rewards.find((r) => r.RewardID === rewardId);
    this.state.rewards = this.state.rewards.filter((r) => r.RewardID !== rewardId);
    this.logAudit(currentUserId, 'DELETE', 'tblRewards', rewardId, `حذف سجل حافز #${rewardId} (${target?.Amount || 0})`);
    this.persist();
  }

  public setRewardStatus(rewardId: number, status: Reward['Status'], currentUserId: number): void {
    const r = this.state.rewards.find((x) => x.RewardID === rewardId);
    if (r) {
      r.Status = status;
      this.logAudit(currentUserId, 'UPDATE', 'tblRewards', rewardId, `تغيير حالة الحافز #${rewardId} إلى (${status})`);
      this.persist();
    }
  }

  // --- CRUD: VIOLATIONS ---
  public addViolation(violation: Omit<Violation, 'ViolationID' | 'CreatedAt'>, currentUserId: number): Violation {
    const newId = (this.state.violations.length ? Math.max(...this.state.violations.map((v) => v.ViolationID)) : 0) + 1;
    const newRecord: Violation = {
      ...violation,
      ViolationID: newId,
      CreatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.state.violations.unshift(newRecord);
    const emp = this.state.employees.find((e) => e.EmpID === violation.EmpID);
    this.logAudit(
      currentUserId,
      'INSERT',
      'tblViolations',
      newId,
      `إضافة مخالفة للموظف (${emp?.FullName || violation.EmpID}) بخصم ${violation.PenaltyAmount}`
    );
    this.persist();
    return newRecord;
  }

  public updateViolation(violation: Violation, currentUserId: number): void {
    const idx = this.state.violations.findIndex((v) => v.ViolationID === violation.ViolationID);
    if (idx !== -1) {
      this.state.violations[idx] = { ...violation };
      this.logAudit(currentUserId, 'UPDATE', 'tblViolations', violation.ViolationID, `تعديل مخالفة #${violation.ViolationID}`);
      this.persist();
    }
  }

  public deleteViolation(violationId: number, currentUserId: number): void {
    this.state.violations = this.state.violations.filter((v) => v.ViolationID !== violationId);
    this.logAudit(currentUserId, 'DELETE', 'tblViolations', violationId, `حذف مخالفة #${violationId}`);
    this.persist();
  }

  // --- CRUD: EXTRA WORK ---
  public addExtraWork(item: Omit<ExtraWork, 'ExtraID'>, currentUserId: number): ExtraWork {
    const newId = (this.state.extraWork.length ? Math.max(...this.state.extraWork.map((x) => x.ExtraID)) : 0) + 1;
    const newRecord: ExtraWork = {
      ...item,
      ExtraID: newId,
    };
    this.state.extraWork.unshift(newRecord);
    const emp = this.state.employees.find((e) => e.EmpID === item.EmpID);
    this.logAudit(
      currentUserId,
      'INSERT',
      'tblExtraWork',
      newId,
      `إضافة عمل إضافي للموظف (${emp?.FullName || item.EmpID}) بساعات ${item.Hours} ومبلغ ${item.Amount}`
    );
    this.persist();
    return newRecord;
  }

  public updateExtraWork(item: ExtraWork, currentUserId: number): void {
    const idx = this.state.extraWork.findIndex((x) => x.ExtraID === item.ExtraID);
    if (idx !== -1) {
      this.state.extraWork[idx] = { ...item };
      this.logAudit(currentUserId, 'UPDATE', 'tblExtraWork', item.ExtraID, `تعديل عمل إضافي #${item.ExtraID}`);
      this.persist();
    }
  }

  public deleteExtraWork(extraId: number, currentUserId: number): void {
    this.state.extraWork = this.state.extraWork.filter((x) => x.ExtraID !== extraId);
    this.logAudit(currentUserId, 'DELETE', 'tblExtraWork', extraId, `حذف عمل إضافي #${extraId}`);
    this.persist();
  }

  // --- CRUD: PERFORMANCE EVAL ---
  public addPerformanceEval(evalItem: Omit<PerformanceEval, 'EvalID'>, currentUserId: number): PerformanceEval {
    const newId = (this.state.performanceEvals.length ? Math.max(...this.state.performanceEvals.map((e) => e.EvalID)) : 0) + 1;
    const newRecord: PerformanceEval = {
      ...evalItem,
      EvalID: newId,
    };
    this.state.performanceEvals.unshift(newRecord);
    const emp = this.state.employees.find((e) => e.EmpID === evalItem.EmpID);
    this.logAudit(
      currentUserId,
      'INSERT',
      'tblPerformanceEval',
      newId,
      `إضافة تقييم شهر ${evalItem.EvalMonth} للموظف (${emp?.FullName}) بنسبة ${evalItem.Score}%`
    );
    this.persist();
    return newRecord;
  }

  public updatePerformanceEval(evalItem: PerformanceEval, currentUserId: number): void {
    const idx = this.state.performanceEvals.findIndex((e) => e.EvalID === evalItem.EvalID);
    if (idx !== -1) {
      this.state.performanceEvals[idx] = { ...evalItem };
      this.logAudit(currentUserId, 'UPDATE', 'tblPerformanceEval', evalItem.EvalID, `تعديل تقييم #${evalItem.EvalID}`);
      this.persist();
    }
  }

  public deletePerformanceEval(evalId: number, currentUserId: number): void {
    this.state.performanceEvals = this.state.performanceEvals.filter((e) => e.EvalID !== evalId);
    this.logAudit(currentUserId, 'DELETE', 'tblPerformanceEval', evalId, `حذف تقييم #${evalId}`);
    this.persist();
  }

  // --- CRUD: EMPLOYEES ---
  public addEmployee(emp: Omit<Employee, 'EmpID'>, currentUserId: number): Employee {
    const newId = (this.state.employees.length ? Math.max(...this.state.employees.map((e) => e.EmpID)) : 0) + 1;
    const newRecord: Employee = {
      ...emp,
      EmpID: newId,
    };
    this.state.employees.unshift(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblEmployees', newId, `إضافة موظف: ${newRecord.FullName} (${newRecord.EmpCode})`);
    this.persist();
    return newRecord;
  }

  public updateEmployee(emp: Employee, currentUserId: number): void {
    const idx = this.state.employees.findIndex((e) => e.EmpID === emp.EmpID);
    if (idx !== -1) {
      this.state.employees[idx] = { ...emp };
      this.logAudit(currentUserId, 'UPDATE', 'tblEmployees', emp.EmpID, `تعديل بيانات موظف: ${emp.FullName}`);
      this.persist();
    }
  }

  public toggleEmployeeActive(empId: number, currentUserId: number): void {
    const emp = this.state.employees.find((e) => e.EmpID === empId);
    if (emp) {
      emp.IsActive = emp.IsActive === 1 ? 0 : 1;
      this.logAudit(currentUserId, 'UPDATE', 'tblEmployees', empId, `تغيير حالة الموظف ${emp.FullName} إلى ${emp.IsActive ? 'نشط' : 'معطل'}`);
      this.persist();
    }
  }

  public deleteEmployee(empId: number, currentUserId: number): void {
    const emp = this.state.employees.find((e) => e.EmpID === empId);
    this.state.employees = this.state.employees.filter((e) => e.EmpID !== empId);
    this.logAudit(currentUserId, 'DELETE', 'tblEmployees', empId, `حذف موظف: ${emp?.FullName || empId}`);
    this.persist();
  }

  public deleteBranch(branchId: number, currentUserId: number): { success: boolean; message?: string } {
    const hasEmps = this.state.employees.some((e) => e.BranchID === branchId);
    if (hasEmps) {
      return { success: false, message: 'لا يمكن حذف الفرع لوجود موظفين مسجلين به. قم بنقل الموظفين أولاً.' };
    }
    const target = this.state.branches.find((b) => b.BranchID === branchId);
    this.state.branches = this.state.branches.filter((b) => b.BranchID !== branchId);
    this.logAudit(currentUserId, 'DELETE', 'tblBranches', branchId, `حذف فرع: ${target?.BranchName || branchId}`);
    this.persist();
    return { success: true };
  }

  public deleteDepartment(deptId: number, currentUserId: number): { success: boolean; message?: string } {
    const hasEmps = this.state.employees.some((e) => e.DeptID === deptId);
    if (hasEmps) {
      return { success: false, message: 'لا يمكن حذف القسم لوجود موظفين مسجلين به.' };
    }
    const target = this.state.departments.find((d) => d.DeptID === deptId);
    this.state.departments = this.state.departments.filter((d) => d.DeptID !== deptId);
    this.logAudit(currentUserId, 'DELETE', 'tblDepartments', deptId, `حذف قسم: ${target?.DeptName || deptId}`);
    this.persist();
    return { success: true };
  }

  // --- CURRENCIES ---
  public updateCurrency(currency: Currency, currentUserId: number): void {
    const idx = this.state.currencies.findIndex((c) => c.CurrencyID === currency.CurrencyID);
    if (idx !== -1) {
      if (currency.IsDefault === 1) {
        this.state.currencies.forEach((c) => (c.IsDefault = 0));
      }
      this.state.currencies[idx] = { ...currency };
      this.logAudit(currentUserId, 'UPDATE', 'tblCurrencies', currency.CurrencyID, `تحديث عملة: ${currency.CurrencyName} (${currency.CurrencyCode})`);
      this.persist();
    }
  }

  public addCurrency(currency: Omit<Currency, 'CurrencyID'>, currentUserId: number): Currency {
    const newId = (this.state.currencies.length ? Math.max(...this.state.currencies.map((c) => c.CurrencyID)) : 0) + 1;
    if (currency.IsDefault === 1) {
      this.state.currencies.forEach((c) => (c.IsDefault = 0));
    }
    const newRecord: Currency = {
      ...currency,
      CurrencyID: newId,
    };
    this.state.currencies.push(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblCurrencies', newId, `إضافة عملة: ${newRecord.CurrencyName}`);
    this.persist();
    return newRecord;
  }

  // --- BRANCHES & DEPARTMENTS ---
  public addBranch(branch: Omit<Branch, 'BranchID'>, currentUserId: number): Branch {
    const newId = (this.state.branches.length ? Math.max(...this.state.branches.map((b) => b.BranchID)) : 0) + 1;
    const newRecord: Branch = { ...branch, BranchID: newId };
    this.state.branches.push(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblBranches', newId, `إضافة فرع: ${newRecord.BranchName}`);
    this.persist();
    return newRecord;
  }

  public updateBranch(branch: Branch, currentUserId: number): void {
    const idx = this.state.branches.findIndex((b) => b.BranchID === branch.BranchID);
    if (idx !== -1) {
      this.state.branches[idx] = { ...branch };
      this.logAudit(currentUserId, 'UPDATE', 'tblBranches', branch.BranchID, `تعديل فرع: ${branch.BranchName}`);
      this.persist();
    }
  }

  public addDepartment(dept: Omit<Department, 'DeptID'>, currentUserId: number): Department {
    const newId = (this.state.departments.length ? Math.max(...this.state.departments.map((d) => d.DeptID)) : 0) + 1;
    const newRecord: Department = { ...dept, DeptID: newId };
    this.state.departments.push(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblDepartments', newId, `إضافة قسم: ${newRecord.DeptName}`);
    this.persist();
    return newRecord;
  }

  // --- REWARD TYPES & VIOLATION TYPES ---
  public addRewardType(rt: Omit<RewardType, 'RewardTypeID'>, currentUserId: number): RewardType {
    const newId = (this.state.rewardTypes.length ? Math.max(...this.state.rewardTypes.map((r) => r.RewardTypeID)) : 0) + 1;
    const newRecord: RewardType = { ...rt, RewardTypeID: newId };
    this.state.rewardTypes.push(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblRewardTypes', newId, `إضافة نوع حافز: ${newRecord.RewardDesc}`);
    this.persist();
    return newRecord;
  }

  public addViolationType(vt: Omit<ViolationType, 'ViolationTypeID'>, currentUserId: number): ViolationType {
    const newId = (this.state.violationTypes.length ? Math.max(...this.state.violationTypes.map((v) => v.ViolationTypeID)) : 0) + 1;
    const newRecord: ViolationType = { ...vt, ViolationTypeID: newId };
    this.state.violationTypes.push(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblViolationTypes', newId, `إضافة نوع مخالفة: ${newRecord.ViolationName}`);
    this.persist();
    return newRecord;
  }

  // --- SETTINGS ---
  public updateSetting(key: string, value: string, currentUserId: number): void {
    const setting = this.state.settings.find((s) => s.SettingKey === key);
    if (setting) {
      setting.SettingValue = value;
    } else {
      const newId = (this.state.settings.length ? Math.max(...this.state.settings.map((s) => s.SettingID)) : 0) + 1;
      this.state.settings.push({ SettingID: newId, SettingKey: key, SettingValue: value });
    }
    this.logAudit(currentUserId, 'UPDATE', 'tblSettings', null, `تحديث الإعداد [${key}]`);
    this.persist();
  }

  public getSetting(key: string, fallback: string = ''): string {
    const item = this.state.settings.find((s) => s.SettingKey === key);
    return item ? item.SettingValue : fallback;
  }

  // --- USER PROFILE & PASSWORD ---
  public updatePassword(userId: number, newPasswordHash: string): boolean {
    const u = this.state.users.find((user) => user.UserID === userId);
    if (u) {
      u.PasswordHash = newPasswordHash;
      this.logAudit(userId, 'UPDATE', 'tblUsers', userId, `تغيير كلمة المرور للمستخدم (${u.UserName})`);
      this.persist();
      return true;
    }
    return false;
  }

  // --- IMPORT LOGS (tblImportLogs) ---
  public addImportLog(log: Omit<ImportLog, 'LogID'>, currentUserId: number): ImportLog {
    const list = this.state.importLogs || [];
    const newId = (list.length ? Math.max(...list.map((l) => l.LogID)) : 0) + 1;
    const newRecord: ImportLog = {
      ...log,
      LogID: newId,
    };
    if (!this.state.importLogs) this.state.importLogs = [];
    this.state.importLogs.unshift(newRecord);
    this.logAudit(
      currentUserId,
      'INSERT',
      'tblImportLogs',
      newId,
      `استيراد بيانات [${log.ImportTypeLabel}]: ناجح ${log.SuccessCount}، فاشل ${log.FailedCount} (${log.FileName})`
    );
    this.persist();
    return newRecord;
  }

  public getImportLogs(): ImportLog[] {
    return this.state.importLogs || [];
  }

  // --- SYNC LOGS & MOBILE MERGE (tblSyncLogs) ---
  public addSyncLog(log: Omit<SyncLog, 'SyncID'>, currentUserId?: number): SyncLog {
    const list = this.state.syncLogs || [];
    const newId = (list.length ? Math.max(...list.map((l) => l.SyncID)) : 0) + 1;
    const newRecord: SyncLog = {
      ...log,
      SyncID: newId,
    };
    if (!this.state.syncLogs) this.state.syncLogs = [];
    this.state.syncLogs.unshift(newRecord);
    if (currentUserId) {
      this.logAudit(
        currentUserId,
        log.SyncType === 'EXPORT' ? 'EXPORT' : 'INSERT',
        'tblSyncLogs',
        newId,
        `مزامنة جوال [${log.SyncType === 'EXPORT' ? 'تصدير حزمة' : 'استيراد ودمج'}] - نمط الجهاز: ${log.DeviceRole} (${log.DeviceName || 'جوال'})`
      );
    }
    this.persist();
    return newRecord;
  }

  public getSyncLogs(): SyncLog[] {
    return this.state.syncLogs || [];
  }

  public mergeDatabaseState(
    incoming: Partial<DatabaseState>,
    strategy: 'smart' | 'mirror' | 'append',
    currentUserId: number,
    sourceDeviceDesc: string
  ): { addedCount: number; updatedCount: number; unchangedCount: number } {
    let addedCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    if (strategy === 'mirror') {
      if (Array.isArray(incoming.branches)) this.state.branches = [...incoming.branches];
      if (Array.isArray(incoming.departments)) this.state.departments = [...incoming.departments];
      if (Array.isArray(incoming.employees)) {
        this.state.employees = [...incoming.employees];
        addedCount += incoming.employees.length;
      }
      if (Array.isArray(incoming.rewards)) this.state.rewards = [...incoming.rewards];
      if (Array.isArray(incoming.violations)) this.state.violations = [...incoming.violations];
      if (Array.isArray(incoming.extraWork)) this.state.extraWork = [...incoming.extraWork];
      if (Array.isArray(incoming.performanceEvals)) this.state.performanceEvals = [...incoming.performanceEvals];
      if (Array.isArray(incoming.rewardTypes)) this.state.rewardTypes = [...incoming.rewardTypes];
      if (Array.isArray(incoming.violationTypes)) this.state.violationTypes = [...incoming.violationTypes];
      if (Array.isArray(incoming.users) && incoming.users.length) this.state.users = [...incoming.users];
    } else {
      // 1. Branches
      if (Array.isArray(incoming.branches)) {
        incoming.branches.forEach((inBranch) => {
          const existing = this.state.branches.find(
            (b) => b.BranchID === inBranch.BranchID || b.BranchName.trim().toLowerCase() === inBranch.BranchName.trim().toLowerCase()
          );
          if (!existing) {
            const nextId = (this.state.branches.length ? Math.max(...this.state.branches.map((b) => b.BranchID)) : 0) + 1;
            this.state.branches.push({ ...inBranch, BranchID: nextId });
            addedCount++;
          } else if (strategy === 'smart') {
            Object.assign(existing, inBranch);
            updatedCount++;
          } else {
            unchangedCount++;
          }
        });
      }

      // 2. Departments
      if (Array.isArray(incoming.departments)) {
        incoming.departments.forEach((inDept) => {
          const existing = this.state.departments.find(
            (d) => d.DeptID === inDept.DeptID || (d.DeptName.trim().toLowerCase() === inDept.DeptName.trim().toLowerCase() && d.BranchID === inDept.BranchID)
          );
          if (!existing) {
            const nextId = (this.state.departments.length ? Math.max(...this.state.departments.map((d) => d.DeptID)) : 0) + 1;
            this.state.departments.push({ ...inDept, DeptID: nextId });
            addedCount++;
          } else if (strategy === 'smart') {
            Object.assign(existing, inDept);
            updatedCount++;
          } else {
            unchangedCount++;
          }
        });
      }

      // 3. Employees
      if (Array.isArray(incoming.employees)) {
        incoming.employees.forEach((inEmp) => {
          const existing = this.state.employees.find(
            (e) => (inEmp.EmpCode && e.EmpCode.toLowerCase() === inEmp.EmpCode.toLowerCase()) || e.EmpID === inEmp.EmpID
          );
          if (!existing) {
            const nextId = (this.state.employees.length ? Math.max(...this.state.employees.map((e) => e.EmpID)) : 0) + 1;
            this.state.employees.push({ ...inEmp, EmpID: nextId });
            addedCount++;
          } else if (strategy === 'smart') {
            existing.FullName = inEmp.FullName || existing.FullName;
            existing.BranchID = inEmp.BranchID || existing.BranchID;
            existing.DeptID = inEmp.DeptID ?? existing.DeptID;
            existing.JobID = inEmp.JobID ?? existing.JobID;
            existing.BaseSalary = inEmp.BaseSalary ?? existing.BaseSalary;
            existing.CurrencyID = inEmp.CurrencyID || existing.CurrencyID;
            existing.Phone = inEmp.Phone || existing.Phone;
            existing.Email = inEmp.Email || existing.Email;
            existing.IsActive = inEmp.IsActive ?? existing.IsActive;
            existing.Notes = inEmp.Notes || existing.Notes;
            updatedCount++;
          } else {
            unchangedCount++;
          }
        });
      }

      // 4. Rewards
      if (Array.isArray(incoming.rewards)) {
        incoming.rewards.forEach((inR) => {
          const existing = this.state.rewards.find(
            (r) => r.RewardID === inR.RewardID || (r.EmpID === inR.EmpID && r.RewardDate === inR.RewardDate && r.RewardTypeID === inR.RewardTypeID)
          );
          if (!existing) {
            const nextId = (this.state.rewards.length ? Math.max(...this.state.rewards.map((r) => r.RewardID)) : 0) + 1;
            this.state.rewards.push({ ...inR, RewardID: nextId });
            addedCount++;
          } else if (strategy === 'smart') {
            existing.Amount = inR.Amount ?? existing.Amount;
            existing.Points = inR.Points ?? existing.Points;
            existing.Status = inR.Status || existing.Status;
            existing.Notes = inR.Notes || existing.Notes;
            updatedCount++;
          } else {
            unchangedCount++;
          }
        });
      }

      // 5. Violations
      if (Array.isArray(incoming.violations)) {
        incoming.violations.forEach((inV) => {
          const existing = this.state.violations.find(
            (v) => v.ViolationID === inV.ViolationID || (v.EmpID === inV.EmpID && v.ViolationDate === inV.ViolationDate && v.ViolationTypeID === inV.ViolationTypeID)
          );
          if (!existing) {
            const nextId = (this.state.violations.length ? Math.max(...this.state.violations.map((v) => v.ViolationID)) : 0) + 1;
            this.state.violations.push({ ...inV, ViolationID: nextId });
            addedCount++;
          } else if (strategy === 'smart') {
            existing.PenaltyAmount = inV.PenaltyAmount ?? existing.PenaltyAmount;
            existing.Status = inV.Status || existing.Status;
            existing.Notes = inV.Notes || existing.Notes;
            updatedCount++;
          } else {
            unchangedCount++;
          }
        });
      }

      // 6. Extra Work
      if (Array.isArray(incoming.extraWork)) {
        incoming.extraWork.forEach((inW) => {
          const existing = this.state.extraWork.find(
            (w) => w.ExtraID === inW.ExtraID || (w.EmpID === inW.EmpID && w.WorkDate === inW.WorkDate)
          );
          if (!existing) {
            const nextId = (this.state.extraWork.length ? Math.max(...this.state.extraWork.map((w) => w.ExtraID)) : 0) + 1;
            this.state.extraWork.push({ ...inW, ExtraID: nextId });
            addedCount++;
          } else if (strategy === 'smart') {
            Object.assign(existing, inW);
            updatedCount++;
          } else {
            unchangedCount++;
          }
        });
      }

      // 7. Performance Evals
      if (Array.isArray(incoming.performanceEvals)) {
        incoming.performanceEvals.forEach((inEval) => {
          const existing = this.state.performanceEvals.find(
            (e) => e.EvalID === inEval.EvalID || (e.EmpID === inEval.EmpID && e.EvalMonth === inEval.EvalMonth)
          );
          if (!existing) {
            const nextId = (this.state.performanceEvals.length ? Math.max(...this.state.performanceEvals.map((e) => e.EvalID)) : 0) + 1;
            this.state.performanceEvals.push({ ...inEval, EvalID: nextId });
            addedCount++;
          } else if (strategy === 'smart') {
            Object.assign(existing, inEval);
            updatedCount++;
          } else {
            unchangedCount++;
          }
        });
      }
    }

    this.logAudit(
      currentUserId,
      'UPDATE',
      'DatabaseSync',
      0,
      `مزامنة ودمج بيانات من (${sourceDeviceDesc}): إضافة ${addedCount} سجل، تحديث ${updatedCount}، غير متغير ${unchangedCount}`
    );
    this.persist();
    return { addedCount, updatedCount, unchangedCount };
  }

  // --- AUTOMATIC REFERENCE HELPERS FOR IMPORT ---
  public ensureBranchByName(branchName: string, currentUserId: number): Branch {
    const trimmed = branchName.trim();
    let b = this.state.branches.find((item) => item.BranchName.trim().toLowerCase() === trimmed.toLowerCase());
    if (!b) {
      b = this.addBranch(
        {
          BranchName: trimmed,
          BranchCode: 'BR-' + (this.state.branches.length + 1).toString().padStart(2, '0'),
          IsActive: 1,
        },
        currentUserId
      );
    }
    return b;
  }

  public ensureDepartmentByName(deptName: string, branchId: number, currentUserId: number): Department {
    const trimmed = deptName.trim();
    let d = this.state.departments.find(
      (item) => item.BranchID === branchId && item.DeptName.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (!d) {
      d = this.addDepartment(
        {
          DeptName: trimmed,
          BranchID: branchId,
        },
        currentUserId
      );
    }
    return d;
  }

  public ensureJobTitleByName(jobTitle: string): JobTitle {
    const trimmed = jobTitle.trim();
    let j = this.state.jobTitles.find((item) => item.JobTitle.trim().toLowerCase() === trimmed.toLowerCase());
    if (!j) {
      const newId = (this.state.jobTitles.length ? Math.max(...this.state.jobTitles.map((item) => item.JobID)) : 0) + 1;
      j = { JobID: newId, JobTitle: trimmed };
      this.state.jobTitles.push(j);
      this.persist();
    }
    return j;
  }

  public ensureRewardCategoryByName(catName: string): RewardCategory {
    const trimmed = catName.trim();
    let c = this.state.rewardCategories.find((item) => item.CategoryName.trim().toLowerCase() === trimmed.toLowerCase());
    if (!c) {
      const newId = (this.state.rewardCategories.length ? Math.max(...this.state.rewardCategories.map((item) => item.CategoryID)) : 0) + 1;
      c = { CategoryID: newId, CategoryName: trimmed };
      this.state.rewardCategories.push(c);
      this.persist();
    }
    return c;
  }

  public ensureViolationDegreeByName(degreeName: string, defaultPenalty: number = 5000): ViolationDegree {
    const trimmed = degreeName.trim();
    let deg = this.state.violationDegrees.find((item) => item.DegreeName.trim().toLowerCase() === trimmed.toLowerCase());
    if (!deg) {
      const newId = (this.state.violationDegrees.length ? Math.max(...this.state.violationDegrees.map((item) => item.DegreeID)) : 0) + 1;
      deg = { DegreeID: newId, DegreeName: trimmed, DefaultPenalty: defaultPenalty };
      this.state.violationDegrees.push(deg);
      this.persist();
    }
    return deg;
  }

  public ensureAdminActionByName(actionName: string): AdminAction {
    const trimmed = actionName.trim();
    let a = this.state.adminActions.find((item) => item.ActionName.trim().toLowerCase() === trimmed.toLowerCase());
    if (!a) {
      const newId = (this.state.adminActions.length ? Math.max(...this.state.adminActions.map((item) => item.ActionID)) : 0) + 1;
      a = { ActionID: newId, ActionName: trimmed };
      this.state.adminActions.push(a);
      this.persist();
    }
    return a;
  }

  // --- QUERY HELPERS & JOINS ---
  public getEmployeesWithDetails() {
    return this.state.employees.map((emp) => {
      const branch = this.state.branches.find((b) => b.BranchID === emp.BranchID);
      const dept = this.state.departments.find((d) => d.DeptID === emp.DeptID);
      const job = this.state.jobTitles.find((j) => j.JobID === emp.JobID);
      const currency = this.state.currencies.find((c) => c.CurrencyID === emp.CurrencyID) || this.state.currencies[0];
      return {
        ...emp,
        branchName: branch?.BranchName || 'فرع غير محدد',
        deptName: dept?.DeptName || 'قسم غير محدد',
        jobTitle: job?.JobTitle || 'غير محدد',
        currencyCode: currency?.CurrencyCode || 'YER',
        currencyName: currency?.CurrencyName || 'ريال يمني',
      };
    });
  }

  public getRewardsWithDetails() {
    return this.state.rewards.map((r) => {
      const emp = this.state.employees.find((e) => e.EmpID === r.EmpID);
      const branch = this.state.branches.find((b) => b.BranchID === r.BranchID);
      const rt = this.state.rewardTypes.find((t) => t.RewardTypeID === r.RewardTypeID);
      const cat = rt ? this.state.rewardCategories.find((c) => c.CategoryID === rt.CategoryID) : null;
      const currency = this.state.currencies.find((c) => c.CurrencyID === r.CurrencyID) || this.state.currencies[0];
      const creator = this.state.users.find((u) => u.UserID === r.CreatedBy);
      return {
        ...r,
        empName: emp?.FullName || 'موظف غير محدد',
        empCode: emp?.EmpCode || '',
        branchName: branch?.BranchName || '',
        rewardDesc: rt?.RewardDesc || '',
        categoryName: cat?.CategoryName || 'عام',
        currencyCode: currency?.CurrencyCode || 'YER',
        createdByName: creator?.FullName || 'النظام',
      };
    });
  }

  public getViolationsWithDetails() {
    return this.state.violations.map((v) => {
      const emp = this.state.employees.find((e) => e.EmpID === v.EmpID);
      const vt = this.state.violationTypes.find((t) => t.ViolationTypeID === v.ViolationTypeID);
      const deg = this.state.violationDegrees.find((d) => d.DegreeID === v.DegreeID);
      const act = this.state.adminActions.find((a) => a.ActionID === v.ActionID);
      const creator = this.state.users.find((u) => u.UserID === v.CreatedBy);
      return {
        ...v,
        empName: emp?.FullName || 'موظف غير محدد',
        empCode: emp?.EmpCode || '',
        violationName: vt?.ViolationName || '',
        degreeName: deg?.DegreeName || '',
        actionName: act?.ActionName || '',
        createdByName: creator?.FullName || 'النظام',
      };
    });
  }

  public getExtraWorkWithDetails() {
    return this.state.extraWork.map((ew) => {
      const emp = this.state.employees.find((e) => e.EmpID === ew.EmpID);
      const branch = this.state.branches.find((b) => b.BranchID === ew.BranchID);
      return {
        ...ew,
        empName: emp?.FullName || 'موظف غير محدد',
        empCode: emp?.EmpCode || '',
        branchName: branch?.BranchName || '',
      };
    });
  }

  // --- EMPLOYEE STATEMENT ---
  public getEmployeeStatement(empId: number, month?: string) {
    const emp = this.getEmployeesWithDetails().find((e) => e.EmpID === empId);
    if (!emp) return null;

    let rewards = this.getRewardsWithDetails().filter((r) => r.EmpID === empId && r.Status === 'Approved');
    let violations = this.getViolationsWithDetails().filter((v) => v.EmpID === empId && v.Status === 'Confirmed');
    let extraWorks = this.getExtraWorkWithDetails().filter((w) => w.EmpID === empId && w.Status === 'Approved');
    let evals = this.state.performanceEvals.filter((e) => e.EmpID === empId);

    if (month) {
      rewards = rewards.filter((r) => r.RewardDate.startsWith(month));
      violations = violations.filter((v) => v.ViolationDate.startsWith(month));
      extraWorks = extraWorks.filter((w) => w.WorkDate.startsWith(month));
      evals = evals.filter((e) => e.EvalMonth === month || e.EvalDate.startsWith(month));
    }

    const totalRewardAmount = rewards.reduce((sum, r) => sum + r.Amount, 0);
    const totalRewardPoints = rewards.reduce((sum, r) => sum + r.Points, 0);
    const totalOvertimeAmount = extraWorks.reduce((sum, w) => sum + w.Amount, 0);
    const totalOvertimeHours = extraWorks.reduce((sum, w) => sum + w.Hours, 0);
    const totalPenalties = violations.reduce((sum, v) => sum + v.PenaltyAmount, 0);
    const netPayable = totalRewardAmount + totalOvertimeAmount - totalPenalties;
    const avgScore = evals.length ? Math.round(evals.reduce((sum, e) => sum + e.Score, 0) / evals.length) : null;

    return {
      emp,
      month,
      rewards,
      violations,
      extraWorks,
      evals,
      totalRewardAmount,
      totalRewardPoints,
      totalOvertimeAmount,
      totalOvertimeHours,
      totalPenalties,
      netPayable,
      avgScore,
    };
  }

  // ============================================================
  // RBAC & PERMISSIONS ENGINE
  // ============================================================

  /**
   * Check if a user has a specific permission on a screen.
   * Rule 5: دور مدير النظام admin له كل الصلاحيات دائماً ولا يمكن حذفه أو إيقافه
   */
  public hasPermission(user: User | null | undefined, screen: ScreenKey, action: ActionKey): boolean {
    if (!user || user.IsActive !== 1) return false;

    // Admin role / user has full bypass on all actions and screens
    if (
      user.RoleID === 1 ||
      user.UserName.toLowerCase() === 'admin' ||
      user.Role === 'Admin'
    ) {
      return true;
    }

    const perm = this.state.rolePermissions.find(
      (rp) => rp.RoleID === user.RoleID && rp.Screen === screen
    );
    if (!perm) return false;
    return perm.Actions.includes(action);
  }

  /**
   * Check if user can view/access a screen
   * If screen is 'imports', user needs either 'view' or 'import' permission
   */
  public canAccessScreen(user: User | null | undefined, screen: ScreenKey): boolean {
    if (screen === 'imports') {
      return this.hasPermission(user, 'imports', 'view') || this.hasPermission(user, 'imports', 'import');
    }
    return this.hasPermission(user, screen, 'view');
  }

  // --- ROLES MANAGEMENT (tblRoles) ---
  public addRole(role: Omit<Role, 'RoleID'>, currentUserId: number): Role {
    const newId = (this.state.roles.length ? Math.max(...this.state.roles.map((r) => r.RoleID)) : 0) + 1;
    const newRecord: Role = { ...role, RoleID: newId, IsSystem: 0 };
    this.state.roles.push(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblRoles', newId, `إضافة دور جديد: ${newRecord.RoleName}`);
    this.persist();
    return newRecord;
  }

  public updateRole(role: Role, currentUserId: number): { success: boolean; message?: string } {
    const idx = this.state.roles.findIndex((r) => r.RoleID === role.RoleID);
    if (idx !== -1) {
      if (this.state.roles[idx].IsSystem === 1 && role.RoleName !== this.state.roles[idx].RoleName) {
        return { success: false, message: 'لا يمكن تعديل اسم دور مدير النظام المحمي' };
      }
      this.state.roles[idx] = { ...role, IsSystem: this.state.roles[idx].IsSystem };
      this.logAudit(currentUserId, 'UPDATE', 'tblRoles', role.RoleID, `تعديل دور: ${role.RoleName}`);
      this.persist();
      return { success: true };
    }
    return { success: false, message: 'الدور غير موجود' };
  }

  public deleteRole(roleId: number, currentUserId: number): { success: boolean; message: string } {
    const role = this.state.roles.find((r) => r.RoleID === roleId);
    if (!role) return { success: false, message: 'الدور غير موجود' };
    if (role.IsSystem === 1 || role.RoleID === 1) {
      return { success: false, message: 'لا يمكن حذف دور مدير النظام الأساسي' };
    }
    const assignedUsers = this.state.users.filter((u) => u.RoleID === roleId);
    if (assignedUsers.length > 0) {
      return { success: false, message: `لا يمكن حذف هذا الدور لوجود ${assignedUsers.length} مستخدم مرتبطين به` };
    }
    this.state.roles = this.state.roles.filter((r) => r.RoleID !== roleId);
    this.state.rolePermissions = this.state.rolePermissions.filter((rp) => rp.RoleID !== roleId);
    this.logAudit(currentUserId, 'DELETE', 'tblRoles', roleId, `حذف دور: ${role.RoleName}`);
    this.persist();
    return { success: true, message: 'تم حذف الدور بنجاح' };
  }

  // --- PERMISSIONS MATRIX (tblRolePermissions) ---
  public getRolePermissions(roleId: number): RolePermission[] {
    return this.state.rolePermissions.filter((rp) => rp.RoleID === roleId);
  }

  public setRoleScreenPermission(
    roleId: number,
    screen: ScreenKey,
    actions: ActionKey[],
    currentUserId: number
  ): void {
    if (roleId === 1) return; // Admin permissions are permanently full
    const existingIdx = this.state.rolePermissions.findIndex(
      (rp) => rp.RoleID === roleId && rp.Screen === screen
    );
    if (existingIdx !== -1) {
      this.state.rolePermissions[existingIdx].Actions = [...actions];
    } else {
      this.state.rolePermissions.push({
        RoleID: roleId,
        Screen: screen,
        Actions: [...actions],
      });
    }
    this.logAudit(currentUserId, 'UPDATE', 'tblPermissions', roleId, `تعديل صلاحيات الدور #${roleId} لشاشة [${screen}]`);
    this.persist();
  }

  public setAllRolePermissions(
    roleId: number,
    permissions: { screen: ScreenKey; actions: ActionKey[] }[],
    currentUserId: number
  ): void {
    if (roleId === 1) return; // Admin permissions cannot be modified
    // Remove existing for this role
    this.state.rolePermissions = this.state.rolePermissions.filter((rp) => rp.RoleID !== roleId);
    // Insert new
    permissions.forEach((p) => {
      this.state.rolePermissions.push({
        RoleID: roleId,
        Screen: p.screen,
        Actions: p.actions,
      });
    });
    const role = this.state.roles.find((r) => r.RoleID === roleId);
    this.logAudit(currentUserId, 'UPDATE', 'tblPermissions', roleId, `تحديث مصفوفة الصلاحيات بالكامل للدور: ${role?.RoleName || roleId}`);
    this.persist();
  }

  // --- USERS MANAGEMENT (tblUsers) ---
  public addUser(user: Omit<User, 'UserID'>, currentUserId: number): User {
    const newId = (this.state.users.length ? Math.max(...this.state.users.map((u) => u.UserID)) : 0) + 1;
    const roleObj = this.state.roles.find((r) => r.RoleID === user.RoleID);
    const newRecord: User = {
      ...user,
      UserID: newId,
      Role: roleObj ? roleObj.RoleName : user.Role,
    };
    this.state.users.push(newRecord);
    this.logAudit(currentUserId, 'INSERT', 'tblUsers', newId, `إضافة مستخدم: ${newRecord.UserName} (${newRecord.Role})`);
    this.persist();
    return newRecord;
  }

  public updateUser(user: User, currentUserId: number): { success: boolean; message?: string } {
    const idx = this.state.users.findIndex((u) => u.UserID === user.UserID);
    if (idx !== -1) {
      const existing = this.state.users[idx];
      // Rule 5: Admin cannot be demoted or disabled
      if (existing.UserID === 1 || existing.UserName.toLowerCase() === 'admin') {
        if (user.IsActive !== 1) {
          return { success: false, message: 'لا يمكن إيقاف حساب مدير النظام الرئيسي' };
        }
        user.RoleID = 1;
        user.Role = 'Admin';
      }
      const roleObj = this.state.roles.find((r) => r.RoleID === user.RoleID);
      this.state.users[idx] = {
        ...user,
        Role: roleObj ? roleObj.RoleName : user.Role,
      };
      this.logAudit(currentUserId, 'UPDATE', 'tblUsers', user.UserID, `تعديل بيانات المستخدم: ${user.UserName}`);
      this.persist();
      return { success: true };
    }
    return { success: false, message: 'المستخدم غير موجود' };
  }

  public toggleUserActive(userId: number, currentUserId: number): { success: boolean; message?: string } {
    const u = this.state.users.find((user) => user.UserID === userId);
    if (!u) return { success: false, message: 'المستخدم غير موجود' };
    // Rule 5: Admin cannot be deactivated
    if (u.UserID === 1 || u.UserName.toLowerCase() === 'admin' || u.RoleID === 1) {
      return { success: false, message: 'لا يمكن إيقاف حساب مدير النظام الأساسي (admin)' };
    }
    u.IsActive = u.IsActive === 1 ? 0 : 1;
    this.logAudit(currentUserId, 'UPDATE', 'tblUsers', userId, `تغيير حالة المستخدم ${u.UserName} إلى ${u.IsActive ? 'نشط' : 'موقف'}`);
    this.persist();
    return { success: true };
  }

  public deleteUser(userId: number, currentUserId: number): { success: boolean; message: string } {
    const u = this.state.users.find((user) => user.UserID === userId);
    if (!u) return { success: false, message: 'المستخدم غير موجود' };
    // Rule 5: Admin cannot be deleted
    if (u.UserID === 1 || u.UserName.toLowerCase() === 'admin' || u.RoleID === 1) {
      return { success: false, message: 'لا يمكن حذف حساب مدير النظام الأساسي (admin)' };
    }
    this.state.users = this.state.users.filter((user) => user.UserID !== userId);
    this.logAudit(currentUserId, 'DELETE', 'tblUsers', userId, `حذف المستخدم: ${u.UserName}`);
    this.persist();
    return { success: true, message: 'تم حذف المستخدم بنجاح' };
  }

  // --- DEPARTMENTS FILTERED BY BRANCH ---
  public getDepartmentsByBranch(branchId: number): Department[] {
    return this.state.departments.filter((d) => d.BranchID === branchId);
  }

  // --- qryRptEmpPerf ---
  public getEmployeePerformanceSummary(filter?: {
    branchId?: number | null;
    deptId?: number | null;
    month?: string | null;
  }) {
    let emps = this.getEmployeesWithDetails().filter((e) => e.IsActive === 1);
    if (filter?.branchId) {
      emps = emps.filter((e) => e.BranchID === filter.branchId);
    }
    if (filter?.deptId) {
      emps = emps.filter((e) => e.DeptID === filter.deptId);
    }

    const m = filter?.month;

    return emps.map((emp) => {
      let empRewards = this.getRewardsWithDetails().filter((r) => r.EmpID === emp.EmpID && r.Status === 'Approved');
      if (m) empRewards = empRewards.filter((r) => r.RewardDate.startsWith(m));
      const rewardCount = empRewards.length;
      const totalPoints = empRewards.reduce((sum, r) => sum + r.Points, 0);

      const rewardsByCurrency: Record<string, number> = {};
      empRewards.forEach((r) => {
        const cCode = r.currencyCode || 'YER';
        rewardsByCurrency[cCode] = (rewardsByCurrency[cCode] || 0) + r.Amount;
      });

      let empViolations = this.getViolationsWithDetails().filter((v) => v.EmpID === emp.EmpID && v.Status === 'Confirmed');
      if (m) empViolations = empViolations.filter((v) => v.ViolationDate.startsWith(m));
      const violationCount = empViolations.length;
      const penaltiesByCurrency: Record<string, number> = {};
      empViolations.forEach((v) => {
        const cCode = 'YER';
        penaltiesByCurrency[cCode] = (penaltiesByCurrency[cCode] || 0) + v.PenaltyAmount;
      });

      let empExtra = this.getExtraWorkWithDetails().filter((w) => w.EmpID === emp.EmpID && w.Status === 'Approved');
      if (m) empExtra = empExtra.filter((w) => w.WorkDate.startsWith(m));
      const extraHours = empExtra.reduce((sum, w) => sum + w.Hours, 0);
      const extraByCurrency: Record<string, number> = {};
      empExtra.forEach((w) => {
        const cCode = 'YER';
        extraByCurrency[cCode] = (extraByCurrency[cCode] || 0) + w.Amount;
      });

      const penaltySum = Object.values(penaltiesByCurrency).reduce((a, b) => a + b, 0);
      const rewardSum = Object.values(rewardsByCurrency).reduce((a, b) => a + b, 0);

      return {
        emp,
        rewardCount,
        totalPoints,
        rewardsByCurrency,
        rewardSum,
        violationCount,
        penaltiesByCurrency,
        penaltySum,
        extraHours,
        extraByCurrency,
      };
    });
  }

  // --- qryStats ---
  public getGeneralStats(filterYear?: string) {
    const year = filterYear || '2026';
    const branches = this.state.branches;
    const departments = this.state.departments;
    const rewards = this.getRewardsWithDetails().filter((r) => r.Status === 'Approved' && r.RewardDate.startsWith(year));
    const violations = this.getViolationsWithDetails().filter((v) => v.Status === 'Confirmed' && v.ViolationDate.startsWith(year));
    const extraWork = this.getExtraWorkWithDetails().filter((w) => w.Status === 'Approved' && w.WorkDate.startsWith(year));

    const branchStats = branches.map((b) => {
      const bRewards = rewards.filter((r) => r.BranchID === b.BranchID);
      const bViolations = violations.filter((v) => {
        const emp = this.state.employees.find((e) => e.EmpID === v.EmpID);
        return emp?.BranchID === b.BranchID;
      });
      const bExtra = extraWork.filter((w) => w.BranchID === b.BranchID);

      const rewardsByCurr: Record<string, number> = {};
      bRewards.forEach((r) => {
        const c = r.currencyCode || 'YER';
        rewardsByCurr[c] = (rewardsByCurr[c] || 0) + r.Amount;
      });

      const penaltiesByCurr: Record<string, number> = {};
      bViolations.forEach((v) => {
        penaltiesByCurr['YER'] = (penaltiesByCurr['YER'] || 0) + v.PenaltyAmount;
      });

      const extraByCurr: Record<string, number> = {};
      bExtra.forEach((w) => {
        extraByCurr['YER'] = (extraByCurr['YER'] || 0) + w.Amount;
      });

      return {
        branch: b,
        rewardCount: bRewards.length,
        rewardsByCurr,
        violationCount: bViolations.length,
        penaltiesByCurr,
        extraHours: bExtra.reduce((s, x) => s + x.Hours, 0),
        extraByCurr,
      };
    });

    const deptStats = departments.map((d) => {
      const branch = branches.find((b) => b.BranchID === d.BranchID);
      const dEmpIds = this.state.employees.filter((e) => e.DeptID === d.DeptID).map((e) => e.EmpID);
      const dRewards = rewards.filter((r) => dEmpIds.includes(r.EmpID));
      const dViolations = violations.filter((v) => dEmpIds.includes(v.EmpID));

      const rewardsByCurr: Record<string, number> = {};
      dRewards.forEach((r) => {
        const c = r.currencyCode || 'YER';
        rewardsByCurr[c] = (rewardsByCurr[c] || 0) + r.Amount;
      });

      const penaltiesByCurr: Record<string, number> = {};
      dViolations.forEach((v) => {
        penaltiesByCurr['YER'] = (penaltiesByCurr['YER'] || 0) + v.PenaltyAmount;
      });

      return {
        dept: d,
        branchName: branch?.BranchName || 'فرع غير محدد',
        rewardCount: dRewards.length,
        rewardsByCurr,
        violationCount: dViolations.length,
        penaltiesByCurr,
      };
    });

    return {
      year,
      branchStats,
      deptStats,
      totalRewardsCount: rewards.length,
      totalViolationsCount: violations.length,
    };
  }

  // ============================================================
  // SQLite Views implementation (access_queries.sql)
  // ============================================================
  public qryRptRew(filter?: {
    status?: string;
    branchId?: number | null;
    search?: string;
  }) {
    let list = this.state.rewards.map((r) => {
      const emp = this.state.employees.find((e) => e.EmpID === r.EmpID);
      const rt = this.state.rewardTypes.find((t) => t.RewardTypeID === r.RewardTypeID);
      const cat = rt ? this.state.rewardCategories.find((c) => c.CategoryID === rt.CategoryID) : null;
      const currency = this.state.currencies.find((c) => c.CurrencyID === r.CurrencyID);
      const branch = this.state.branches.find((b) => b.BranchID === r.BranchID);

      return {
        RewardDate: r.RewardDate,
        EmpCode: emp?.EmpCode || '',
        FullName: emp?.FullName || '',
        CategoryName: cat?.CategoryName || 'عام',
        RewardDesc: rt?.RewardDesc || '',
        Points: r.Points,
        Amount: r.Amount,
        Status: r.Status,
        RewardID: r.RewardID,
        EmpID: r.EmpID,
        BranchID: r.BranchID,
        BranchName: branch?.BranchName || '',
        CurrencyCode: currency?.CurrencyCode || 'YER',
        Notes: r.Notes || '',
      };
    });

    list.sort((a, b) => b.RewardDate.localeCompare(a.RewardDate));

    if (filter?.status && filter.status !== 'All') {
      list = list.filter((r) => r.Status === filter.status);
    }
    if (filter?.branchId) {
      list = list.filter((r) => r.BranchID === filter.branchId);
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.FullName.toLowerCase().includes(s) ||
          r.EmpCode.toLowerCase().includes(s) ||
          r.RewardDesc.toLowerCase().includes(s)
      );
    }
    return list;
  }

  public qryRptEmpPerf(filter?: {
    branchId?: number | null;
    deptId?: number | null;
    month?: string | null;
    search?: string;
  }) {
    let emps = this.state.employees.filter((e) => e.IsActive === 1);
    if (filter?.branchId) emps = emps.filter((e) => e.BranchID === filter.branchId);
    if (filter?.deptId) emps = emps.filter((e) => e.DeptID === filter.deptId);

    const m = filter?.month;

    let result = emps.map((e) => {
      const branch = this.state.branches.find((b) => b.BranchID === e.BranchID);
      const dept = this.state.departments.find((d) => d.DeptID === e.DeptID);
      let violations = this.state.violations.filter((v) => v.EmpID === e.EmpID);
      let rewards = this.state.rewards.filter((r) => r.EmpID === e.EmpID);

      if (m) {
        violations = violations.filter((v) => v.ViolationDate.startsWith(m));
        rewards = rewards.filter((r) => r.RewardDate.startsWith(m));
      }

      const VioCount = violations.length;
      const VioAmt = violations.reduce((sum, v) => sum + v.PenaltyAmount, 0);
      const RewCount = rewards.length;
      const RewAmt = rewards.reduce((sum, r) => sum + r.Amount, 0);
      const Points = rewards.reduce((sum, r) => sum + r.Points, 0);
      const job = this.state.jobTitles.find((j) => j.JobID === e.JobID);

      return {
        EmpCode: e.EmpCode,
        FullName: e.FullName,
        BranchName: branch?.BranchName || 'فرع غير محدد',
        DeptName: dept?.DeptName || 'قسم غير محدد',
        JobTitle: job?.JobTitle || '',
        VioCount,
        VioAmt,
        RewCount,
        RewAmt,
        Points,
        EmpID: e.EmpID,
        BranchID: e.BranchID,
        DeptID: e.DeptID,
      };
    });

    result.sort((a, b) => {
      if (b.VioCount !== a.VioCount) return b.VioCount - a.VioCount;
      return b.Points - a.Points;
    });

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      result = result.filter((r) => r.FullName.toLowerCase().includes(s) || r.EmpCode.toLowerCase().includes(s));
    }
    return result;
  }

  public qryStats() {
    const yearMonths = new Set<string>();
    this.state.rewards.forEach((r) => {
      if (r.RewardDate) yearMonths.add(r.RewardDate.substring(0, 7));
    });
    this.state.violations.forEach((v) => {
      if (v.ViolationDate) yearMonths.add(v.ViolationDate.substring(0, 7));
    });

    if (yearMonths.size === 0) {
      yearMonths.add(new Date().toISOString().substring(0, 7));
    }

    const sortedMonths = Array.from(yearMonths).sort((a, b) => b.localeCompare(a));

    return sortedMonths.map((ym) => {
      const monthRewards = this.state.rewards.filter((r) => r.RewardDate.startsWith(ym));
      const monthViolations = this.state.violations.filter((v) => v.ViolationDate.startsWith(ym));
      const uniqueEmpIds = new Set(monthRewards.map((r) => r.EmpID));

      return {
        YearMonth: ym,
        EmployeesWithRewards: uniqueEmpIds.size,
        RewardsCount: monthRewards.length,
        RewardsAmount: monthRewards.reduce((sum, r) => sum + r.Amount, 0),
        TotalPoints: monthRewards.reduce((sum, r) => sum + r.Points, 0),
        ViolationsCount: monthViolations.length,
        ViolationsAmount: monthViolations.reduce((sum, v) => sum + v.PenaltyAmount, 0),
      };
    });
  }

  public qryNetEmpMonth(empId: number, yearMonth: string): number {
    const rewAmt = this.state.rewards
      .filter((r) => r.EmpID === empId && r.RewardDate.startsWith(yearMonth) && r.Status === 'Approved')
      .reduce((sum, r) => sum + r.Amount, 0);

    const extraAmt = this.state.extraWork
      .filter((w) => w.EmpID === empId && w.WorkDate.startsWith(yearMonth) && w.Status === 'Approved')
      .reduce((sum, w) => sum + w.Amount, 0);

    const vioAmt = this.state.violations
      .filter((v) => v.EmpID === empId && v.ViolationDate.startsWith(yearMonth) && v.Status === 'Confirmed')
      .reduce((sum, v) => sum + v.PenaltyAmount, 0);

    return rewAmt + extraAmt - vioAmt;
  }

  // --- SQL EXPORT & BACKUP GENERATOR WITH SAFE FOREIGN KEY HANDLING ---
  public exportToSql(): string {
    const s = this.state;
    const lines: string[] = [
      '-- ========================================================',
      '-- Albahri Incentives System - Full SQL SQLite Database Schema & Backup',
      `-- Exported At: ${new Date().toISOString()}`,
      '-- ========================================================',
      '-- Disable foreign keys while creating tables and seeding records',
      'PRAGMA foreign_keys = OFF;',
      '',
      '-- --------------------------------------------------------',
      '-- Table Schemas (DDL)',
      '-- --------------------------------------------------------',
      'CREATE TABLE IF NOT EXISTS tblCurrencies (CurrencyID INTEGER PRIMARY KEY AUTOINCREMENT, CurrencyName TEXT NOT NULL, CurrencyCode TEXT NOT NULL UNIQUE, ExchangeRate REAL NOT NULL DEFAULT 1.0, IsDefault INTEGER NOT NULL DEFAULT 0);',
      'CREATE TABLE IF NOT EXISTS tblBranches (BranchID INTEGER PRIMARY KEY AUTOINCREMENT, BranchName TEXT NOT NULL, BranchCode TEXT, IsActive INTEGER NOT NULL DEFAULT 1);',
      'CREATE TABLE IF NOT EXISTS tblDepartments (DeptID INTEGER PRIMARY KEY AUTOINCREMENT, DeptName TEXT NOT NULL, BranchID INTEGER REFERENCES tblBranches(BranchID));',
      'CREATE TABLE IF NOT EXISTS tblJobTitles (JobID INTEGER PRIMARY KEY AUTOINCREMENT, JobTitle TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblJobDuties (DutyID INTEGER PRIMARY KEY AUTOINCREMENT, JobID INTEGER REFERENCES tblJobTitles(JobID), DutyDesc TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblEmployees (EmpID INTEGER PRIMARY KEY AUTOINCREMENT, EmpCode TEXT NOT NULL UNIQUE, FullName TEXT NOT NULL, BranchID INTEGER REFERENCES tblBranches(BranchID), DeptID INTEGER REFERENCES tblDepartments(DeptID), JobID INTEGER REFERENCES tblJobTitles(JobID), CurrencyID INTEGER REFERENCES tblCurrencies(CurrencyID), Phone TEXT, HireDate TEXT, IsActive INTEGER NOT NULL DEFAULT 1);',
      'CREATE TABLE IF NOT EXISTS tblUsers (UserID INTEGER PRIMARY KEY AUTOINCREMENT, UserName TEXT NOT NULL UNIQUE, PasswordHash TEXT NOT NULL, FullName TEXT NOT NULL, EmpID INTEGER REFERENCES tblEmployees(EmpID), BranchID INTEGER REFERENCES tblBranches(BranchID), Role TEXT NOT NULL, IsActive INTEGER NOT NULL DEFAULT 1);',
      'CREATE TABLE IF NOT EXISTS tblSettings (SettingID INTEGER PRIMARY KEY AUTOINCREMENT, SettingKey TEXT NOT NULL UNIQUE, SettingValue TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblRewardCategories (CategoryID INTEGER PRIMARY KEY AUTOINCREMENT, CategoryName TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblRewardTypes (RewardTypeID INTEGER PRIMARY KEY AUTOINCREMENT, CategoryID INTEGER REFERENCES tblRewardCategories(CategoryID), RewardDesc TEXT NOT NULL, DefaultPoints INTEGER DEFAULT 0, DefaultAmount REAL DEFAULT 0);',
      'CREATE TABLE IF NOT EXISTS tblRewards (RewardID INTEGER PRIMARY KEY AUTOINCREMENT, EmpID INTEGER NOT NULL REFERENCES tblEmployees(EmpID), BranchID INTEGER NOT NULL REFERENCES tblBranches(BranchID), RewardTypeID INTEGER NOT NULL REFERENCES tblRewardTypes(RewardTypeID), CurrencyID INTEGER NOT NULL REFERENCES tblCurrencies(CurrencyID), RewardDate TEXT NOT NULL, Points INTEGER NOT NULL DEFAULT 0, Amount REAL NOT NULL DEFAULT 0, Notes TEXT, Status TEXT NOT NULL DEFAULT \'Approved\', CreatedBy INTEGER REFERENCES tblUsers(UserID), CreatedAt TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblExtraWork (ExtraID INTEGER PRIMARY KEY AUTOINCREMENT, EmpID INTEGER NOT NULL REFERENCES tblEmployees(EmpID), BranchID INTEGER NOT NULL REFERENCES tblBranches(BranchID), WorkDate TEXT NOT NULL, Hours REAL NOT NULL DEFAULT 0, Amount REAL NOT NULL DEFAULT 0, Description TEXT, Status TEXT NOT NULL DEFAULT \'Approved\');',
      'CREATE TABLE IF NOT EXISTS tblPerformanceEval (EvalID INTEGER PRIMARY KEY AUTOINCREMENT, EmpID INTEGER NOT NULL REFERENCES tblEmployees(EmpID), BranchID INTEGER NOT NULL REFERENCES tblBranches(BranchID), EvalDate TEXT NOT NULL, EvalMonth TEXT NOT NULL, Score INTEGER NOT NULL DEFAULT 0, Notes TEXT);',
      'CREATE TABLE IF NOT EXISTS tblViolationTypes (ViolationTypeID INTEGER PRIMARY KEY AUTOINCREMENT, ViolationName TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblViolationDegrees (DegreeID INTEGER PRIMARY KEY AUTOINCREMENT, DegreeName TEXT NOT NULL, DefaultPenalty REAL NOT NULL DEFAULT 0);',
      'CREATE TABLE IF NOT EXISTS tblAdminActions (ActionID INTEGER PRIMARY KEY AUTOINCREMENT, ActionName TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblViolations (ViolationID INTEGER PRIMARY KEY AUTOINCREMENT, EmpID INTEGER NOT NULL REFERENCES tblEmployees(EmpID), ViolationTypeID INTEGER NOT NULL REFERENCES tblViolationTypes(ViolationTypeID), DegreeID INTEGER NOT NULL REFERENCES tblViolationDegrees(DegreeID), ActionID INTEGER NOT NULL REFERENCES tblAdminActions(ActionID), ViolationDate TEXT NOT NULL, PenaltyAmount REAL NOT NULL DEFAULT 0, Notes TEXT, Status TEXT NOT NULL DEFAULT \'Confirmed\', CreatedBy INTEGER REFERENCES tblUsers(UserID), CreatedAt TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblAuditLog (LogID INTEGER PRIMARY KEY AUTOINCREMENT, UserID INTEGER, ActionType TEXT NOT NULL, TableName TEXT NOT NULL, RecordID INTEGER, LogDate TEXT NOT NULL, Details TEXT);',
      'CREATE TABLE IF NOT EXISTS tblRoles (RoleID INTEGER PRIMARY KEY, RoleName TEXT NOT NULL, Description TEXT, IsSystem INTEGER NOT NULL DEFAULT 0);',
      'CREATE TABLE IF NOT EXISTS tblRolePermissions (RoleID INTEGER NOT NULL, Screen TEXT NOT NULL, Actions TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS tblImportLogs (LogID INTEGER PRIMARY KEY AUTOINCREMENT, ImportType TEXT NOT NULL, ImportTypeLabel TEXT NOT NULL, FileName TEXT NOT NULL, UserName TEXT NOT NULL, ImportDate TEXT NOT NULL, SuccessCount INTEGER NOT NULL DEFAULT 0, FailedCount INTEGER NOT NULL DEFAULT 0);',
      'CREATE TABLE IF NOT EXISTS tblSyncLogs (SyncID INTEGER PRIMARY KEY AUTOINCREMENT, SyncType TEXT NOT NULL, DeviceRole TEXT NOT NULL, DeviceName TEXT, BranchID INTEGER, BranchName TEXT, SyncDate TEXT NOT NULL, FileName TEXT NOT NULL, Status TEXT NOT NULL, Notes TEXT);',
      '',
      '-- --------------------------------------------------------',
      '-- Seed Data & Current Records (DML)',
      '-- --------------------------------------------------------',
    ];

    // tblCurrencies
    lines.push('-- tblCurrencies');
    s.currencies.forEach((c) => {
      lines.push(
        `INSERT INTO tblCurrencies (CurrencyID, CurrencyName, CurrencyCode, ExchangeRate, IsDefault) VALUES (${c.CurrencyID}, '${c.CurrencyName.replace(/'/g, "''")}', '${c.CurrencyCode}', ${c.ExchangeRate}, ${c.IsDefault});`
      );
    });
    lines.push('');

    // tblBranches
    lines.push('-- tblBranches');
    s.branches.forEach((b) => {
      lines.push(
        `INSERT INTO tblBranches (BranchID, BranchName, BranchCode, IsActive) VALUES (${b.BranchID}, '${b.BranchName.replace(/'/g, "''")}', '${b.BranchCode || ''}', ${b.IsActive});`
      );
    });
    lines.push('');

    // tblDepartments
    lines.push('-- tblDepartments');
    s.departments.forEach((d) => {
      lines.push(`INSERT INTO tblDepartments (DeptID, DeptName, BranchID) VALUES (${d.DeptID}, '${d.DeptName.replace(/'/g, "''")}', ${d.BranchID});`);
    });
    lines.push('');

    // tblJobTitles
    lines.push('-- tblJobTitles');
    s.jobTitles.forEach((j) => {
      lines.push(`INSERT INTO tblJobTitles (JobID, JobTitle) VALUES (${j.JobID}, '${j.JobTitle.replace(/'/g, "''")}');`);
    });
    lines.push('');

    // tblJobDuties
    lines.push('-- tblJobDuties');
    s.jobDuties.forEach((jd) => {
      lines.push(`INSERT INTO tblJobDuties (DutyID, JobID, DutyDesc) VALUES (${jd.DutyID}, ${jd.JobID}, '${jd.DutyDesc.replace(/'/g, "''")}');`);
    });
    lines.push('');

    // tblEmployees
    lines.push('-- tblEmployees');
    s.employees.forEach((e) => {
      lines.push(
        `INSERT INTO tblEmployees (EmpID, EmpCode, FullName, BranchID, DeptID, JobID, CurrencyID, Phone, HireDate, IsActive) VALUES (${e.EmpID}, '${e.EmpCode}', '${e.FullName.replace(/'/g, "''")}', ${e.BranchID}, ${e.DeptID || 'NULL'}, ${e.JobID || 'NULL'}, ${e.CurrencyID}, '${e.Phone || ''}', '${e.HireDate}', ${e.IsActive});`
      );
    });
    lines.push('');

    // tblUsers
    lines.push('-- tblUsers');
    s.users.forEach((u) => {
      lines.push(
        `INSERT INTO tblUsers (UserID, UserName, PasswordHash, FullName, EmpID, BranchID, Role, IsActive) VALUES (${u.UserID}, '${u.UserName}', '${u.PasswordHash}', '${u.FullName.replace(/'/g, "''")}', ${u.EmpID || 'NULL'}, ${u.BranchID || 'NULL'}, '${u.Role}', ${u.IsActive});`
      );
    });
    lines.push('');

    // tblSettings
    lines.push('-- tblSettings');
    s.settings.forEach((st) => {
      lines.push(`INSERT INTO tblSettings (SettingID, SettingKey, SettingValue) VALUES (${st.SettingID}, '${st.SettingKey}', '${st.SettingValue.replace(/'/g, "''")}');`);
    });
    lines.push('');

    // tblRewardCategories
    lines.push('-- tblRewardCategories');
    s.rewardCategories.forEach((rc) => {
      lines.push(`INSERT INTO tblRewardCategories (CategoryID, CategoryName) VALUES (${rc.CategoryID}, '${rc.CategoryName.replace(/'/g, "''")}');`);
    });
    lines.push('');

    // tblRewardTypes
    lines.push('-- tblRewardTypes');
    s.rewardTypes.forEach((rt) => {
      lines.push(
        `INSERT INTO tblRewardTypes (RewardTypeID, CategoryID, RewardDesc, DefaultPoints, DefaultAmount) VALUES (${rt.RewardTypeID}, ${rt.CategoryID}, '${rt.RewardDesc.replace(/'/g, "''")}', ${rt.DefaultPoints}, ${rt.DefaultAmount});`
      );
    });
    lines.push('');

    // tblRewards
    lines.push('-- tblRewards');
    s.rewards.forEach((r) => {
      lines.push(
        `INSERT INTO tblRewards (RewardID, EmpID, BranchID, RewardTypeID, CurrencyID, RewardDate, Points, Amount, Notes, Status, CreatedBy, CreatedAt) VALUES (${r.RewardID}, ${r.EmpID}, ${r.BranchID}, ${r.RewardTypeID}, ${r.CurrencyID}, '${r.RewardDate}', ${r.Points}, ${r.Amount}, '${(r.Notes || '').replace(/'/g, "''")}', '${r.Status}', ${r.CreatedBy}, '${r.CreatedAt}');`
      );
    });
    lines.push('');

    // tblExtraWork
    lines.push('-- tblExtraWork');
    s.extraWork.forEach((ew) => {
      lines.push(
        `INSERT INTO tblExtraWork (ExtraID, EmpID, BranchID, WorkDate, Hours, Amount, Description, Status) VALUES (${ew.ExtraID}, ${ew.EmpID}, ${ew.BranchID}, '${ew.WorkDate}', ${ew.Hours}, ${ew.Amount}, '${(ew.Description || '').replace(/'/g, "''")}', '${ew.Status}');`
      );
    });
    lines.push('');

    // tblPerformanceEval
    lines.push('-- tblPerformanceEval');
    s.performanceEvals.forEach((pe) => {
      lines.push(
        `INSERT INTO tblPerformanceEval (EvalID, EmpID, BranchID, EvalDate, EvalMonth, Score, Notes) VALUES (${pe.EvalID}, ${pe.EmpID}, ${pe.BranchID}, '${pe.EvalDate}', '${pe.EvalMonth}', ${pe.Score}, '${(pe.Notes || '').replace(/'/g, "''")}');`
      );
    });
    lines.push('');

    // tblViolationTypes
    lines.push('-- tblViolationTypes');
    s.violationTypes.forEach((vt) => {
      lines.push(`INSERT INTO tblViolationTypes (ViolationTypeID, ViolationName) VALUES (${vt.ViolationTypeID}, '${vt.ViolationName.replace(/'/g, "''")}');`);
    });
    lines.push('');

    // tblViolationDegrees
    lines.push('-- tblViolationDegrees');
    s.violationDegrees.forEach((vd) => {
      lines.push(`INSERT INTO tblViolationDegrees (DegreeID, DegreeName, DefaultPenalty) VALUES (${vd.DegreeID}, '${vd.DegreeName.replace(/'/g, "''")}', ${vd.DefaultPenalty});`);
    });
    lines.push('');

    // tblAdminActions
    lines.push('-- tblAdminActions');
    s.adminActions.forEach((aa) => {
      lines.push(`INSERT INTO tblAdminActions (ActionID, ActionName) VALUES (${aa.ActionID}, '${aa.ActionName.replace(/'/g, "''")}');`);
    });
    lines.push('');

    // tblViolations
    lines.push('-- tblViolations');
    s.violations.forEach((v) => {
      lines.push(
        `INSERT INTO tblViolations (ViolationID, EmpID, ViolationTypeID, DegreeID, ActionID, ViolationDate, PenaltyAmount, Notes, Status, CreatedBy, CreatedAt) VALUES (${v.ViolationID}, ${v.EmpID}, ${v.ViolationTypeID}, ${v.DegreeID}, ${v.ActionID}, '${v.ViolationDate}', ${v.PenaltyAmount}, '${(v.Notes || '').replace(/'/g, "''")}', '${v.Status}', ${v.CreatedBy}, '${v.CreatedAt}');`
      );
    });
    lines.push('');

    // tblAuditLog
    lines.push('-- tblAuditLog');
    s.auditLogs.slice(0, 50).forEach((al) => {
      lines.push(
        `INSERT INTO tblAuditLog (LogID, UserID, ActionType, TableName, RecordID, LogDate, Details) VALUES (${al.LogID}, ${al.UserID}, '${al.ActionType}', '${al.TableName}', ${al.RecordID || 'NULL'}, '${al.LogDate}', '${(al.Details || '').replace(/'/g, "''")}');`
      );
    });
    lines.push('');

    // Re-enable foreign keys
    lines.push('-- Re-enable foreign keys after all tables and records are loaded');
    lines.push('PRAGMA foreign_keys = ON;');
    lines.push('');

    // SQLite Views from access_queries.sql
    lines.push('-- ============================================================');
    lines.push('-- SQLite Views (access_queries.sql)');
    lines.push('-- ============================================================');
    lines.push('CREATE VIEW IF NOT EXISTS qryRptRew AS');
    lines.push('SELECT');
    lines.push('  R.RewardDate,');
    lines.push('  E.EmpCode,');
    lines.push('  E.FullName,');
    lines.push('  RC.CategoryName,');
    lines.push('  T.RewardDesc,');
    lines.push('  R.Points,');
    lines.push('  R.Amount,');
    lines.push('  R.Status');
    lines.push('FROM tblRewards AS R');
    lines.push('INNER JOIN tblEmployees AS E ON R.EmpID = E.EmpID');
    lines.push('LEFT JOIN tblRewardTypes AS T ON R.RewardTypeID = T.RewardTypeID');
    lines.push('LEFT JOIN tblRewardCategories AS RC ON T.CategoryID = RC.CategoryID');
    lines.push('ORDER BY R.RewardDate DESC;');
    lines.push('');
    lines.push('CREATE VIEW IF NOT EXISTS qryRptEmpPerf AS');
    lines.push('SELECT');
    lines.push('  E.EmpCode,');
    lines.push('  E.FullName,');
    lines.push('  B.BranchName,');
    lines.push('  D.DeptName,');
    lines.push('  IFNULL((SELECT COUNT(*) FROM tblViolations V WHERE V.EmpID = E.EmpID), 0) AS VioCount,');
    lines.push('  IFNULL((SELECT SUM(V2.PenaltyAmount) FROM tblViolations V2 WHERE V2.EmpID = E.EmpID), 0) AS VioAmt,');
    lines.push('  IFNULL((SELECT COUNT(*) FROM tblRewards R WHERE R.EmpID = E.EmpID), 0) AS RewCount,');
    lines.push('  IFNULL((SELECT SUM(R2.Amount) FROM tblRewards R2 WHERE R2.EmpID = E.EmpID), 0) AS RewAmt,');
    lines.push('  IFNULL((SELECT SUM(R3.Points) FROM tblRewards R3 WHERE R3.EmpID = E.EmpID), 0) AS Points');
    lines.push('FROM tblEmployees AS E');
    lines.push('LEFT JOIN tblBranches AS B ON E.BranchID = B.BranchID');
    lines.push('LEFT JOIN tblDepartments AS D ON E.DeptID = D.DeptID');
    lines.push('WHERE E.IsActive = 1');
    lines.push('ORDER BY VioCount DESC, Points DESC;');
    lines.push('');
    lines.push('CREATE VIEW IF NOT EXISTS qryStats AS');
    lines.push('SELECT');
    lines.push("  strftime('%Y-%m', R.RewardDate) AS YearMonth,");
    lines.push('  COUNT(DISTINCT R.EmpID) AS EmployeesWithRewards,');
    lines.push('  COUNT(R.RewardID) AS RewardsCount,');
    lines.push('  IFNULL(SUM(R.Amount), 0) AS RewardsAmount,');
    lines.push('  IFNULL(SUM(R.Points), 0) AS TotalPoints,');
    lines.push("  (SELECT COUNT(*) FROM tblViolations V WHERE strftime('%Y-%m', V.ViolationDate) = strftime('%Y-%m', R.RewardDate)) AS ViolationsCount,");
    lines.push("  (SELECT IFNULL(SUM(V2.PenaltyAmount), 0) FROM tblViolations V2 WHERE strftime('%Y-%m', V2.ViolationDate) = strftime('%Y-%m', R.RewardDate)) AS ViolationsAmount");
    lines.push('FROM tblRewards AS R');
    lines.push("GROUP BY strftime('%Y-%m', R.RewardDate)");
    lines.push('ORDER BY YearMonth DESC;');

    return lines.join('\n');
  }

  public importJson(jsonString: string, currentUserId: number): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.users)) {
        this.state = {
          ...INITIAL_STATE,
          ...data,
        };
        this.logAudit(currentUserId, 'RESTORE', 'all', null, 'استيراد نسخة احتياطية JSON بنجاح');
        this.persist();
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON backup', e);
    }
    return false;
  }
}

export const db = new DatabaseStore();

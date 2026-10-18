/**
 * TypeScript Data Models mirroring the Albahri Incentives System SQLite Schema
 */

export interface Currency {
  CurrencyID: number;
  CurrencyName: string;
  CurrencyCode: string;
  ExchangeRate: number;
  IsDefault: number; // 1 or 0
}

export interface Branch {
  BranchID: number;
  BranchName: string;
  BranchCode?: string;
  IsActive: number; // 1 or 0
}

export interface Department {
  DeptID: number;
  DeptName: string;
  BranchID: number;
}

export interface JobTitle {
  JobID: number;
  JobTitle: string;
}

export interface JobDuty {
  DutyID: number;
  JobID: number;
  DutyDesc: string;
}

export interface Employee {
  EmpID: number;
  EmpCode: string;
  FullName: string;
  NationalID?: string | null;
  Phone?: string | null;
  Email?: string | null;
  HireDate: string;
  BranchID: number;
  DeptID?: number | null;
  JobID?: number | null;
  BaseSalary?: number | null;
  CurrencyID: number;
  IsActive: number; // 1 or 0
  Notes?: string | null;
}

export type UserRole = 'Admin' | 'Manager' | 'User' | string;

export type ScreenKey =
  | 'dashboard'
  | 'employees'
  | 'branches'
  | 'departments'
  | 'rewards'
  | 'violations'
  | 'penalties'
  | 'reports'
  | 'users'
  | 'settings'
  | 'imports';

export type ActionKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'print'
  | 'export'
  | 'import';

export interface Role {
  RoleID: number;
  RoleName: string;
  Description?: string;
  IsSystem?: number; // 1 = Admin (cannot be deleted/modified)
}

export interface RolePermission {
  RoleID: number;
  Screen: ScreenKey;
  Actions: ActionKey[];
}

export interface User {
  UserID: number;
  UserName: string;
  PasswordHash: string;
  FullName: string;
  EmpID?: number | null;
  BranchID?: number | null;
  RoleID: number;
  Role: UserRole;
  IsActive: number; // 1 or 0 (نشط / موقف)
}

export interface Setting {
  SettingID: number;
  SettingKey: string;
  SettingValue: string;
}

export interface RewardCategory {
  CategoryID: number;
  CategoryName: string;
}

export interface RewardType {
  RewardTypeID: number;
  CategoryID: number;
  RewardDesc: string;
  DefaultPoints: number;
  DefaultAmount: number;
}

export interface Reward {
  RewardID: number;
  EmpID: number;
  BranchID: number;
  RewardTypeID: number;
  CurrencyID: number;
  RewardDate: string;
  Points: number;
  Amount: number;
  Notes: string;
  Status: 'Approved' | 'Pending' | 'Rejected';
  CreatedBy: number;
  CreatedAt: string;
}

export interface ExtraWork {
  ExtraID: number;
  EmpID: number;
  BranchID: number;
  WorkDate: string;
  Hours: number;
  Amount: number;
  Description: string;
  Status: 'Approved' | 'Pending' | 'Rejected';
}

export interface PerformanceEval {
  EvalID: number;
  EmpID: number;
  BranchID: number;
  EvalDate: string;
  EvalMonth: string; // e.g. "2026-10"
  Score: number;     // 0 - 100
  Notes: string;
}

export interface ViolationType {
  ViolationTypeID: number;
  ViolationName: string;
}

export interface ViolationDegree {
  DegreeID: number;
  DegreeName: string;
  DefaultPenalty: number;
}

export interface AdminAction {
  ActionID: number;
  ActionName: string;
}

export interface Violation {
  ViolationID: number;
  EmpID: number;
  ViolationTypeID: number;
  DegreeID: number;
  ActionID: number;
  ViolationDate: string;
  PenaltyAmount: number;
  Notes: string;
  Status: 'Confirmed' | 'Pending' | 'Cancelled';
  CreatedBy: number;
  CreatedAt: string;
}

export interface AuditLog {
  LogID: number;
  UserID: number;
  ActionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'RESTORE';
  TableName: string;
  RecordID?: number | null;
  LogDate: string;
  Details: string;
}

export interface ImportLogError {
  rowNumber: number;
  reason: string;
  field?: string;
  rowData?: Record<string, any>;
}

export interface ImportLog {
  LogID: number;
  ImportType: string;
  ImportTypeLabel: string;
  FileName: string;
  UserName: string;
  ImportDate: string;
  SuccessCount: number;
  FailedCount: number;
  Errors?: ImportLogError[];
}

export interface SyncLog {
  SyncID: number;
  SyncType: 'EXPORT' | 'IMPORT';
  DeviceRole: 'MASTER' | 'SECONDARY';
  DeviceName?: string;
  BranchID?: number | null;
  BranchName?: string;
  SyncDate: string;
  FileName: string;
  RecordsSummary: {
    employees?: number;
    rewards?: number;
    violations?: number;
    extraWork?: number;
    performanceEvals?: number;
  };
  Status: 'SUCCESS' | 'WARNING' | 'FAILED';
  Notes?: string;
}

export interface DatabaseState {
  currencies: Currency[];
  branches: Branch[];
  departments: Department[];
  jobTitles: JobTitle[];
  jobDuties: JobDuty[];
  employees: Employee[];
  users: User[];
  settings: Setting[];
  rewardCategories: RewardCategory[];
  rewardTypes: RewardType[];
  rewards: Reward[];
  extraWork: ExtraWork[];
  performanceEvals: PerformanceEval[];
  violationTypes: ViolationType[];
  violationDegrees: ViolationDegree[];
  adminActions: AdminAction[];
  violations: Violation[];
  auditLogs: AuditLog[];
  roles: Role[];
  rolePermissions: RolePermission[];
  importLogs: ImportLog[];
  syncLogs: SyncLog[];
}



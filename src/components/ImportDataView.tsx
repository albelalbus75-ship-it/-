import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import { ImportLog, ImportLogError } from '../types/database';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  RefreshCw,
  PlusCircle,
  History,
  Check,
  ShieldAlert,
} from 'lucide-react';

export type ImportTypeKey =
  | 'employees'
  | 'branches'
  | 'departments'
  | 'reward_types'
  | 'rewards'
  | 'violation_types'
  | 'violations'
  | 'penalties'
  | 'users';

interface FieldSpec {
  arabicName: string;
  dbField: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  desc: string;
  aliases: string[]; // Variations in Arabic or English that match this column
}

interface ImportConfig {
  key: ImportTypeKey;
  label: string;
  tableName: string;
  desc: string;
  fields: FieldSpec[];
  sampleRows: Record<string, any>[];
}

const IMPORT_CONFIGS: ImportConfig[] = [
  {
    key: 'employees',
    label: 'الموظفون (tblEmployees)',
    tableName: 'tblEmployees',
    desc: 'سجل الموظفين الأساسي، يشمل الرقم الوظيفي والفرع والقسم وتاريخ التعيين والراتب',
    fields: [
      {
        arabicName: 'الرقم الوظيفي',
        dbField: 'EmpCode',
        type: 'text',
        required: true,
        desc: 'كود الموظف الفريد (مثال: EMP-101)',
        aliases: ['الرقم الوظيفي', 'كود الموظف', 'رقم الموظف', 'empcode', 'emp_code', 'code'],
      },
      {
        arabicName: 'الاسم الكامل',
        dbField: 'FullName',
        type: 'text',
        required: true,
        desc: 'الاسم الثلاثي أو الرباعي للموظف',
        aliases: ['الاسم الكامل', 'اسم الموظف', 'الاسم', 'fullname', 'name', 'emp_name'],
      },
      {
        arabicName: 'اسم الفرع',
        dbField: 'BranchName',
        type: 'text',
        required: true,
        desc: 'اسم الفرع التابع له (يُنشأ تلقائياً إذا فُعّل خيار إنشاء المراجع)',
        aliases: ['اسم الفرع', 'الفرع', 'branchname', 'branch', 'branch_name'],
      },
      {
        arabicName: 'اسم القسم',
        dbField: 'DeptName',
        type: 'text',
        required: false,
        desc: 'اسم القسم التابع للفرع (يُنشأ تلقائياً إذا فُعّل الخيار)',
        aliases: ['اسم القسم', 'القسم', 'deptname', 'dept', 'department', 'dept_name'],
      },
      {
        arabicName: 'المسمى الوظيفي',
        dbField: 'JobTitle',
        type: 'text',
        required: false,
        desc: 'الوظيفة الحالية (مثال: محاسب، مسؤول مبيعات)',
        aliases: ['المسمى الوظيفي', 'الوظيفة', 'jobtitle', 'job', 'job_title', 'title'],
      },
      {
        arabicName: 'تاريخ التعيين',
        dbField: 'HireDate',
        type: 'date',
        required: true,
        desc: 'تاريخ بداية العمل (صيغة YYYY-MM-DD)',
        aliases: ['تاريخ التعيين', 'تاريخ المباشرة', 'تاريخ العمل', 'hiredate', 'hire_date', 'date'],
      },
      {
        arabicName: 'الراتب الأساسي',
        dbField: 'BaseSalary',
        type: 'number',
        required: false,
        desc: 'الراتب الأساسي بالعملة المحددة (رقم موجب)',
        aliases: ['الراتب الأساسي', 'الراتب', 'basesalary', 'salary', 'base_salary'],
      },
      {
        arabicName: 'رمز العملة',
        dbField: 'CurrencyCode',
        type: 'select',
        required: false,
        desc: 'رمز العملة (YER, SAR, USD) - الافتراضي YER',
        aliases: ['رمز العملة', 'العملة', 'currencycode', 'currency', 'currency_code'],
      },
      {
        arabicName: 'رقم الهوية',
        dbField: 'NationalID',
        type: 'text',
        required: false,
        desc: 'رقم البطاقة الشخصية أو جواز السفر',
        aliases: ['رقم الهوية', 'الهوية', 'الرقم الوطني', 'nationalid', 'national_id', 'id_number'],
      },
      {
        arabicName: 'رقم الهاتف',
        dbField: 'Phone',
        type: 'text',
        required: false,
        desc: 'رقم الاتصال المباشر',
        aliases: ['رقم الهاتف', 'الهاتف', 'الجوال', 'الموبايل', 'phone', 'mobile'],
      },
      {
        arabicName: 'البريد الإلكتروني',
        dbField: 'Email',
        type: 'text',
        required: false,
        desc: 'البريد الرسمي للموظف',
        aliases: ['البريد الإلكتروني', 'البريد', 'الايميل', 'email', 'e-mail'],
      },
      {
        arabicName: 'الحالة',
        dbField: 'IsActive',
        type: 'boolean',
        required: false,
        desc: '1 أو نشط / 0 أو موقف (الافتراضي نشط)',
        aliases: ['الحالة', 'نشط', 'isactive', 'active', 'status'],
      },
      {
        arabicName: 'ملاحظات',
        dbField: 'Notes',
        type: 'text',
        required: false,
        desc: 'ملاحظات إضافية عن الموظف',
        aliases: ['ملاحظات', 'الملاحظات', 'notes', 'note'],
      },
    ],
    sampleRows: [
      {
        'الرقم الوظيفي': 'EMP-201',
        'الاسم الكامل': 'أحمد محمد باوزير',
        'اسم الفرع': 'المركز الرئيسي - صنعاء',
        'اسم القسم': 'قسم المحاسبة والمالية',
        'المسمى الوظيفي': 'محاسب عام',
        'تاريخ التعيين': '2024-01-15',
        'الراتب الأساسي': 180000,
        'رمز العملة': 'YER',
        'رقم الهوية': '0102003344',
        'رقم الهاتف': '771234567',
        'البريد الإلكتروني': 'ahmed.bawazir@albahri.com',
        'الحالة': 'نشط',
        'ملاحظات': 'موظف متميز في إعداد التقارير',
      },
      {
        'الرقم الوظيفي': 'EMP-202',
        'الاسم الكامل': 'خالد سعيد العامري',
        'اسم الفرع': 'فرع عدن - خور مكسر',
        'اسم القسم': 'إدارة المبيعات والتسويق',
        'المسمى الوظيفي': 'مسؤول مبيعات',
        'تاريخ التعيين': '2024-03-01',
        'الراتب الأساسي': 160000,
        'رمز العملة': 'YER',
        'رقم الهوية': '0203004455',
        'رقم الهاتف': '732345678',
        'البريد الإلكتروني': 'khaled.saeed@albahri.com',
        'الحالة': 'نشط',
        'ملاحظات': 'تغطية المنطقة الجنوبية',
      },
      {
        'الرقم الوظيفي': 'EMP-203',
        'الاسم الكامل': 'فاطمة سالم باقيس',
        'اسم الفرع': 'فرع تعز - شارع جمال',
        'اسم القسم': 'خدمة العملاء والاتصال',
        'المسمى الوظيفي': 'خدمة عملاء',
        'تاريخ التعيين': '2024-05-10',
        'الراتب الأساسي': 140000,
        'رمز العملة': 'YER',
        'رقم الهوية': '0304005566',
        'رقم الهاتف': '713456789',
        'البريد الإلكتروني': 'fatima.salem@albahri.com',
        'الحالة': 'نشط',
        'ملاحظات': 'إتقان أنظمة الاتصال والمتابعة',
      },
    ],
  },
  {
    key: 'branches',
    label: 'الفروع (tblBranches)',
    tableName: 'tblBranches',
    desc: 'فروع المؤسسة ومراكز التكلفة التشغيلية',
    fields: [
      {
        arabicName: 'كود الفرع',
        dbField: 'BranchCode',
        type: 'text',
        required: false,
        desc: 'رمز الفرع الفريد (مثال: BR-01)',
        aliases: ['كود الفرع', 'رمز الفرع', 'branchcode', 'branch_code', 'code'],
      },
      {
        arabicName: 'اسم الفرع',
        dbField: 'BranchName',
        type: 'text',
        required: true,
        desc: 'الاسم الرسمي للفرع',
        aliases: ['اسم الفرع', 'الفرع', 'branchname', 'name', 'branch_name'],
      },
      {
        arabicName: 'الحالة',
        dbField: 'IsActive',
        type: 'boolean',
        required: false,
        desc: 'نشط أو موقف (افتراضي نشط)',
        aliases: ['الحالة', 'نشط', 'isactive', 'active'],
      },
    ],
    sampleRows: [
      { 'كود الفرع': 'BR-01', 'اسم الفرع': 'المركز الرئيسي - صنعاء', 'الحالة': 'نشط' },
      { 'كود الفرع': 'BR-02', 'اسم الفرع': 'فرع عدن - خور مكسر', 'الحالة': 'نشط' },
      { 'كود الفرع': 'BR-03', 'اسم الفرع': 'فرع الحديدة - الميناء', 'الحالة': 'نشط' },
    ],
  },
  {
    key: 'departments',
    label: 'الأقسام (tblDepartments)',
    tableName: 'tblDepartments',
    desc: 'الأقسام الإدارية والتشغيلية الموزعة حسب الفروع',
    fields: [
      {
        arabicName: 'اسم القسم',
        dbField: 'DeptName',
        type: 'text',
        required: true,
        desc: 'مسمى القسم الإداري',
        aliases: ['اسم القسم', 'القسم', 'deptname', 'name', 'department'],
      },
      {
        arabicName: 'اسم الفرع',
        dbField: 'BranchName',
        type: 'text',
        required: true,
        desc: 'اسم الفرع التابع له القسم',
        aliases: ['اسم الفرع', 'الفرع', 'branchname', 'branch', 'branch_name'],
      },
    ],
    sampleRows: [
      { 'اسم القسم': 'قسم المحاسبة والمالية', 'اسم الفرع': 'المركز الرئيسي - صنعاء' },
      { 'اسم القسم': 'إدارة المبيعات والتسويق', 'اسم الفرع': 'المركز الرئيسي - صنعاء' },
      { 'اسم القسم': 'قسم المستودعات واللوجستيات', 'اسم الفرع': 'فرع عدن - خور مكسر' },
    ],
  },
  {
    key: 'reward_types',
    label: 'أنواع الحوافز (tblRewardTypes)',
    tableName: 'tblRewardTypes',
    desc: 'تعريف الحوافز والمكافآت مع النقاط والمبالغ الافتراضية',
    fields: [
      {
        arabicName: 'تصنيف الحافز',
        dbField: 'CategoryName',
        type: 'text',
        required: true,
        desc: 'التصنيف الرئيسي (مثال: حوافز الإنتاجية، مكافآت التميز)',
        aliases: ['تصنيف الحافز', 'التصنيف', 'categoryname', 'category', 'cat'],
      },
      {
        arabicName: 'وصف الحافز',
        dbField: 'RewardDesc',
        type: 'text',
        required: true,
        desc: 'الوصف التفصيلي لنوع الحافز',
        aliases: ['وصف الحافز', 'اسم الحافز', 'نوع الحافز', 'rewarddesc', 'desc', 'description'],
      },
      {
        arabicName: 'النقاط الافتراضية',
        dbField: 'DefaultPoints',
        type: 'number',
        required: false,
        desc: 'النقاط المستحقة كقيمة قياسية',
        aliases: ['النقاط الافتراضية', 'النقاط', 'defaultpoints', 'points'],
      },
      {
        arabicName: 'المبلغ الافتراضي',
        dbField: 'DefaultAmount',
        type: 'number',
        required: false,
        desc: 'المبلغ المالي الافتراضي المستحق',
        aliases: ['المبلغ الافتراضي', 'المبلغ', 'defaultamount', 'amount'],
      },
    ],
    sampleRows: [
      {
        'تصنيف الحافز': 'حوافز الإنتاجية والمبيعات',
        'وصف الحافز': 'تحقيق الهدف البيعي ربع السنوي',
        'النقاط الافتراضية': 75,
        'المبلغ الافتراضي': 50000,
      },
      {
        'تصنيف الحافز': 'حوافز الانضباط والالتزام',
        'وصف الحافز': 'الالتزام التام بالمناوبات الليلية',
        'النقاط الافتراضية': 30,
        'المبلغ الافتراضي': 25000,
      },
    ],
  },
  {
    key: 'rewards',
    label: 'الحوافز المسجلة (tblRewards)',
    tableName: 'tblRewards',
    desc: 'سجلات صرف الحوافز الفردية المرتبطة بالموظفين',
    fields: [
      {
        arabicName: 'الرقم الوظيفي',
        dbField: 'EmpCode',
        type: 'text',
        required: true,
        desc: 'كود الموظف المستحق (يجب أن يكون مسجلاً)',
        aliases: ['الرقم الوظيفي', 'كود الموظف', 'empcode', 'emp_code'],
      },
      {
        arabicName: 'وصف نوع الحافز',
        dbField: 'RewardDesc',
        type: 'text',
        required: true,
        desc: 'نوع الحافز المصروف (يُربط أو يُنشأ تلقائياً)',
        aliases: ['وصف نوع الحافز', 'نوع الحافز', 'الحافز', 'rewarddesc', 'reward_type'],
      },
      {
        arabicName: 'تاريخ الحافز',
        dbField: 'RewardDate',
        type: 'date',
        required: true,
        desc: 'تاريخ الصرف أو الاستحقاق (YYYY-MM-DD)',
        aliases: ['تاريخ الحافز', 'التاريخ', 'rewarddate', 'date'],
      },
      {
        arabicName: 'المبلغ',
        dbField: 'Amount',
        type: 'number',
        required: true,
        desc: 'مبلغ المكافأة المصروفة',
        aliases: ['المبلغ', 'القيمة', 'amount'],
      },
      {
        arabicName: 'النقاط',
        dbField: 'Points',
        type: 'number',
        required: false,
        desc: 'نقاط التقييم المضافة للموظف',
        aliases: ['النقاط', 'points'],
      },
      {
        arabicName: 'الحالة',
        dbField: 'Status',
        type: 'select',
        required: false,
        desc: 'Approved (معتمد) أو Pending (معلق) - افتراضي Approved',
        aliases: ['الحالة', 'status'],
      },
      {
        arabicName: 'ملاحظات',
        dbField: 'Notes',
        type: 'text',
        required: false,
        desc: 'ملاحظات أو سبب الصرف',
        aliases: ['ملاحظات', 'notes'],
      },
    ],
    sampleRows: [
      {
        'الرقم الوظيفي': 'EMP-201',
        'وصف نوع الحافز': 'تحقيق المستهدف البيعي الشهري',
        'تاريخ الحافز': '2026-10-01',
        'المبلغ': 40000,
        'النقاط': 50,
        'الحالة': 'Approved',
        'ملاحظات': 'استحقاق شهري لتميز الأداء',
      },
    ],
  },
  {
    key: 'violation_types',
    label: 'أنواع المخالفات (tblViolationTypes)',
    tableName: 'tblViolationTypes',
    desc: 'لائحة المخالفات الإدارية والتشغيلية المعتمدة',
    fields: [
      {
        arabicName: 'مسمى المخالفة',
        dbField: 'ViolationName',
        type: 'text',
        required: true,
        desc: 'عنوان وتوصيف المخالفة الإدارية',
        aliases: ['مسمى المخالفة', 'اسم المخالفة', 'المخالفة', 'violationname', 'name'],
      },
    ],
    sampleRows: [
      { 'مسمى المخالفة': 'مغادرة مقر العمل قبل نهاية الدوام الرسمي' },
      { 'مسمى المخالفة': 'عدم ارتداء الزي الرسمي المعتمد' },
      { 'مسمى المخالفة': 'التأخر في تسليم التقارير اليومية' },
    ],
  },
  {
    key: 'violations',
    label: 'المخالفات المسجلة (tblViolations)',
    tableName: 'tblViolations',
    desc: 'سجلات المخالفات والوقائع المرصودة على الموظفين مع الجزاءات',
    fields: [
      {
        arabicName: 'الرقم الوظيفي',
        dbField: 'EmpCode',
        type: 'text',
        required: true,
        desc: 'كود الموظف المرتكب للمخالفة',
        aliases: ['الرقم الوظيفي', 'كود الموظف', 'empcode', 'emp_code'],
      },
      {
        arabicName: 'مسمى المخالفة',
        dbField: 'ViolationName',
        type: 'text',
        required: true,
        desc: 'نوع المخالفة المرتكبة',
        aliases: ['مسمى المخالفة', 'نوع المخالفة', 'violationname', 'violation'],
      },
      {
        arabicName: 'درجة المخالفة',
        dbField: 'DegreeName',
        type: 'text',
        required: false,
        desc: 'الدرجة الأولى / الثانية / الثالثة',
        aliases: ['درجة المخالفة', 'الدرجة', 'degreename', 'degree'],
      },
      {
        arabicName: 'الإجراء الإداري',
        dbField: 'ActionName',
        type: 'text',
        required: false,
        desc: 'تنبيه شفهي / إنذار كتابي / خصم مالي...',
        aliases: ['الإجراء الإداري', 'الإجراء', 'actionname', 'action'],
      },
      {
        arabicName: 'تاريخ المخالفة',
        dbField: 'ViolationDate',
        type: 'date',
        required: true,
        desc: 'تاريخ وقوع المخالفة (YYYY-MM-DD)',
        aliases: ['تاريخ المخالفة', 'التاريخ', 'violationdate', 'date'],
      },
      {
        arabicName: 'مبلغ الجزاء',
        dbField: 'PenaltyAmount',
        type: 'number',
        required: false,
        desc: 'قيمة الخصم المالي إن وُجد',
        aliases: ['مبلغ الجزاء', 'الخصم', 'المبلغ', 'penaltyamount', 'penalty', 'amount'],
      },
      {
        arabicName: 'الحالة',
        dbField: 'Status',
        type: 'select',
        required: false,
        desc: 'Confirmed (مؤكدة) أو Pending (معلقة) - افتراضي Confirmed',
        aliases: ['الحالة', 'status'],
      },
      {
        arabicName: 'ملاحظات',
        dbField: 'Notes',
        type: 'text',
        required: false,
        desc: 'تفاصيل الواقعة ومحضر التحقيق',
        aliases: ['ملاحظات', 'notes'],
      },
    ],
    sampleRows: [
      {
        'الرقم الوظيفي': 'EMP-201',
        'مسمى المخالفة': 'تأخر عن العمل بدون إذن مسبق',
        'درجة المخالفة': 'الدرجة الأولى (مخالفة بسيطة)',
        'الإجراء الإداري': 'إنذار كتابي رسمي',
        'تاريخ المخالفة': '2026-10-05',
        'مبلغ الجزاء': 3000,
        'الحالة': 'Confirmed',
        'ملاحظات': 'تأخر لمدة 45 دقيقة',
      },
    ],
  },
  {
    key: 'penalties',
    label: 'الجزاءات ودرجات المخالفات (tblViolationDegrees)',
    tableName: 'tblViolationDegrees',
    desc: 'جدول درجات الجزاءات والمبالغ المالية المقابلة لكل درجة',
    fields: [
      {
        arabicName: 'اسم درجة الجزاء',
        dbField: 'DegreeName',
        type: 'text',
        required: true,
        desc: 'مسمى الدرجة (مثال: الدرجة الأولى، الدرجة الخاصة)',
        aliases: ['اسم درجة الجزاء', 'درجة الجزاء', 'اسم الدرجة', 'الدرجة', 'degreename', 'name'],
      },
      {
        arabicName: 'الخصم الافتراضي',
        dbField: 'DefaultPenalty',
        type: 'number',
        required: true,
        desc: 'المبلغ المالي المخصوم كقاعدة قياسية',
        aliases: ['الخصم الافتراضي', 'قيمة الجزاء', 'الخصم', 'المبلغ', 'defaultpenalty', 'penalty', 'amount'],
      },
    ],
    sampleRows: [
      { 'اسم درجة الجزاء': 'الدرجة الأولى (مخالفة بسيطة)', 'الخصم الافتراضي': 3000 },
      { 'اسم درجة الجزاء': 'الدرجة الثانية (مخالفة متوسطة)', 'الخصم الافتراضي': 7000 },
      { 'اسم درجة الجزاء': 'الدرجة الثالثة (مخالفة جسيمة)', 'الخصم الافتراضي': 15000 },
    ],
  },
  {
    key: 'users',
    label: 'المستخدمون (tblUsers)',
    tableName: 'tblUsers',
    desc: 'حسابات مستخدمي النظام مع تحديد الأدوار وكلمات المرور',
    fields: [
      {
        arabicName: 'اسم المستخدم',
        dbField: 'UserName',
        type: 'text',
        required: true,
        desc: 'اسم الدخول الفريد بالحروف الإنجليزية',
        aliases: ['اسم المستخدم', 'اسم الدخول', 'username', 'user'],
      },
      {
        arabicName: 'كلمة المرور',
        dbField: 'Password',
        type: 'text',
        required: true,
        desc: 'كلمة السر للحساب',
        aliases: ['كلمة المرور', 'كلمة السر', 'الباسورد', 'password', 'pass'],
      },
      {
        arabicName: 'الاسم الكامل',
        dbField: 'FullName',
        type: 'text',
        required: true,
        desc: 'الاسم الحقيقي لمالك الحساب',
        aliases: ['الاسم الكامل', 'الاسم', 'fullname', 'name'],
      },
      {
        arabicName: 'الدور',
        dbField: 'Role',
        type: 'select',
        required: true,
        desc: 'Admin, Manager, User, أو Viewer',
        aliases: ['الدور', 'نوع المستخدم', 'الصلاحية', 'role'],
      },
      {
        arabicName: 'اسم الفرع',
        dbField: 'BranchName',
        type: 'text',
        required: false,
        desc: 'اسم الفرع التابع له الحساب (فارغ لمدير النظام)',
        aliases: ['اسم الفرع', 'الفرع', 'branchname', 'branch'],
      },
      {
        arabicName: 'الرقم الوظيفي',
        dbField: 'EmpCode',
        type: 'text',
        required: false,
        desc: 'ربط الحساب بموظف مسجل إن وُجد',
        aliases: ['الرقم الوظيفي', 'الموظف', 'empcode', 'emp_code'],
      },
      {
        arabicName: 'الحالة',
        dbField: 'IsActive',
        type: 'boolean',
        required: false,
        desc: '1 أو نشط / 0 أو موقف (افتراضي نشط)',
        aliases: ['الحالة', 'نشط', 'isactive', 'active'],
      },
    ],
    sampleRows: [
      {
        'اسم المستخدم': 'salem_branch',
        'كلمة المرور': 'salem123',
        'الاسم الكامل': 'سالم صالح النهدي',
        'الدور': 'Manager',
        'اسم الفرع': 'المركز الرئيسي - صنعاء',
        'الرقم الوظيفي': '',
        'الحالة': 'نشط',
      },
    ],
  },
];

// Helper: Normalize date values from Excel
function normalizeDate(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel serial number
    const utc_days = Math.floor(val - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    if (isNaN(date_info.getTime())) return null;
    return date_info.toISOString().split('T')[0];
  }
  const s = String(val).trim();
  if (!s) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const parts = s.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (!isNaN(d.getTime())) {
      return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
    }
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    const year = parseInt(dmy[3], 10);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return null;
}

// Helper: Normalize numeric values
function normalizeNumber(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

interface ParsedRowResult {
  rowNumber: number;
  raw: Record<string, any>;
  normalized: Record<string, any>;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export const ImportDataView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const canImport = hasPermission('imports', 'import');

  // Selected import type
  const [selectedType, setSelectedType] = useState<ImportTypeKey>('employees');

  // Options before saving (Requirement 4)
  const [duplicateOption, setDuplicateOption] = useState<'skip' | 'update' | 'error'>('skip');
  const [stopOnFirstError, setStopOnFirstError] = useState<boolean>(false);
  const [createMissingRefs, setCreateMissingRefs] = useState<boolean>(true);

  // File upload state
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveResult, setSaveResult] = useState<{
    successCount: number;
    failedCount: number;
    errorReport: ImportLogError[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active configuration
  const currentConfig = useMemo(
    () => IMPORT_CONFIGS.find((c) => c.key === selectedType) || IMPORT_CONFIGS[0],
    [selectedType]
  );

  const [, setVersion] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setVersion((v) => v + 1));
  }, []);

  // Import history from database
  const importHistory = db.getImportLogs();

  // Reset file and preview when switching type
  const handleTypeChange = (newType: ImportTypeKey) => {
    setSelectedType(newType);
    setFileName('');
    setParsedRows([]);
    setSaveResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1. Requirement 2: Generate and download Excel Template with Arabic column headers
  const handleDownloadTemplate = () => {
    const headers = currentConfig.fields.map((f) => f.arabicName);
    const sampleRowsData = currentConfig.sampleRows.map((sample) =>
      headers.map((h) => (sample[h] !== undefined ? sample[h] : ''))
    );

    const aoa = [headers, ...sampleRowsData];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Auto-fit column widths
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length * 2, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentConfig.label.split(' ')[0]);

    const outName = `قالب_استيراد_${currentConfig.label.split(' ')[0]}.xlsx`;
    XLSX.writeFile(wb, outName);
  };

  // Helper: Match column in uploaded file to FieldSpec
  const findMatchingField = (colName: string): FieldSpec | undefined => {
    const cleaned = colName.trim().toLowerCase().replace(/[\s_\-]+/g, '');
    return currentConfig.fields.find((f) => {
      const arabicClean = f.arabicName.trim().toLowerCase().replace(/[\s_\-]+/g, '');
      const dbClean = f.dbField.trim().toLowerCase().replace(/[\s_\-]+/g, '');
      if (cleaned === arabicClean || cleaned === dbClean) return true;
      return f.aliases.some((alias) => alias.trim().toLowerCase().replace(/[\s_\-]+/g, '') === cleaned);
    });
  };

  // 2. Requirement 3: File validation engine
  const validateFileRows = (rawRows: Record<string, any>[]): ParsedRowResult[] => {
    const dbState = db.getState();
    const results: ParsedRowResult[] = [];
    const inBatchCodes = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2; // Row 1 is header
      const normalized: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];
      let isDuplicate = false;

      // Map raw columns to standardized fields
      Object.entries(row).forEach(([colKey, val]) => {
        const spec = findMatchingField(colKey);
        if (spec) {
          normalized[spec.dbField] = val;
        }
      });

      // Type-specific field validations
      if (selectedType === 'employees') {
        const empCode = String(normalized.EmpCode || '').trim();
        const fullName = String(normalized.FullName || '').trim();
        const branchName = String(normalized.BranchName || '').trim();
        const deptName = String(normalized.DeptName || '').trim();
        const hireDateRaw = normalized.HireDate;

        // Required check
        if (!empCode) errors.push('الرقم الوظيفي إلزامي وفارغ');
        if (!fullName) errors.push('اسم الموظف إلزامي وفارغ');
        if (!branchName) errors.push('اسم الفرع إلزامي وفارغ');
        if (!hireDateRaw) errors.push('تاريخ التعيين إلزامي وفارغ');

        // Date validity
        if (hireDateRaw) {
          const parsedD = normalizeDate(hireDateRaw);
          if (!parsedD) {
            errors.push(`تاريخ التعيين [${hireDateRaw}] غير صالح، يجب أن يكون بصيغة YYYY-MM-DD`);
          } else {
            normalized.HireDate = parsedD;
          }
        }

        // Salary validity
        if (normalized.BaseSalary !== undefined && normalized.BaseSalary !== '') {
          const num = normalizeNumber(normalized.BaseSalary);
          if (num === null || num < 0) {
            errors.push(`الراتب الأساسي [${normalized.BaseSalary}] يجب أن يكون رقماً موجباً`);
          } else {
            normalized.BaseSalary = num;
          }
        }

        // Duplicates check
        if (empCode) {
          if (inBatchCodes.has(empCode.toLowerCase())) {
            errors.push(`تكرار الرقم الوظيفي [${empCode}] داخل نفس الملف`);
          } else {
            inBatchCodes.add(empCode.toLowerCase());
          }

          const existingEmp = dbState.employees.find(
            (e) => e.EmpCode.toLowerCase() === empCode.toLowerCase()
          );
          if (existingEmp) {
            isDuplicate = true;
            if (duplicateOption === 'error') {
              errors.push(`الرقم الوظيفي [${empCode}] موجود مسبقاً في قاعدة البيانات`);
            } else if (duplicateOption === 'skip') {
              warnings.push(`الرقم الوظيفي موجود مسبقاً - سيتم تخطي هذا الصف`);
            } else if (duplicateOption === 'update') {
              warnings.push(`الرقم الوظيفي موجود مسبقاً - سيتم تحديث بيانات الموظف`);
            }
          }
        }

        // Branch existence check
        if (branchName) {
          const bExists = dbState.branches.some(
            (b) => b.BranchName.trim().toLowerCase() === branchName.toLowerCase()
          );
          if (!bExists) {
            if (createMissingRefs) {
              warnings.push(`الفرع [${branchName}] غير موجود وسوف يتم إنشاؤه تلقائياً`);
            } else {
              errors.push(`الفرع [${branchName}] غير موجود في قاعدة البيانات (فعّل خيار إنشاء المراجع)`);
            }
          }
        }

        // Department existence check
        if (deptName) {
          const dExists = dbState.departments.some(
            (d) => d.DeptName.trim().toLowerCase() === deptName.toLowerCase()
          );
          if (!dExists) {
            if (createMissingRefs) {
              warnings.push(`القسم [${deptName}] غير موجود وسوف يتم إنشاؤه تلقائياً`);
            } else {
              warnings.push(`القسم [${deptName}] غير موجود وسيتم تركه فارغاً`);
            }
          }
        }
      } else if (selectedType === 'branches') {
        const branchName = String(normalized.BranchName || '').trim();
        if (!branchName) errors.push('اسم الفرع إلزامي وفارغ');

        const existing = dbState.branches.find(
          (b) => b.BranchName.trim().toLowerCase() === branchName.toLowerCase()
        );
        if (existing) {
          isDuplicate = true;
          if (duplicateOption === 'error') {
            errors.push(`الفرع [${branchName}] مسجل مسبقاً`);
          } else if (duplicateOption === 'skip') {
            warnings.push(`الفرع موجود مسبقاً - سيتم تخطيه`);
          }
        }
      } else if (selectedType === 'departments') {
        const deptName = String(normalized.DeptName || '').trim();
        const branchName = String(normalized.BranchName || '').trim();
        if (!deptName) errors.push('اسم القسم إلزامي وفارغ');
        if (!branchName) errors.push('اسم الفرع التابع له إلزامي');

        if (branchName) {
          const bExists = dbState.branches.some(
            (b) => b.BranchName.trim().toLowerCase() === branchName.toLowerCase()
          );
          if (!bExists && !createMissingRefs) {
            errors.push(`الفرع [${branchName}] غير موجود في قاعدة البيانات`);
          }
        }
      } else if (selectedType === 'rewards') {
        const empCode = String(normalized.EmpCode || '').trim();
        const rewardDesc = String(normalized.RewardDesc || '').trim();
        const dateRaw = normalized.RewardDate;
        const amountRaw = normalized.Amount;

        if (!empCode) errors.push('الرقم الوظيفي إلزامي');
        if (!rewardDesc) errors.push('وصف نوع الحافز إلزامي');
        if (!dateRaw) errors.push('تاريخ الحافز إلزامي');

        const amt = normalizeNumber(amountRaw);
        if (amt === null || amt <= 0) errors.push('مبلغ الحافز يجب أن يكون رقماً أكبر من صفر');
        else normalized.Amount = amt;

        if (dateRaw) {
          const parsedD = normalizeDate(dateRaw);
          if (!parsedD) errors.push(`تاريخ الحافز [${dateRaw}] غير صالح`);
          else normalized.RewardDate = parsedD;
        }

        // Check if employee exists
        if (empCode) {
          const emp = dbState.employees.find((e) => e.EmpCode.toLowerCase() === empCode.toLowerCase());
          if (!emp) errors.push(`الموظف صاحب الكود [${empCode}] غير موجود في النظام`);
        }
      } else if (selectedType === 'violations') {
        const empCode = String(normalized.EmpCode || '').trim();
        const vioName = String(normalized.ViolationName || '').trim();
        const dateRaw = normalized.ViolationDate;

        if (!empCode) errors.push('الرقم الوظيفي إلزامي');
        if (!vioName) errors.push('مسمى المخالفة إلزامي');
        if (!dateRaw) errors.push('تاريخ المخالفة إلزامي');

        if (dateRaw) {
          const parsedD = normalizeDate(dateRaw);
          if (!parsedD) errors.push(`تاريخ المخالفة [${dateRaw}] غير صالح`);
          else normalized.ViolationDate = parsedD;
        }

        if (normalized.PenaltyAmount !== undefined && normalized.PenaltyAmount !== '') {
          const num = normalizeNumber(normalized.PenaltyAmount);
          if (num === null || num < 0) errors.push('مبلغ الجزاء يجب أن يكون رقماً موجباً');
          else normalized.PenaltyAmount = num;
        }

        if (empCode) {
          const emp = dbState.employees.find((e) => e.EmpCode.toLowerCase() === empCode.toLowerCase());
          if (!emp) errors.push(`الموظف صاحب الكود [${empCode}] غير مسجل في النظام`);
        }
      } else if (selectedType === 'penalties') {
        const degreeName = String(normalized.DegreeName || '').trim();
        const penaltyRaw = normalized.DefaultPenalty;

        if (!degreeName) errors.push('اسم درجة الجزاء إلزامي');
        const num = normalizeNumber(penaltyRaw);
        if (num === null || num < 0) errors.push('الخصم الافتراضي يجب أن يكون رقماً موجباً');
        else normalized.DefaultPenalty = num;
      } else if (selectedType === 'users') {
        const userName = String(normalized.UserName || '').trim();
        const password = String(normalized.Password || '').trim();
        const fullName = String(normalized.FullName || '').trim();
        const role = String(normalized.Role || '').trim();

        if (!userName) errors.push('اسم المستخدم إلزامي');
        if (!password) errors.push('كلمة المرور إلزامية');
        if (!fullName) errors.push('الاسم الكامل إلزامي');
        if (!role) errors.push('الدور إلزامي');

        const existing = dbState.users.find((u) => u.UserName.toLowerCase() === userName.toLowerCase());
        if (existing) {
          isDuplicate = true;
          if (duplicateOption === 'error') {
            errors.push(`اسم المستخدم [${userName}] موجود مسبقاً`);
          } else if (duplicateOption === 'skip') {
            warnings.push(`المستخدم موجود مسبقاً - سيتم تخطيه`);
          }
        }
      } else {
        // Generic required check
        currentConfig.fields
          .filter((f) => f.required)
          .forEach((f) => {
            const val = normalized[f.dbField];
            if (val === undefined || val === null || String(val).trim() === '') {
              errors.push(`حقل [${f.arabicName}] إلزامي وفارغ`);
            }
          });
      }

      results.push({
        rowNumber,
        raw: row,
        normalized,
        isValid: errors.length === 0,
        isDuplicate,
        errors,
        warnings,
      });
    });

    return results;
  };

  // Handle file selection and parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSaveResult(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          alert('الملف فارغ أو لا يحتوي على صفوف صالحة');
          setIsProcessing(false);
          return;
        }

        const validated = validateFileRows(json);
        setParsedRows(validated);
      } catch (err) {
        console.error('Error reading excel file:', err);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف Excel أو CSV صالح.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Quick Load Test: 3 sample employees (Requirement 6 test helper)
  const handleLoadSampleEmployeesTest = () => {
    setSelectedType('employees');
    setFileName('قالب_تجريبي_3_موظفين.xlsx');
    setSaveResult(null);
    const sample = currentConfig.sampleRows;
    const validated = validateFileRows(sample);
    setParsedRows(validated);
  };

  // Save/Import execution (Requirement 4 & 5)
  const handleExecuteImport = () => {
    if (!currentUser) return;
    if (parsedRows.length === 0) {
      alert('لا توجد بيانات للاستيراد');
      return;
    }

    // Check stop on first error option
    const hasAnyError = parsedRows.some((r) => !r.isValid);
    if (stopOnFirstError && hasAnyError) {
      alert('تم إيقاف عملية الاستيراد لوجود أخطاء في الملف مع تفعيل خيار [الإيقاف عند أول خطأ].');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;
    const errorReport: ImportLogError[] = [];

    parsedRows.forEach((rowResult) => {
      if (!rowResult.isValid) {
        failedCount++;
        errorReport.push({
          rowNumber: rowResult.rowNumber,
          reason: rowResult.errors.join(' | '),
          rowData: rowResult.raw,
        });
        return;
      }

      if (rowResult.isDuplicate && duplicateOption === 'skip') {
        failedCount++;
        errorReport.push({
          rowNumber: rowResult.rowNumber,
          reason: 'تم التخطي لكون السجل مكرراً مسبقاً',
          rowData: rowResult.raw,
        });
        return;
      }

      try {
        const norm = rowResult.normalized;

        if (selectedType === 'employees') {
          // Resolve or create branch
          const branch = createMissingRefs
            ? db.ensureBranchByName(norm.BranchName || 'الفرع الرئيسي', currentUser.UserID)
            : db.getState().branches.find((b) => b.BranchName.trim().toLowerCase() === String(norm.BranchName).trim().toLowerCase()) ||
              db.ensureBranchByName(norm.BranchName || 'الفرع الرئيسي', currentUser.UserID);

          // Resolve or create dept
          let deptId: number | null = null;
          if (norm.DeptName && branch) {
            const dept = createMissingRefs
              ? db.ensureDepartmentByName(norm.DeptName, branch.BranchID, currentUser.UserID)
              : db.getState().departments.find((d) => d.DeptName.trim().toLowerCase() === String(norm.DeptName).trim().toLowerCase());
            deptId = dept ? dept.DeptID : null;
          }

          // Resolve or create job title
          let jobId: number | null = null;
          if (norm.JobTitle) {
            const job = db.ensureJobTitleByName(norm.JobTitle);
            jobId = job ? job.JobID : null;
          }

          // Resolve currency
          const currency =
            db.getState().currencies.find(
              (c) => c.CurrencyCode.toUpperCase() === String(norm.CurrencyCode || 'YER').toUpperCase()
            ) || db.getState().currencies[0];

          const existingEmp = db.getState().employees.find(
            (e) => e.EmpCode.toLowerCase() === String(norm.EmpCode).toLowerCase()
          );

          if (existingEmp && duplicateOption === 'update') {
            db.updateEmployee(
              {
                ...existingEmp,
                FullName: norm.FullName || existingEmp.FullName,
                BranchID: branch.BranchID,
                DeptID: deptId ?? existingEmp.DeptID,
                JobID: jobId ?? existingEmp.JobID,
                HireDate: norm.HireDate || existingEmp.HireDate,
                BaseSalary: norm.BaseSalary ?? existingEmp.BaseSalary,
                CurrencyID: currency.CurrencyID,
                NationalID: norm.NationalID ?? existingEmp.NationalID,
                Phone: norm.Phone ?? existingEmp.Phone,
                Email: norm.Email ?? existingEmp.Email,
                IsActive: norm.IsActive === '0' || norm.IsActive === 0 || norm.IsActive === 'موقف' ? 0 : 1,
                Notes: norm.Notes ?? existingEmp.Notes,
              },
              currentUser.UserID
            );
            successCount++;
          } else if (!existingEmp) {
            db.addEmployee(
              {
                EmpCode: norm.EmpCode,
                FullName: norm.FullName,
                BranchID: branch.BranchID,
                DeptID: deptId,
                JobID: jobId,
                HireDate: norm.HireDate,
                BaseSalary: norm.BaseSalary || 0,
                CurrencyID: currency.CurrencyID,
                NationalID: norm.NationalID || null,
                Phone: norm.Phone || null,
                Email: norm.Email || null,
                IsActive: norm.IsActive === '0' || norm.IsActive === 0 || norm.IsActive === 'موقف' ? 0 : 1,
                Notes: norm.Notes || null,
              },
              currentUser.UserID
            );
            successCount++;
          }
        } else if (selectedType === 'branches') {
          const existing = db.getState().branches.find(
            (b) => b.BranchName.trim().toLowerCase() === String(norm.BranchName).trim().toLowerCase()
          );
          if (existing && duplicateOption === 'update') {
            db.updateBranch(
              {
                ...existing,
                BranchCode: norm.BranchCode || existing.BranchCode,
                IsActive: norm.IsActive === 0 ? 0 : 1,
              },
              currentUser.UserID
            );
            successCount++;
          } else if (!existing) {
            db.addBranch(
              {
                BranchName: norm.BranchName,
                BranchCode: norm.BranchCode || 'BR-' + (db.getState().branches.length + 1).toString().padStart(2, '0'),
                IsActive: norm.IsActive === 0 ? 0 : 1,
              },
              currentUser.UserID
            );
            successCount++;
          }
        } else if (selectedType === 'departments') {
          const branch = db.ensureBranchByName(norm.BranchName, currentUser.UserID);
          db.ensureDepartmentByName(norm.DeptName, branch.BranchID, currentUser.UserID);
          successCount++;
        } else if (selectedType === 'reward_types') {
          const cat = db.ensureRewardCategoryByName(norm.CategoryName || 'حوافز عامة');
          db.addRewardType(
            {
              CategoryID: cat.CategoryID,
              RewardDesc: norm.RewardDesc,
              DefaultPoints: Number(norm.DefaultPoints || 0),
              DefaultAmount: Number(norm.DefaultAmount || 0),
            },
            currentUser.UserID
          );
          successCount++;
        } else if (selectedType === 'rewards') {
          const emp = db.getState().employees.find(
            (e) => e.EmpCode.toLowerCase() === String(norm.EmpCode).toLowerCase()
          );
          if (!emp) throw new Error('الموظف غير موجود');

          // Find or create reward type
          let rt = db.getState().rewardTypes.find((t) => t.RewardDesc.trim().toLowerCase() === String(norm.RewardDesc).trim().toLowerCase());
          if (!rt) {
            const cat = db.ensureRewardCategoryByName('حوافز عامة');
            rt = db.addRewardType({ CategoryID: cat.CategoryID, RewardDesc: norm.RewardDesc, DefaultPoints: 0, DefaultAmount: norm.Amount }, currentUser.UserID);
          }

          db.addReward(
            {
              EmpID: emp.EmpID,
              BranchID: emp.BranchID,
              RewardTypeID: rt.RewardTypeID,
              CurrencyID: emp.CurrencyID || 1,
              RewardDate: norm.RewardDate,
              Points: Number(norm.Points || 0),
              Amount: Number(norm.Amount || 0),
              Notes: norm.Notes || 'استيراد جماعي من ملف Excel',
              Status: norm.Status === 'Pending' ? 'Pending' : 'Approved',
              CreatedBy: currentUser.UserID,
            },
            currentUser.UserID
          );
          successCount++;
        } else if (selectedType === 'violation_types') {
          db.addViolationType({ ViolationName: norm.ViolationName }, currentUser.UserID);
          successCount++;
        } else if (selectedType === 'violations') {
          const emp = db.getState().employees.find(
            (e) => e.EmpCode.toLowerCase() === String(norm.EmpCode).toLowerCase()
          );
          if (!emp) throw new Error('الموظف غير موجود');

          let vt = db.getState().violationTypes.find((t) => t.ViolationName.trim().toLowerCase() === String(norm.ViolationName).trim().toLowerCase());
          if (!vt) {
            vt = db.addViolationType({ ViolationName: norm.ViolationName }, currentUser.UserID);
          }

          let deg = db.getState().violationDegrees.find((d) => d.DegreeName.trim().toLowerCase() === String(norm.DegreeName || '').trim().toLowerCase());
          if (!deg) deg = db.getState().violationDegrees[0];

          let act = db.getState().adminActions.find((a) => a.ActionName.trim().toLowerCase() === String(norm.ActionName || '').trim().toLowerCase());
          if (!act) act = db.getState().adminActions[0];

          db.addViolation(
            {
              EmpID: emp.EmpID,
              ViolationTypeID: vt.ViolationTypeID,
              DegreeID: deg.DegreeID,
              ActionID: act.ActionID,
              ViolationDate: norm.ViolationDate,
              PenaltyAmount: Number(norm.PenaltyAmount || deg.DefaultPenalty || 0),
              Notes: norm.Notes || 'استيراد من ملف Excel',
              Status: norm.Status === 'Pending' ? 'Pending' : 'Confirmed',
              CreatedBy: currentUser.UserID,
            },
            currentUser.UserID
          );
          successCount++;
        } else if (selectedType === 'penalties') {
          db.ensureViolationDegreeByName(norm.DegreeName, Number(norm.DefaultPenalty || 0));
          successCount++;
        } else if (selectedType === 'users') {
          const roleObj = db.getState().roles.find(
            (r) => r.RoleName.toLowerCase() === String(norm.Role).toLowerCase()
          ) || db.getState().roles[2]; // Default to User

          let branchId: number | null = null;
          if (norm.BranchName) {
            const b = db.ensureBranchByName(norm.BranchName, currentUser.UserID);
            branchId = b.BranchID;
          }

          db.addUser(
            {
              UserName: norm.UserName,
              PasswordHash: norm.Password,
              FullName: norm.FullName,
              RoleID: roleObj.RoleID,
              Role: roleObj.RoleName,
              BranchID: branchId,
              EmpID: null,
              IsActive: norm.IsActive === 0 ? 0 : 1,
            },
            currentUser.UserID
          );
          successCount++;
        }
      } catch (err: any) {
        failedCount++;
        errorReport.push({
          rowNumber: rowResult.rowNumber,
          reason: err.message || 'خطأ غير متوقع أثناء الحفظ',
          rowData: rowResult.raw,
        });
      }
    });

    // Save into Import Log (Requirement 5)
    db.addImportLog(
      {
        ImportType: selectedType,
        ImportTypeLabel: currentConfig.label,
        FileName: fileName || 'manual_entry.xlsx',
        UserName: currentUser.FullName || currentUser.UserName,
        ImportDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        SuccessCount: successCount,
        FailedCount: failedCount,
        Errors: errorReport,
      },
      currentUser.UserID
    );

    setIsProcessing(false);
    setSaveResult({ successCount, failedCount, errorReport });
  };

  // Download error report Excel (Requirement 5)
  const handleDownloadErrorReport = (errorsToExport?: ImportLogError[]) => {
    const list = errorsToExport || saveResult?.errorReport || [];
    if (list.length === 0) {
      alert('لا توجد أخطاء لتصديرها');
      return;
    }

    const rows = list.map((err) => ({
      'رقم الصف': err.rowNumber,
      'سبب الخطأ': err.reason,
      ...err.rowData,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الأخطاء');
    XLSX.writeFile(wb, `تقرير_أخطاء_استيراد_${selectedType}.xlsx`);
  };

  // Calculations for preview summary
  const totalRows = parsedRows.length;
  const validRowsCount = parsedRows.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicateRowsCount = parsedRows.filter((r) => r.isDuplicate).length;
  const errorRowsCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6 font-['Cairo',sans-serif]">
      {/* Header & Page Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">استيراد البيانات المتقدم (Excel / CSV)</h1>
          </div>
          <p className="text-xs text-slate-500">
            توليد وتنزيل قوالب الإدخال، فحص البيانات الذكي، مطابقة المراجع الإدارية، وسجل عمليات الاستيراد
          </p>
        </div>

        {/* Quick Test Helper button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleEmployeesTest}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
            title="تجربة فورية لاستيراد 3 موظفين جاهزين من القالب للاختبار"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>تحميل نموذج 3 موظفين للاختبار</span>
          </button>
        </div>
      </div>

      {/* Step 1: Select Import Type (Requirement 1) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1">1. اختر نوع البيانات المراد استيرادها:</label>
            <p className="text-[11px] text-slate-500">
              قم باختيار الجدول المطلوب من القائمة لعرض حقوله وقواعد بياناته وتوليد قالبه
            </p>
          </div>

          <div className="sm:w-80">
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as ImportTypeKey)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {IMPORT_CONFIGS.map((cfg) => (
                <option key={cfg.key} value={cfg.key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description & Table Info */}
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
          <Layers className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-slate-900 mb-0.5">{currentConfig.label}</div>
            <div className="text-slate-600 leading-relaxed">{currentConfig.desc}</div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل قالب Excel</span>
          </button>
        </div>

        {/* Requirement 2: Fields Schema Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>حقول جدول</span>
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {currentConfig.tableName}
              </code>
              <span>المطلوبة والاختيارية:</span>
            </span>
            <span className="text-[11px] text-slate-400">إجمالي الحقول: {currentConfig.fields.length}</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-bold">اسم الحقل في القالب (بالعربي)</th>
                  <th className="py-2.5 px-3 font-bold font-mono">اسم الحقل في قاعدة البيانات</th>
                  <th className="py-2.5 px-3 font-bold">النوع البرمجي</th>
                  <th className="py-2.5 px-3 font-bold text-center">الإلزامية</th>
                  <th className="py-2.5 px-3 font-bold">الوصف والقيم المقبولة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {currentConfig.fields.map((f, idx) => (
                  <tr key={idx} className={f.required ? 'bg-amber-50/20' : 'hover:bg-slate-50'}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{f.arabicName}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-blue-700">{f.dbField}</td>
                    <td className="py-2 px-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {f.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {f.required ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-[10px]">
                          مطلوب إلزامي
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                          اختياري
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 2: Upload File & Options (Requirement 3 & 4) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900">2. رفع الملف وتحديد خيارات المعالجة:</h2>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-file-input"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              {fileName ? `الملف المحدد: ${fileName}` : 'اضغط لاختيار ملف Excel أو CSV من جهازك'}
            </div>
            <p className="text-xs text-slate-400">يدعم امتدادات .xlsx و .xls و .csv مع الكشف التلقائي عن الأعمدة</p>
          </label>
        </div>

        {/* Requirement 4: Options before saving */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 mb-1">خيارات الاستيراد والتعامل مع السجلات:</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Duplicates Option */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">معالجة السجلات المكررة:</label>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dup_opt"
                    checked={duplicateOption === 'skip'}
                    onChange={() => setDuplicateOption('skip')}
                    className="accent-slate-900"
                  />
                  <span>تخطي المكرر (تجاهل الصف)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dup_opt"
                    checked={duplicateOption === 'update'}
                    onChange={() => setDuplicateOption('update')}
                    className="accent-slate-900"
                  />
                  <span>تحديث المكرر (تعديل البيانات)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dup_opt"
                    checked={duplicateOption === 'error'}
                    onChange={() => setDuplicateOption('error')}
                    className="accent-slate-900"
                  />
                  <span>رفض المكرر واحتسابه خطأ</span>
                </label>
              </div>
            </div>

            {/* Stop on First Error */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">إدارة الأخطاء:</label>
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={stopOnFirstError}
                  onChange={(e) => setStopOnFirstError(e.target.checked)}
                  className="mt-0.5 accent-slate-900 rounded"
                />
                <div>
                  <span className="font-semibold block">إيقاف الاستيراد عند أول خطأ</span>
                  <span className="text-[10px] text-slate-500">عدم حفظ أي صف إذا وُجد خطأ واحد في الملف بالكامل</span>
                </div>
              </label>
            </div>

            {/* Create missing references */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">الربط المرجعي التلقائي:</label>
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={createMissingRefs}
                  onChange={(e) => setCreateMissingRefs(e.target.checked)}
                  className="mt-0.5 accent-slate-900 rounded"
                />
                <div>
                  <span className="font-semibold block">إنشاء المراجع الناقصة تلقائياً</span>
                  <span className="text-[10px] text-slate-500">
                    إنشاء الفروع والأقسام غير الموجودة في النظام تلقائياً أثناء الاستيراد
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Preview First 20 Rows and Errors Breakdown (Requirement 3) */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                3. معاينة ونتائج فحص البيانات (عرض أول 20 صفاً):
              </h2>
              <p className="text-[11px] text-slate-500">
                تم فحص الحقول الإلزامية وتكرار الأكواد والمراجع وصحة التواريخ والأرقام
              </p>
            </div>

            {/* Unified Save / Import Action Button (Requirement 4 & Rule 4 Permissions) */}
            {canImport ? (
              <button
                onClick={handleExecuteImport}
                disabled={isProcessing || (stopOnFirstError && errorRowsCount > 0)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>حفظ واستيراد السجلات الصالحة ({validRowsCount + (duplicateOption === 'update' ? duplicateRowsCount : 0)})</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>ليس لديك صلاحية لتنفيذ الاستيراد (عرض المعاينة فقط)</span>
              </div>
            )}
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-right">
              <span className="text-[11px] text-slate-500 block mb-0.5">إجمالي صفوف الملف:</span>
              <span className="text-xl font-bold font-mono text-slate-900">{totalRows}</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-right">
              <span className="text-[11px] text-emerald-700 block mb-0.5">جاهزة للاستيراد:</span>
              <span className="text-xl font-bold font-mono text-emerald-800">{validRowsCount}</span>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-right">
              <span className="text-[11px] text-blue-700 block mb-0.5">سجلات مكررة:</span>
              <span className="text-xl font-bold font-mono text-blue-800">{duplicateRowsCount}</span>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-right">
              <span className="text-[11px] text-red-700 block mb-0.5">صفوف بها أخطاء:</span>
              <span className="text-xl font-bold font-mono text-red-800">{errorRowsCount}</span>
            </div>
          </div>

          {/* Preview Table (First 20 rows) */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-14"># الصف</th>
                  <th className="py-2.5 px-3 font-bold">الحالة والتحقق</th>
                  {currentConfig.fields.slice(0, 6).map((f, i) => (
                    <th key={i} className="py-2.5 px-3 font-bold">
                      {f.arabicName}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 font-bold">تفاصيل الأخطاء والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {parsedRows.slice(0, 20).map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`hover:bg-slate-50 ${
                      !row.isValid
                        ? 'bg-red-50/40 text-red-900'
                        : row.isDuplicate
                        ? 'bg-blue-50/30'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500 font-semibold">{row.rowNumber}</td>
                    <td className="py-2.5 px-3">
                      {!row.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>خطأ فحص</span>
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                          <RefreshCw className="w-3 h-3" />
                          <span>مكرر ({duplicateOption === 'skip' ? 'تخطي' : duplicateOption === 'update' ? 'تحديث' : 'رفض'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>صالح</span>
                        </span>
                      )}
                    </td>

                    {/* Data Columns */}
                    {currentConfig.fields.slice(0, 6).map((f, i) => (
                      <td key={i} className="py-2.5 px-3 text-slate-800 max-w-[150px] truncate">
                        {String(row.normalized[f.dbField] ?? row.raw[f.arabicName] ?? '-')}
                      </td>
                    ))}

                    {/* Error / Warning Details */}
                    <td className="py-2.5 px-3 text-[11px]">
                      {row.errors.length > 0 && (
                        <div className="text-red-600 font-medium space-y-0.5">
                          {row.errors.map((e, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{e}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {row.warnings.length > 0 && (
                        <div className="text-amber-600 space-y-0.5">
                          {row.warnings.map((w, idx) => (
                            <div key={idx}>• {w}</div>
                          ))}
                        </div>
                      )}
                      {row.errors.length === 0 && row.warnings.length === 0 && (
                        <span className="text-emerald-600">بيانات متوافقة بالكامل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notice if more than 20 rows */}
          {parsedRows.length > 20 && (
            <div className="text-center text-xs text-slate-500 py-1 bg-slate-50 rounded">
              يتم عرض أول 20 صفاً للمعاينة السريعة من إجمالي {parsedRows.length} صفاً موجودة بالملف.
            </div>
          )}
        </div>
      )}

      {/* Save Success Banner (Requirement 5) */}
      {saveResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">اكتملت عملية الاستيراد وحُفظت في السجل</h3>
                <p className="text-xs text-slate-500">
                  تم استيراد {saveResult.successCount} سجل بنجاح، وتعذر استيراد {saveResult.failedCount} سجل
                </p>
              </div>
            </div>

            {saveResult.errorReport.length > 0 && (
              <button
                onClick={() => handleDownloadErrorReport()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل تقرير الأخطاء Excel ({saveResult.errorReport.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Import History Log Table (Requirement 5) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold text-slate-900">سجل عمليات الاستيراد السابقة (tblImportLogs)</h2>
          </div>
          <span className="text-[11px] text-slate-400">إجمالي العمليات: {importHistory.length}</span>
        </div>

        {importHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            لم يتم تسجيل أي عمليات استيراد سابقة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-bold">#</th>
                  <th className="py-2.5 px-3 font-bold">نوع الاستيراد</th>
                  <th className="py-2.5 px-3 font-bold">اسم الملف</th>
                  <th className="py-2.5 px-3 font-bold">المستخدم المنفذ</th>
                  <th className="py-2.5 px-3 font-bold">التاريخ والوقت</th>
                  <th className="py-2.5 px-3 font-bold text-center">الناجح</th>
                  <th className="py-2.5 px-3 font-bold text-center">الفاشل</th>
                  <th className="py-2.5 px-3 font-bold text-center">تقرير الأخطاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {importHistory.map((item) => (
                  <tr key={item.LogID} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{item.LogID}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.ImportTypeLabel}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{item.FileName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.UserName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{item.ImportDate}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px]">
                        {item.SuccessCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                          item.FailedCount > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.FailedCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.Errors && item.Errors.length > 0 ? (
                        <button
                          onClick={() => handleDownloadErrorReport(item.Errors)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-semibold hover:bg-red-100 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>تحميل تقرير ({item.Errors.length})</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">- لا توجد أخطاء -</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

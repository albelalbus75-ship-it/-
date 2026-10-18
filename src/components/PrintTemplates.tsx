import React from 'react';
import { Reward, Violation } from '../types/database';
import { db } from '../services/dbStore';
import { Printer, X } from 'lucide-react';

const LOGO_SRC = '/icon.svg';

interface RewardVoucherProps {
  reward: Reward & {
    empName?: string;
    empCode?: string;
    branchName?: string;
    rewardDesc?: string;
    categoryName?: string;
    currencyCode?: string;
    createdByName?: string;
  };
  onClose: () => void;
}

export const RewardVoucherModal: React.FC<RewardVoucherProps> = ({ reward, onClose }) => {
  const companyName = db.getSetting('CompanyName', 'مجموعة البحري التجارية');
  const footerNote = db.getSetting('VoucherFooter', 'تم إنشاء هذا السند عبر نظام الحوافز المعتمد لمجموعة البحري التجارية.');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-2xl border border-slate-200 overflow-hidden my-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="text-xs sm:text-sm font-semibold text-slate-800">معاينة وطباعة سند صرف الحافز</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-medium cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Voucher Document */}
        <div className="p-4 sm:p-8 font-['Cairo',sans-serif] text-slate-900">
          {/* Official Letterhead */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-6 text-center sm:text-right">
            <div className="sm:text-right">
              <div className="text-xs text-slate-500 mb-1">الجمهورية اليمنية</div>
              <div className="text-base font-bold text-slate-900">{companyName}</div>
              <div className="text-xs text-slate-600">إدارة الموارد البشرية والرقابة الإدارية</div>
              <div className="text-xs text-slate-500 mt-1">الفرع: {reward.branchName || 'الإدارة العامة'}</div>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={LOGO_SRC}
                alt="Albahri Emblem"
                className="w-16 h-16 rounded-full object-contain border border-slate-300 shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-[10px] tracking-wider font-semibold text-slate-700 mt-1">AL-BAHRI GROUP</span>
            </div>
            <div className="sm:text-left text-xs text-slate-600 space-y-1">
              <div><span className="font-semibold">رقم السند:</span> <span className="font-mono tabular-nums">REC-{(reward.RewardID + 1000).toString()}</span></div>
              <div><span className="font-semibold">تاريخ الصرف:</span> <span className="font-mono tabular-nums">{reward.RewardDate}</span></div>
              <div><span className="font-semibold">الحالة:</span> <span className="font-semibold text-emerald-700">{reward.Status === 'Approved' ? 'معتمد' : reward.Status}</span></div>
            </div>
          </div>

          <div className="text-center my-6">
            <h2 className="text-base sm:text-xl font-bold text-slate-900 border-b border-slate-300 pb-2 inline-block px-4 sm:px-8">
              سند استحقاق حافز / مكافأة إدارية
            </h2>
          </div>

          {/* Employee & Reward Details Grid */}
          <div className="border border-slate-200 rounded-lg p-4 sm:p-5 mb-6 bg-slate-50/50 space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">اسم الموظف المستحق:</span>
                <span className="font-bold text-slate-900">{reward.empName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">الرقم الوظيفي:</span>
                <span className="font-mono tabular-nums text-slate-800 font-semibold">{reward.empCode}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-3">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">تصنيف الحافز:</span>
                <span className="font-semibold text-slate-800">{reward.categoryName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">النقاط المستحقة:</span>
                <span className="font-mono tabular-nums text-blue-700 font-bold">{reward.Points} نقطة</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <span className="text-slate-500 text-xs block mb-0.5">بيان سبب المنح:</span>
              <p className="font-medium text-slate-900">{reward.rewardDesc}</p>
              {reward.Notes && (
                <p className="text-xs text-slate-600 mt-1 italic">ملاحظات: {reward.Notes}</p>
              )}
            </div>

            {/* Financial Amount Box */}
            <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2 bg-blue-50/60 p-3 rounded border-blue-200">
              <span className="font-bold text-slate-800 text-sm">صافي مبلغ المكافأة:</span>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-bold text-blue-900 font-mono tabular-nums">
                  {reward.Amount.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-blue-800 mr-1.5">{reward.currencyCode || 'ريال'}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Approvals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs mt-8 pt-4 border-t border-slate-200">
            <div>
              <div className="font-semibold text-slate-800 mb-6 sm:mb-10">الموظف المستلم</div>
              <div className="text-slate-500">التوقيع: .....................</div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-6 sm:mb-10">مدير الموارد البشرية</div>
              <div className="text-slate-500">التوقيع: .....................</div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-6 sm:mb-10">المدير العام / الاعتماد</div>
              <div className="text-slate-500">الختم والتوقيع: ................</div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-8 pt-3 border-t border-slate-100">
            {footerNote} • تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ViolationNoticeProps {
  violation: Violation & {
    empName?: string;
    empCode?: string;
    violationName?: string;
    degreeName?: string;
    actionName?: string;
    createdByName?: string;
  };
  onClose: () => void;
}

export const ViolationNoticeModal: React.FC<ViolationNoticeProps> = ({ violation, onClose }) => {
  const companyName = db.getSetting('CompanyName', 'مجموعة البحري التجارية');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-2xl border border-slate-200 overflow-hidden my-4 max-h-[90vh] overflow-y-auto">
        <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="text-xs sm:text-sm font-semibold text-slate-800">معاينة وطباعة إشعار المخالفة والجزاء</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-medium cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الإشعار</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer" title="إغلاق">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 font-['Cairo',sans-serif] text-slate-900">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-6 text-center sm:text-right">
            <div className="sm:text-right">
              <div className="text-xs text-slate-500 mb-1">الجمهورية اليمنية</div>
              <div className="text-base font-bold text-slate-900">{companyName}</div>
              <div className="text-xs text-slate-600">إدارة الرقابة الإدارية والتفتيش</div>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={LOGO_SRC}
                alt="Albahri Emblem"
                className="w-16 h-16 rounded-full object-contain border border-slate-300 shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-[10px] tracking-wider font-semibold text-slate-700 mt-1">AL-BAHRI GROUP</span>
            </div>
            <div className="sm:text-left text-xs text-slate-600 space-y-1">
              <div><span className="font-semibold">رقم الإشعار:</span> <span className="font-mono tabular-nums">VIO-{(violation.ViolationID + 500).toString()}</span></div>
              <div><span className="font-semibold">تاريخ المخالفة:</span> <span className="font-mono tabular-nums">{violation.ViolationDate}</span></div>
              <div><span className="font-semibold">الحالة:</span> <span className="font-semibold text-red-700">{violation.Status === 'Confirmed' ? 'مؤكدة' : violation.Status}</span></div>
            </div>
          </div>

          <div className="text-center my-6">
            <h2 className="text-base sm:text-xl font-bold text-slate-900 border-b border-red-300 pb-2 inline-block px-4 sm:px-8">
              إشعار إداري رسمي بوقوع مخالفة
            </h2>
          </div>

          <div className="border border-red-100 rounded-lg p-4 sm:p-5 mb-6 bg-red-50/20 space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">اسم الموظف المخالف:</span>
                <span className="font-bold text-slate-900">{violation.empName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">الرقم الوظيفي:</span>
                <span className="font-mono tabular-nums text-slate-800 font-semibold">{violation.empCode}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-3">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">نوع المخالفة:</span>
                <span className="font-semibold text-red-900">{violation.violationName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">درجة المخالفة:</span>
                <span className="font-semibold text-slate-800">{violation.degreeName}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <span className="text-slate-500 text-xs block mb-0.5">الإجراء الإداري المتخذ:</span>
              <span className="font-bold text-slate-900 block">{violation.actionName}</span>
              {violation.Notes && (
                <p className="text-xs text-slate-600 mt-1 italic">تفاصيل المخالفة: {violation.Notes}</p>
              )}
            </div>

            {violation.PenaltyAmount > 0 && (
              <div className="border-t border-red-200 pt-3 flex flex-wrap items-center justify-between gap-2 bg-red-100/50 p-3 rounded">
                <span className="font-bold text-red-900 text-sm">مبلغ الخصم المترتب:</span>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-red-900 font-mono tabular-nums">
                    {violation.PenaltyAmount.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-red-800 mr-1.5">ريال يمني</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 mb-6">
            تنبيه: يُلزم الموظف بالتقيد باللوائح والأنظمة الداخلية للمجموعة وتفادي تكرار المخالفة مستقبلاً تجنباً لتشديد العقوبة.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs mt-8 pt-4 border-t border-slate-200">
            <div>
              <div className="font-semibold text-slate-800 mb-6 sm:mb-8">المسؤول المباشر / HR</div>
              <div className="text-slate-500">التوقيع: .....................</div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-6 sm:mb-8">الموظف المخالف بالعلم</div>
              <div className="text-slate-500">التوقيع: .....................</div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-6 sm:mb-8">المدير العام / الاعتماد</div>
              <div className="text-slate-500">الختم: .....................</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface AccessDeniedProps {
  screenTitle?: string;
  onGoBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ screenTitle, onGoBack }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-xs space-y-4 font-['Cairo',sans-serif]">
      <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">لا تملك صلاحية</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          عذراً، حسابك الحالي لا يمتلك صلاحية عرض أو استخدام شاشة{' '}
          {screenTitle ? <strong className="text-slate-800">[{screenTitle}]</strong> : 'هذا القسم'}.
          يرجى التواصل مع مدير النظام لمنحك الصلاحيات المطلوبة.
        </p>
      </div>

      {onGoBack && (
        <div className="pt-2">
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب معطل.');
      }
      setIsLoading(false);
    }, 200);
  };

  const handleDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 font-['Cairo',sans-serif]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-slate-950 p-6 text-center text-white relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-900/90 border-2 border-amber-500/80 p-2.5 flex items-center justify-center shadow-lg">
            <img
              src="/icon.svg"
              alt="شعار مجموعة البحري"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">
            مجموعة البحري التجارية
          </h1>
          <p className="text-xs text-slate-300 font-medium">
            نظام إدارة الحوافز والمكافآت والرقابة الإدارية
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نظام محمي ومعتمد للعمليات الداخلية</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">تسجيل الدخول للنظام</h2>
            <p className="text-xs text-slate-500 mt-1">
              أدخل بيانات اعتمادك للمتابعة إلى لوحة التحكم
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute right-3 top-2.5 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-3 top-2.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <span>{isLoading ? 'جاري التحقق...' : 'دخول النظام'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block text-center mb-2">
              حسابات الدخول الافتراضية
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoFill('admin', 'admin123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-right cursor-pointer transition-colors"
              >
                <div className="font-bold text-slate-900">المدير العام (Admin)</div>
                <div className="font-mono text-slate-500 text-[10px]">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('hrmanager', 'hr123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-right cursor-pointer transition-colors"
              >
                <div className="font-bold text-slate-900">الموارد البشرية</div>
                <div className="font-mono text-slate-500 text-[10px]">hrmanager / hr123</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('viewer', 'viewer123')}
                className="col-span-2 p-2.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-right cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">مستعرض الموظفين (اختبار الصلاحيات - استعراض فقط)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-200/70 text-blue-800 font-semibold">محدد الصلاحية</span>
                </div>
                <div className="font-mono text-blue-700 text-[10px] mt-0.5">viewer / viewer123 (صلاحية عرض الموظفين فقط بدون إضافة أو تعديل أو حذف)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
          نظام مجموعة البحري v1.0.0 (SQLite Schema Validated)
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useTheme, ThemeId } from '../context/ThemeContext';
import { Sparkles, Check, X, Shield, Crown, Gem, Palette } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentThemeId, setTheme, availableThemes } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-['Cairo',sans-serif]">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-amber-500/30 max-w-2xl w-full p-6 overflow-hidden relative">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>سمات التصميم الفاخرة العصرية</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Luxury Editions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                اختر مظهرك المفضل للنظام، صُممت السمات بلمسات ملكية وتناغم لوني راقٍ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5 max-h-[62vh] overflow-y-auto pr-1">
          {availableThemes.map((t) => {
            const isSelected = t.id === currentThemeId;

            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/40 bg-slate-800/90 shadow-lg'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Visual Swatch Strip */}
                <div
                  className="w-full h-12 rounded-lg mb-3 shadow-inner flex items-center justify-between px-3 border border-white/10"
                  style={{ background: t.colors.previewGradient }}
                >
                  <span className="text-[11px] font-bold text-white drop-shadow-md">
                    {t.englishName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/30"
                      style={{ backgroundColor: t.colors.primary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/30"
                      style={{ backgroundColor: t.colors.secondary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/30"
                      style={{ backgroundColor: t.colors.accent }}
                    />
                  </div>
                </div>

                {/* Theme Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {t.id === 'royal-gold' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      {t.id === 'emerald-luxe' && <Gem className="w-3.5 h-3.5 text-emerald-400" />}
                      {t.id === 'sapphire-prestige' && <Shield className="w-3.5 h-3.5 text-sky-400" />}
                      {t.id === 'amethyst-majesty' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                      {t.id === 'pearl-executive' && <Palette className="w-3.5 h-3.5 text-slate-300" />}
                      <span>{t.name}</span>
                    </h3>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                        <Check className="w-3 h-3" />
                        <span>مفعل</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>
                </div>

                {/* Badge Indicator */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{t.isDark ? 'الوضع الداكن الفاخر' : 'الوضع النهاري اللؤلؤي'}</span>
                  <span style={{ color: t.colors.primary }}>● {t.colors.primary}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            يتم حفظ السمة تلقائياً في ذاكرة المتصفح وتطبيقها على كافة الشاشات والقوائم.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-md"
          >
            تم واغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

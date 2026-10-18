import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId =
  | 'royal-gold'
  | 'emerald-luxe'
  | 'sapphire-prestige'
  | 'amethyst-majesty'
  | 'pearl-executive';

export interface LuxuryTheme {
  id: ThemeId;
  name: string;
  englishName: string;
  description: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    border: string;
    text: string;
    textMuted: string;
    previewGradient: string;
  };
}

export const LUXURY_THEMES: LuxuryTheme[] = [
  {
    id: 'royal-gold',
    name: 'الفخامة الملكية والذهب الأسود',
    englishName: 'Royal Imperial Gold',
    description: 'خلفيات داكنة فحمية فاخرة مع تدرجات الذهب الخالص عيار 24 وحواف مذهبة ملكية راقية',
    isDark: true,
    colors: {
      primary: '#d4af37',
      secondary: '#fef08a',
      accent: '#fbbf24',
      background: '#090d16',
      card: '#111827',
      border: '#3b2f12',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      previewGradient: 'linear-gradient(135deg, #090d16 0%, #1a1608 50%, #d4af37 100%)',
    },
  },
  {
    id: 'emerald-luxe',
    name: 'الزمرد الإمبراطوري والشمبانيا',
    englishName: 'Noble Emerald & Champagne',
    description: 'درجات الزمرد الأخضر العميق مع لمسات الشمبانيا الذهبية الدافئة ترمز للنمو والريادة',
    isDark: true,
    colors: {
      primary: '#10b981',
      secondary: '#e2c17c',
      accent: '#34d399',
      background: '#041712',
      card: '#0a271f',
      border: '#134e3f',
      text: '#f8fafc',
      textMuted: '#a7f3d0',
      previewGradient: 'linear-gradient(135deg, #041712 0%, #064e3b 50%, #10b981 100%)',
    },
  },
  {
    id: 'sapphire-prestige',
    name: 'الياقوت الأزرق والبلاتينيوم',
    englishName: 'Midnight Sapphire & Platinum',
    description: 'الأزرق البحري الملكي النبيل مع لمعان الفضة والبلاتينيوم لنقاء إداري وتنفيذي فائق',
    isDark: true,
    colors: {
      primary: '#38bdf8',
      secondary: '#93c5fd',
      accent: '#2563eb',
      background: '#060f1e',
      card: '#0c1e38',
      border: '#1e3a68',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      previewGradient: 'linear-gradient(135deg, #060f1e 0%, #1e3a8a 50%, #38bdf8 100%)',
    },
  },
  {
    id: 'amethyst-majesty',
    name: 'العقيق الأرجواني والذهب الوردي',
    englishName: 'Velvet Amethyst & Rose Gold',
    description: 'بنفسجي مخملي عميق مع إشراقة الذهب الوردي المعاصر يمنح التطبيق هيبة وفخامة استثنائية',
    isDark: true,
    colors: {
      primary: '#c084fc',
      secondary: '#f472b6',
      accent: '#e879f9',
      background: '#0f081a',
      card: '#1b102c',
      border: '#3b1c5c',
      text: '#f8fafc',
      textMuted: '#d8b4fe',
      previewGradient: 'linear-gradient(135deg, #0f081a 0%, #3b0764 50%, #c084fc 100%)',
    },
  },
  {
    id: 'pearl-executive',
    name: 'اللؤلؤي المعاصر والرمادي النقي',
    englishName: 'Contemporary Pearl & Slate',
    description: 'طابع نهاري نقي مع تدرجات اللؤلؤ والعاج الدافئ والأزرق الكلاسيكي للمكاتب التنفيذية',
    isDark: false,
    colors: {
      primary: '#0f172a',
      secondary: '#d97706',
      accent: '#b45309',
      background: '#f8fafc',
      card: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a',
      textMuted: '#64748b',
      previewGradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #cbd5e1 100%)',
    },
  },
];

interface ThemeContextType {
  currentThemeId: ThemeId;
  currentTheme: LuxuryTheme;
  setTheme: (themeId: ThemeId) => void;
  availableThemes: LuxuryTheme[];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'albahri_app_luxury_theme_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && LUXURY_THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return 'royal-gold'; // Default to the ultra-luxury Royal Gold theme
  });

  const currentTheme = LUXURY_THEMES.find((t) => t.id === currentThemeId) || LUXURY_THEMES[0];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentThemeId);
      if (currentTheme.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(THEME_STORAGE_KEY, currentThemeId);
    }
  }, [currentThemeId, currentTheme]);

  const handleSetTheme = (themeId: ThemeId) => {
    setCurrentThemeId(themeId);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentThemeId,
        currentTheme,
        setTheme: handleSetTheme,
        availableThemes: LUXURY_THEMES,
        isDark: currentTheme.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

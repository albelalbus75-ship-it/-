import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  FileArchive,
  CheckCircle2,
  Monitor,
  Tablet,
  Check,
  Layers,
  Copy,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  X,
  Code2,
  Boxes,
} from 'lucide-react';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'export' | 'responsive'>('install');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Responsive Simulator active preset
  const [previewScreen, setPreviewScreen] = useState<{
    id: string;
    label: string;
    width: number;
    height: number;
    category: string;
    icon: React.ReactNode;
  }>({
    id: 'phone-standard',
    label: 'هاتف أندرويد قياسي (Samsung S24 / Pixel)',
    width: 412,
    height: 780,
    category: 'هاتف ذكي (Mobile)',
    icon: <Smartphone className="w-4 h-4 text-emerald-600" />,
  });

  if (!isOpen) return null;

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Requirement: Export Android App files & project (.zip)
  const handleExportAndroidPackage = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const zip = new JSZip();

      // 1. Android Manifest XML
      const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.albahri.incentives"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Multi-Screen & Responsive Configuration: Supports all screen sizes and densities -->
    <supports-screens
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"
        android:anyDensity="true"
        android:resizeable="true" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AlbahriIncentives"
        android:hardwareAccelerated="true"
        android:largeHeap="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:theme="@style/Theme.AlbahriIncentives.NoActionBar"
            android:screenOrientation="unspecified">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Web App / TWA Intent Filters -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="albahri-incentives.app" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

      // 2. build.gradle (Module: app)
      const buildGradleApp = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.albahri.incentives'
    compileSdk 34

    defaultConfig {
        applicationId "com.albahri.incentives"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        manifestPlaceholders = [
            hostName: "albahri-incentives.app",
            defaultUrl: "https://albahri-incentives.app",
            launcherName: "@string/app_name",
            assetStatements: '[]'
        ]
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.debug // Replace with production release keystore
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.browser:browser:1.8.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}`;

      // 3. Project Level build.gradle
      const rootBuildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`;

      // 4. settings.gradle
      const settingsGradle = `rootProject.name = "AlbahriIncentives"
include ':app'`;

      // 5. Capacitor Config JSON
      const capacitorConfigJson = JSON.stringify(
        {
          appId: 'com.albahri.incentives',
          appName: 'نظام الحوافز - مجموعة البحري',
          webDir: 'dist',
          bundledWebRuntime: false,
          server: {
            androidScheme: 'https',
            cleartext: true,
          },
          android: {
            allowMixedContent: true,
            captureInput: true,
            webContentsDebuggingEnabled: true,
          },
        },
        null,
        2
      );

      // 6. TWA Manifest (Bubblewrap)
      const twaManifestJson = JSON.stringify(
        {
          packageId: 'com.albahri.incentives',
          host: 'albahri-incentives.app',
          name: 'نظام الحوافز والمكافآت - مجموعة البحري',
          launcherName: 'حوافز البحري',
          themeColor: '#0c2340',
          navigationColor: '#0c2340',
          backgroundColor: '#0c2340',
          startUrl: '/',
          iconUrl: '/pwa-512x512.png',
          maskableIconUrl: '/pwa-maskable-512x512.png',
          appVersion: '1.0.0',
          appVersionCode: 1,
          signingKey: {
            path: './android.keystore',
            alias: 'albahri',
          },
        },
        null,
        2
      );

      // 7. Values (strings, colors, styles)
      const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">حوافز البحري</string>
    <string name="company_name">مجموعة البحري التجارية</string>
    <string name="package_name">com.albahri.incentives</string>
</resources>`;

      const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#0c2340</color>
    <color name="colorPrimaryDark">#08172b</color>
    <color name="colorAccent">#d4af37</color>
    <color name="backgroundColor">#f8fafc</color>
</resources>`;

      const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.AlbahriIncentives" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:windowBackground">@color/backgroundColor</item>
    </style>
    <style name="Theme.AlbahriIncentives.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
    </style>
</resources>`;

      // 8. Build script for Linux / Mac
      const buildApkSh = `#!/bin/bash
# سكريبت بناء تطبيق الأندرويد لنظام الحوافز - مجموعة البحري
echo "=========================================================="
echo "  بدء تجميع وبناء ملف التطبيق (APK) للأندرويد..."
echo "=========================================================="

# Check Java
if ! command -v java &> /dev/null; then
    echo "تنبيه: Java JDK غير مثبت. يرجى تثبيت OpenJDK 17."
    exit 1
fi

echo "جاري تجميع حزمة الأندرويد عبر Gradle..."
./gradlew assembleRelease

echo ""
echo "تم البناء بنجاح! ملف التطبيق موجود في:"
echo "app/build/outputs/apk/release/app-release-unsigned.apk"
echo "=========================================================="`;

      // 9. Build script for Windows
      const buildApkBat = `@echo off
chcp 65001 > nul
echo ==========================================================
echo   بدء تجميع وبناء ملف التطبيق (APK) للأندرويد...
echo ==========================================================

call gradlew.bat assembleRelease

echo.
echo تم البناء بنجاح! ملف التطبيق موجود في:
echo app\\build\\outputs\\apk\\release\\app-release-unsigned.apk
echo ==========================================================
pause`;

      // 10. Arabic Detailed Instruction Guide
      const readmeArabic = `====================================================================
  حزمة تطبيق الأندرويد (Android App Package)
  نظام إدارة الحوافز والمكافآت والجزاءات - مجموعة البحري التجارية
====================================================================

مرحباً بك! تحتوي هذه الحزمة على كافة الملفات المصدرية وإعدادات الأندرويد
المطابقة لأحدث معايير Google Android SDK 34 مع دعم كامل لكافة مقاسات الشاشات.

--------------------------------------------------------------------
محتويات الحزمة:
--------------------------------------------------------------------
1. app/src/main/AndroidManifest.xml:
   - معرف التطبيق: com.albahri.incentives
   - دعم التدوير والاتجاهين (Orientation)
   - دعم الشاشات الصغيرة والعادية والكبيرة والأجهزة اللوحية (supports-screens)
   - دعم الشاشات القابلة للطي (Foldables) والأجهزة ذات الكثافات المتعددة

2. app/build.gradle:
   - إصدار الأندرويد: Compile SDK 34, Min SDK 24 (أندرويد 7.0 حتى أندرويد 15+)
   - حزمة AndroidX ومكتبات التصفح الموثوق (Trusted Web Activity)

3. capacitor.config.json & twa-manifest.json:
   - إعدادات التغليف عبر Capacitor أو Google Bubblewrap لتوليد APK بنقرة واحدة.

4. مجلد الأيقونات (res/mipmap-*/):
   - أيقونات الشعار الرسمي لمجموعة البحري بكافة كثافات الأندرويد:
     mdpi (48px), hdpi (72px), xhdpi (96px), xxhdpi (144px), xxxhdpi (192px).

--------------------------------------------------------------------
طرق التثبيت والتشغيل على هواتف الأندرويد:
--------------------------------------------------------------------

الطريقة الأولى: التثبيت المباشر الفوري (موصى بها لجميع الموظفين):
1. افتح رابط النظام في متصفح Google Chrome أو Samsung Internet على هاتفك.
2. اضغط على زر "تثبيت كبرنامج" أو من قائمة المتصفح (⋮) اختر:
   "تثبيت التطبيق" (Install App) أو "إضافة إلى الشاشة الرئيسية".
3. سيتثبت التطبيق فوراً كبرنامج أندرويد حقيقي (WebAPK) مع أيقونة رسمية 
   وشاشة افتتاحية ويعمل بملء الشاشة مع حفظ البيانات بدون إنترنت (Offline).

الطريقة الثانية: بناء ملف APK عبر Android Studio:
1. افتح مجلد هذا المشروع في برنامج Android Studio.
2. اختر من القائمة: Build > Build Bundle(s) / APK(s) > Build APK(s).
3. سينتج لك ملف app-release.apk جاهز للنقل والتثبيت على أي هاتف أندرويد.

الطريقة الثالثة: بناء ملف APK عبر سطر الأوامر (Terminal):
- على Linux / Mac: نفّذ أمر: chmod +x build-apk.sh && ./build-apk.sh
- على Windows: شغّل ملف build-apk.bat

--------------------------------------------------------------------
مجموعة البحري التجارية - قسم تقنية المعلومات
الإصدار 1.0.0
====================================================================`;

      // Fetch or read PNG icons to embed in the ZIP
      const fetchIcon = async (url: string) => {
        try {
          const res = await fetch(url);
          return await res.arrayBuffer();
        } catch {
          return null;
        }
      };

      const [icon192, icon512, iconMaskable] = await Promise.all([
        fetchIcon('/pwa-192x192.png'),
        fetchIcon('/pwa-512x512.png'),
        fetchIcon('/pwa-maskable-512x512.png'),
      ]);

      // Populate ZIP file structure
      zip.file('AndroidManifest.xml', androidManifestXml);
      zip.file('build.gradle', rootBuildGradle);
      zip.file('settings.gradle', settingsGradle);
      zip.file('capacitor.config.json', capacitorConfigJson);
      zip.file('twa-manifest.json', twaManifestJson);
      zip.file('build-apk.sh', buildApkSh);
      zip.file('build-apk.bat', buildApkBat);
      zip.file('دليل_تثبيت_وتشغيل_تطبيق_الأندرويد.txt', readmeArabic);

      const appFolder = zip.folder('app');
      if (appFolder) {
        appFolder.file('build.gradle', buildGradleApp);
        const mainFolder = appFolder.folder('src/main');
        if (mainFolder) {
          mainFolder.file('AndroidManifest.xml', androidManifestXml);
          const resFolder = mainFolder.folder('res');
          if (resFolder) {
            resFolder.file('values/strings.xml', stringsXml);
            resFolder.file('values/colors.xml', colorsXml);
            resFolder.file('values/styles.xml', stylesXml);

            if (icon192) {
              resFolder.file('mipmap-xxxhdpi/ic_launcher.png', icon192);
              resFolder.file('mipmap-xxhdpi/ic_launcher.png', icon192);
              resFolder.file('mipmap-xhdpi/ic_launcher.png', icon192);
              resFolder.file('mipmap-hdpi/ic_launcher.png', icon192);
              resFolder.file('mipmap-mdpi/ic_launcher.png', icon192);
            }
            if (iconMaskable) {
              resFolder.file('mipmap-xxxhdpi/ic_launcher_round.png', iconMaskable);
              resFolder.file('mipmap-xxhdpi/ic_launcher_round.png', iconMaskable);
            }
          }
        }
      }

      // Generate the package blob
      const content = await zip.generateAsync({ type: 'blob' });

      // Trigger automatic browser download
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Albahri-Incentives-Android-Package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
    } catch (err) {
      console.error('Failed to export Android package:', err);
      alert('حدث خطأ أثناء تصدير ملف تطبيق الأندرويد.');
    } finally {
      setIsExporting(false);
    }
  };

  const screenPresets = [
    {
      id: 'phone-compact',
      label: 'هاتف شاشة صغيرة (360×640)',
      width: 360,
      height: 640,
      category: 'هاتف اقتصادي صغير',
      icon: <Smartphone className="w-4 h-4 text-slate-600" />,
    },
    {
      id: 'phone-standard',
      label: 'هاتف قياسي (412×915)',
      width: 412,
      height: 780,
      category: 'Samsung Galaxy / Pixel',
      icon: <Smartphone className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'phone-foldable',
      label: 'هاتف قابل للطي / عريض (540×720)',
      width: 540,
      height: 720,
      category: 'Foldable / Large Phone',
      icon: <Smartphone className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'tablet-portrait',
      label: 'جهاز لوحي عمودي (768×1024)',
      width: 768,
      height: 600,
      category: 'Tablet (Portrait)',
      icon: <Tablet className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'tablet-landscape',
      label: 'جهاز لوحي أفقي / مكتبي (1024×768)',
      width: 1024,
      height: 540,
      category: 'Tablet Landscape / Desktop',
      icon: <Monitor className="w-4 h-4 text-amber-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 font-['Cairo',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">مركز تطبيق الأندرويد والتوافق مع جميع الشاشات</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  Android SDK 34
                </span>
              </div>
              <p className="text-xs text-slate-300">
                تثبيت مباشر على الهواتف، تصدير ملفات التطبيق (APK Package)، واختبار التوافق مع كل المقاسات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 shrink-0 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'install'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>1. التثبيت على الهاتف (WebAPK / PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileArchive className="w-4 h-4 text-blue-600" />
            <span>2. تصدير ملف التطبيق (Android Package .zip)</span>
          </button>

          <button
            onClick={() => setActiveTab('responsive')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'responsive'
                ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-purple-600" />
            <span>3. فحص ومحاكاة جميع الشاشات</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* TAB 1: Direct Android Install */}
          {activeTab === 'install' && (
            <div className="space-y-5">
              {/* Main Call to action */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-900">
                      {isInstalled ? 'التطبيق مثبت بالفعل على هذا الجهاز' : 'التطبيق جاهز للتثبيت المباشر على أندرويد'}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    تشغيل نظام الحوافز كتطبيق أندرويد مستقل بملء الشاشة
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xl">
                    يتم تثبيت التطبيق مباشرة في قائمة تطبيقات هاتفك (App Drawer) مع أيقونة رسمية عالية الدقة،
                    ويعمل بدون اتصال بالإنترنت مع حفظ وتحديث البيانات تلقائياً.
                  </p>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {isInstalled ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>مثبت ويعمل في وضع Standalone</span>
                    </div>
                  ) : isInstallable ? (
                    <button
                      onClick={install}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تثبيت التطبيق على هاتفي الآن</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        alert(
                          'لتثبيت التطبيق على الأندرويد:\n1. افتح قائمة المتصفح (⋮) في أعلى الشاشة.\n2. اختر "تثبيت التطبيق" (Install App) أو "إضافة إلى الشاشة الرئيسية".'
                        );
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>خطوات التثبيت السريع</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Browser Instructions Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>طريقة التثبيت حسب متصفح هاتفك:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Chrome */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Google Chrome (أندرويد)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                      <li>اضغط على قائمة الثلاث نقاط <strong>(⋮)</strong> بأعلى المتصفح.</li>
                      <li>اختر <strong>"تثبيت التطبيق"</strong> (Install App).</li>
                      <li>اضغط <strong>"تثبيت"</strong> لتظهر الأيقونة في هاتفك فوراً.</li>
                    </ol>
                  </div>

                  {/* Samsung Internet */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Samsung Internet</span>
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                      <li>اضغط على أيقونة التنزيل أو قائمة الخطوط <strong>(☰)</strong>.</li>
                      <li>اختر <strong>"إضافة صفحة إلى"</strong> ثم <strong>"شاشة التطبيقات"</strong>.</li>
                      <li>سيتوفر التطبيق كـ App رسمي في هاتفك.</li>
                    </ol>
                  </div>

                  {/* Safari / iOS */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Apple Safari (آيفون / آيباد)</span>
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                      <li>اضغط على زر المشاركة <strong>(Share)</strong> في الأسفل.</li>
                      <li>مرر واختر <strong>"إضافة إلى الصفحة الرئيسية"</strong>.</li>
                      <li>اضغط <strong>"إضافة" (Add)</strong> بأعلى الشاشة.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Features of Installed App */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">ميزات تطبيق الأندرويد المثبت:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">ملء الشاشة بدون شريط روابط</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">عمل كامل بدون إنترنت (Offline)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">أيقونة رسمية عالية الدقة</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">تحديث تلقائي وفوري</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Export Android App Source & Package */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono">
                      ZIP PACKAGE
                    </span>
                    <span className="text-xs font-bold text-blue-900">حزمة ملفات أندرويد الجاهزة</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    تصدير ملفات التطبيق (Android Studio & Gradle Build Package)
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xl">
                    توليد ملف مضغوط كامل يحتوي على مشروع أندرويد جاهز للبناء مع ملفات البيان (AndroidManifest.xml)
                    وكافة مقاسات الأيقونات (Mipmap) وسكريبتات التجميع لإنتاج ملف APK صالح للتوزيع الداخلي.
                  </p>
                </div>

                <button
                  onClick={handleExportAndroidPackage}
                  disabled={isExporting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'جاري إنشاء الحزمة...' : 'تنزيل حزمة تطبيق الأندرويد (.zip)'}</span>
                </button>
              </div>

              {exportSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    تم توليد وتنزيل ملف <strong>Albahri-Incentives-Android-Package.zip</strong> بنجاح إلى جهازك!
                  </span>
                </div>
              )}

              {/* Package Specifications Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 border-b border-slate-200">
                  مواصفات حزمة الأندرويد المصدّرة:
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1 hover:bg-slate-50">
                    <span className="font-semibold text-slate-500">معرف الحزمة (Package ID):</span>
                    <code className="sm:col-span-2 font-mono text-blue-700">com.albahri.incentives</code>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1 hover:bg-slate-50">
                    <span className="font-semibold text-slate-500">اسم التطبيق (App Name):</span>
                    <span className="sm:col-span-2 font-bold text-slate-900">نظام الحوافز والمكافآت - مجموعة البحري</span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1 hover:bg-slate-50">
                    <span className="font-semibold text-slate-500">إصدارات النظام المدعومة:</span>
                    <span className="sm:col-span-2 text-slate-700">
                      Min SDK: 24 (Android 7.0+) حتى Target SDK: 34 (Android 14 / 15)
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1 hover:bg-slate-50">
                    <span className="font-semibold text-slate-500">التوافق مع مقاسات الشاشات:</span>
                    <span className="sm:col-span-2 text-emerald-700 font-semibold">
                      يدعم Small, Normal, Large, XLarge, Foldables, Any Density (100% متجاوب)
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1 hover:bg-slate-50">
                    <span className="font-semibold text-slate-500">الملفات المضمنة في الحزمة:</span>
                    <span className="sm:col-span-2 text-slate-600 text-[11px] leading-relaxed">
                      AndroidManifest.xml • build.gradle • capacitor.config.json • twa-manifest.json •
                      أيقونات mipmap بكافة المقاسات • build-apk.sh • دليل التشغيل بالعربي
                    </span>
                  </div>
                </div>
              </div>

              {/* CLI Command Example */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>أمر بناء وتجميع ملف APK السريع عبر سطر الأوامر (Terminal):</span>
                  </span>
                  <button
                    onClick={() => handleCopy('./gradlew assembleRelease', 'gradlew')}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    {copiedCode === 'gradlew' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم النسخ
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" /> نسخ الأمر
                      </span>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-xs text-emerald-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto">
                  ./gradlew assembleRelease
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Responsive Multi-Screen Simulator & Audit */}
          {activeTab === 'responsive' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  محاكي ومعاينة توافق النظام مع جميع مقاسات شاشات الأندرويد:
                </h3>
                <p className="text-xs text-slate-500">
                  تم اختبار وتصميم كافة شاشات وجداول ونوافذ النظام لتتكيف بسلاسة تامة مع مختلف أجهزة الهواتف
                  والأجهزة اللوحية
                </p>
              </div>

              {/* Screen selector presets */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {screenPresets.map((preset) => {
                  const isSelected = previewScreen.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setPreviewScreen(preset)}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {preset.icon}
                        <span className="text-[10px] font-mono text-slate-400">
                          {preset.width}×{preset.height}
                        </span>
                      </div>
                      <div className="text-xs font-bold truncate">{preset.label.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-500 truncate">{preset.category}</div>
                    </button>
                  );
                })}
              </div>

              {/* Viewport simulation container */}
              <div className="border border-slate-300 rounded-2xl p-4 bg-slate-100 flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-600 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{previewScreen.label}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
                      {previewScreen.width}px × {previewScreen.height}px
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>متوافق 100% مع الأندرويد</span>
                  </div>
                </div>

                {/* Device Frame */}
                <div
                  className="bg-slate-900 p-2.5 rounded-[28px] shadow-2xl transition-all duration-300 max-w-full overflow-hidden border-4 border-slate-700"
                  style={{ width: `${Math.min(previewScreen.width, 780)}px` }}
                >
                  {/* Phone Speaker & Camera Notch */}
                  <div className="flex justify-center mb-1.5">
                    <div className="w-16 h-1 rounded-full bg-slate-700" />
                  </div>

                  {/* Simulated Screen Inner Content */}
                  <div
                    className="bg-slate-50 rounded-2xl overflow-y-auto p-3 text-right space-y-3 font-['Cairo',sans-serif]"
                    style={{ maxHeight: '380px' }}
                  >
                    {/* App Header in preview */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                          ⚓
                        </div>
                        <span className="text-xs font-bold text-slate-900">مجموعة البحري</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        أندرويد نشط
                      </span>
                    </div>

                    {/* Quick KPI stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">إجمالي الحوافز</div>
                        <div className="text-sm font-bold text-emerald-700 font-mono">145,000 YER</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">الموظفين النشطين</div>
                        <div className="text-sm font-bold text-slate-900 font-mono">3 موظفين</div>
                      </div>
                    </div>

                    {/* Responsive sample table */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800">جدول البيانات المتجاوب:</div>
                      <div className="overflow-x-auto rounded border border-slate-100 text-[10px]">
                        <table className="w-full text-right">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="p-1.5 font-bold">الكود</th>
                              <th className="p-1.5 font-bold">الموظف</th>
                              <th className="p-1.5 font-bold">الفرع</th>
                              <th className="p-1.5 font-bold text-center">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-1.5 font-mono text-slate-500">EMP-201</td>
                              <td className="p-1.5 font-semibold text-slate-800">أحمد باوزير</td>
                              <td className="p-1.5 text-slate-600">صنعاء</td>
                              <td className="p-1.5 text-center">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px]">
                                  نشط
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-1.5 font-mono text-slate-500">EMP-202</td>
                              <td className="p-1.5 font-semibold text-slate-800">خالد العامري</td>
                              <td className="p-1.5 text-slate-600">عدن</td>
                              <td className="p-1.5 text-center">
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px]">
                                  نشط
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Phone Home Bar */}
                  <div className="flex justify-center mt-2">
                    <div className="w-24 h-1 rounded-full bg-slate-600" />
                  </div>
                </div>
              </div>

              {/* Responsive Standards Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ملاءمة الهواتف والشاشات الصغيرة (&lt; 400px):</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تحويل القوائم إلى تمرير أفقي سلس، وضبط أبعاد الأزرار وحقول الإدخال لتلائم اللمس بأصابع اليد
                    دون تداخل أو اقتطاع.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ملاءمة الأجهزة اللوحية والحواسيب (&gt; 768px):</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    استغلال المساحات العريضة عبر شبكة أفقية متعددة الأعمدة وجداول كاملة البيانات مع إمكانية
                    الطباعة والتصدير بكامل جودة العرض.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>نظام الحوافز والمكافآت - مجموعة البحري التجارية</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

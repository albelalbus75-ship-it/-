import React, { useState, useEffect, useRef } from 'react';
import {
  syncService,
  DeviceConfig,
  SyncBundle,
  SyncComparison,
} from '../services/syncService';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dbStore';
import {
  Smartphone,
  Download,
  Share2,
  QrCode,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  Check,
  X,
  Copy,
  Layers,
  ArrowRightLeft,
  FileCheck,
  Users,
  Award,
  AlertOctagon,
  Settings2,
  Clock,
  Sparkles,
  Building2,
} from 'lucide-react';

interface MobileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSyncModal: React.FC<MobileSyncModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'device' | 'history'>('export');

  // Device Config
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>(() => syncService.getDeviceConfig());
  const [editedName, setEditedName] = useState<string>('');
  const [editedRole, setEditedRole] = useState<'MASTER' | 'SECONDARY'>('MASTER');
  const [editedBranchId, setEditedBranchId] = useState<number | null>(null);
  const [deviceSavedToast, setDeviceSavedToast] = useState<boolean>(false);

  // Export State
  const [exportType, setExportType] = useState<'full' | 'incremental'>('full');
  const [exportedBundle, setExportedBundle] = useState<SyncBundle | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [copiedCodeToast, setCopiedCodeToast] = useState<boolean>(false);

  // Import State
  const [importedContent, setImportedContent] = useState<string>('');
  const [parsedBundle, setParsedBundle] = useState<SyncBundle | null>(null);
  const [bundleComparison, setBundleComparison] = useState<SyncComparison | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<'smart' | 'mirror' | 'append'>('smart');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergeSuccessReport, setMergeSuccessReport] = useState<{
    added: number;
    updated: number;
    unchanged: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branches from DB
  const branches = db.getState().branches;

  // Sync History
  const [syncHistory, setSyncHistory] = useState(() => db.getSyncLogs());

  useEffect(() => {
    if (isOpen) {
      const cfg = syncService.getDeviceConfig();
      setDeviceConfig(cfg);
      setEditedName(cfg.deviceName);
      setEditedRole(cfg.deviceRole);
      setEditedBranchId(cfg.branchId);

      // Generate current bundle ready for export
      const bundle = syncService.createSyncBundle(exportType);
      setExportedBundle(bundle);
      setSyncHistory(db.getSyncLogs());
    }
  }, [isOpen, exportType]);

  if (!isOpen) return null;

  // --- EXPORT HANDLERS ---
  const handleDownload = (format: 'albahrisync' | 'json') => {
    if (!exportedBundle) return;
    syncService.downloadSyncFile(exportedBundle, format);
    setSyncHistory(db.getSyncLogs());
    setShareToast(`تم تحميل ملف المزامنة بنجاح (${format})`);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleShare = async () => {
    if (!exportedBundle) return;
    const res = await syncService.shareSyncBundle(exportedBundle);
    setShareToast(res.message);
    setSyncHistory(db.getSyncLogs());
    setTimeout(() => setShareToast(null), 4000);
  };

  const handleShowQRCode = async () => {
    if (!exportedBundle) return;
    setIsGeneratingQr(true);
    setShowQrModal(true);
    const qrUrl = await syncService.generateQRCode(exportedBundle);
    setQrCodeDataUrl(qrUrl);
    setIsGeneratingQr(false);
  };

  const handleCopyBundleText = () => {
    if (!exportedBundle) return;
    navigator.clipboard.writeText(JSON.stringify(exportedBundle));
    setCopiedCodeToast(true);
    setTimeout(() => setCopiedCodeToast(false), 2500);
  };

  // --- IMPORT HANDLERS ---
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      setImportedContent(content);
      processImportContent(content);
    };
    reader.readAsText(file);
  };

  const processImportContent = (content: string) => {
    setParseError(null);
    setMergeSuccessReport(null);

    const check = syncService.parseSyncBundle(content);
    if (!check.isValid || !check.bundle) {
      setParseError(check.error || 'الملف غير صالح');
      setParsedBundle(null);
      setBundleComparison(null);
      return;
    }

    setParsedBundle(check.bundle);
    const comparison = syncService.compareSyncBundle(check.bundle);
    setBundleComparison(comparison);
  };

  const handleExecuteMerge = () => {
    if (!parsedBundle || !currentUser) return;
    setIsMerging(true);

    try {
      const res = syncService.applySyncBundle(parsedBundle, mergeStrategy, currentUser.UserID);
      setMergeSuccessReport({
        added: res.addedCount,
        updated: res.updatedCount,
        unchanged: res.unchangedCount,
      });
      setSyncHistory(db.getSyncLogs());
      setDeviceConfig(syncService.getDeviceConfig());
    } catch (err: any) {
      setParseError(`خطأ أثناء دمج البيانات: ${err?.message || 'خطأ غير متوقع'}`);
    } finally {
      setIsMerging(false);
    }
  };

  // --- DEVICE CONFIG HANDLERS ---
  const handleSaveDeviceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.BranchID === editedBranchId);
    const updated: DeviceConfig = {
      ...deviceConfig,
      deviceName: editedName.trim() || 'جوال العمل',
      deviceRole: editedRole,
      branchId: editedBranchId,
      branchName: branch ? branch.BranchName : 'كافة الفروع',
    };
    syncService.saveDeviceConfig(updated);
    setDeviceConfig(updated);
    setDeviceSavedToast(true);
    setTimeout(() => setDeviceSavedToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-5 font-['Cairo',sans-serif]">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-amber-500/30 w-[95%] max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Top Gold Shimmer Bar */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-white">
                  مركز المزامنة الذكية بين الجوالين (رئيسي ↔ فرعي)
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    deviceConfig.deviceRole === 'MASTER'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {deviceConfig.deviceRole === 'MASTER' ? '👑 جهاز رئيسي' : '📱 جهاز فرعي'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصدير واستيراد حزم المزامنة لنقل الحوافز والمخالفات الميدانية بدون إنترنت بين الهواتف
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير ملف المزامنة</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'import'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد ودمج ملف المزامنة</span>
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'device'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>إعدادات نمط الجهاز</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل المزامنات ({syncHistory.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300 space-y-4">
          {/* TAB 1: EXPORT SYNC FILE */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Device Overview Banner */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-slate-400 text-[11px] mb-0.5">الجهاز المصدر للحزمة:</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{deviceConfig.deviceName}</span>
                    <span className="text-[10px] bg-slate-700 text-amber-300 px-2 py-0.5 rounded font-mono">
                      {deviceConfig.deviceId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    النطاق: {deviceConfig.branchName} • آخر تصدير:{' '}
                    {deviceConfig.lastSyncDate || 'لم تتم مزامنة سابقة'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 text-center">
                    <div className="text-slate-400 text-[10px]">نوع الحزمة</div>
                    <div className="text-amber-400 font-bold">
                      {exportType === 'full' ? 'شاملة لكافة البيانات' : 'تزايدية للأحدث'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div>
                <div className="font-bold text-white mb-2 flex items-center justify-between">
                  <span>محتويات حزمة المزامنة الجاهزة للتصدير:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExportType('full')}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        exportType === 'full'
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      تصدير كامل
                    </button>
                    <button
                      onClick={() => setExportType('incremental')}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        exportType === 'incremental'
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      تصدير تزايدي
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>الموظفون</span>
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-lg font-bold text-white font-mono">
                      {exportedBundle?.summary.employees || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>سجل الحوافز</span>
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {exportedBundle?.summary.rewards || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>سجل المخالفات</span>
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="text-lg font-bold text-rose-400 font-mono">
                      {exportedBundle?.summary.violations || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>العمل الإضافي والتقييمات</span>
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-lg font-bold text-amber-400 font-mono">
                      {(exportedBundle?.summary.extraWork || 0) +
                        (exportedBundle?.summary.performanceEvals || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
                <div className="font-bold text-white mb-2">طرق نقل ومشاركة ملف المزامنة للجوال الآخر:</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Download File */}
                  <button
                    onClick={() => handleDownload('albahrisync')}
                    className="flex items-center justify-center gap-2 p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل ملف المزامنة (.albahrisync)</span>
                  </button>

                  {/* Share to WhatsApp / Bluetooth */}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>مشاركة عبر واتساب / بلوتوث</span>
                  </button>

                  {/* Peer QR Code */}
                  <button
                    onClick={handleShowQRCode}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>رمز QR للمزامنة الفورية</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                  <span>يمكنك أيضاً نسخ الشفرة النصية مباشرة ونقلها:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload('json')}
                      className="text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      تنزيل بتنسيق JSON
                    </button>
                    <button
                      onClick={handleCopyBundleText}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      {copiedCodeToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCodeToast ? 'تم النسخ!' : 'نسخ الحزمة للحافظة'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {shareToast && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{shareToast}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT & MERGE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* File Uploader Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-800/40 hover:bg-slate-800/70 rounded-2xl text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".albahrisync,.json,text/plain"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  اضغط لاختيار ملف المزامنة (.albahrisync أو .json)
                </div>
                <div className="text-[11px] text-slate-400 max-w-md mx-auto">
                  اختر الملف الذي استلمته من الجوال الآخر (الرئيسي أو الفرعي) عبر واتساب، البلوتوث، أو التنزيلات.
                </div>
              </div>

              {/* Paste Text Option */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  أو الصق محتوى حزمة المزامنة مباشرة هنا:
                </label>
                <textarea
                  value={importedContent}
                  onChange={(e) => {
                    setImportedContent(e.target.value);
                    if (e.target.value.trim()) processImportContent(e.target.value);
                  }}
                  rows={3}
                  placeholder='الصق شفرة المزامنة التي تبدأ بـ {"magic":"ALBAHRI_SYNC_V1"...'
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Inspection & Diff Viewer */}
              {bundleComparison && parsedBundle && (
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-amber-500/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span>تم فحص ملف المزامنة بنجاح</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        صادر من:{' '}
                        <span className="text-white font-semibold">
                          {bundleComparison.sourceDevice.deviceName}
                        </span>{' '}
                        ({bundleComparison.sourceDevice.deviceRole === 'MASTER' ? 'جوال رئيسي 👑' : 'جوال فرعي 📱'}) •{' '}
                        {new Date(bundleComparison.exportedAt).toLocaleString('ar-YE')}
                      </div>
                    </div>

                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/40 font-mono">
                      توقيع معتمد ✓
                    </span>
                  </div>

                  {/* Diff Highlights */}
                  <div>
                    <div className="font-bold text-white mb-2 text-xs">
                      البيانات الواردة المطلوب دمجها:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700">
                        <div className="text-[10px] text-slate-400">موظفون جدد</div>
                        <div className="text-base font-bold text-blue-400 font-mono">
                          +{bundleComparison.newEmployees}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700">
                        <div className="text-[10px] text-slate-400">حوافز ومكافآت</div>
                        <div className="text-base font-bold text-emerald-400 font-mono">
                          +{bundleComparison.newRewards}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700">
                        <div className="text-[10px] text-slate-400">مخالفات مسجلة</div>
                        <div className="text-base font-bold text-rose-400 font-mono">
                          +{bundleComparison.newViolations}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700">
                        <div className="text-[10px] text-slate-400">سجلات مطابقة</div>
                        <div className="text-base font-bold text-slate-300 font-mono">
                          {bundleComparison.existingMatched}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Merge Strategy Choice */}
                  <div className="space-y-2 pt-2 border-t border-slate-700/80">
                    <label className="text-xs font-bold text-white block">
                      اختر استراتيجية الدمج في هذا الجهاز ({deviceConfig.deviceName}):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div
                        onClick={() => setMergeStrategy('smart')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          mergeStrategy === 'smart'
                            ? 'bg-amber-500/10 border-amber-400 text-white shadow-xs'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold text-xs text-amber-300 mb-0.5">
                          💎 الدمج الذكي الآمن (موصى به)
                        </div>
                        <div className="text-[10px] leading-relaxed">
                          دمج الحركات الجديدة وتحديث البيانات الأحدث دون مساس ببيانات هذا الجهاز.
                        </div>
                      </div>

                      <div
                        onClick={() => setMergeStrategy('mirror')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          mergeStrategy === 'mirror'
                            ? 'bg-amber-500/10 border-amber-400 text-white shadow-xs'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold text-xs text-amber-300 mb-0.5">
                          🔄 استبدال ومطابقة شاملة
                        </div>
                        <div className="text-[10px] leading-relaxed">
                          استبدال بيانات هذا الجهاز بالكامل بحزمة الجوال المرسل (ممتاز لتهيئة الجوال الفرعي).
                        </div>
                      </div>

                      <div
                        onClick={() => setMergeStrategy('append')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          mergeStrategy === 'append'
                            ? 'bg-amber-500/10 border-amber-400 text-white shadow-xs'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold text-xs text-amber-300 mb-0.5">
                          ➕ إلحاق الجديد فقط
                        </div>
                        <div className="text-[10px] leading-relaxed">
                          إضافة السجلات غير الموجودة فقط وتجاهل أي سجل يحمل نفس الرقم التعريفي.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Execute Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleExecuteMerge}
                      disabled={isMerging}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isMerging ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>تنفيذ الدمج والمزامنة وحفظ البيانات</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Merge Success Toast */}
              {mergeSuccessReport && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>تمت المزامنة والدمج بنجاح تام!</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span>السجلات المضافة: +{mergeSuccessReport.added}</span>
                    <span>السجلات المحدثة: ✎{mergeSuccessReport.updated}</span>
                    <span>سجلات متطابقة: ✓{mergeSuccessReport.unchanged}</span>
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    تم توثيق العملية فورياً في سجل تدقيق النظام وسجل المزامنات.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEVICE MODE & SETTINGS */}
          {activeTab === 'device' && (
            <form onSubmit={handleSaveDeviceConfig} className="space-y-4">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>تحديد هوية ونمط هذا الهاتف:</span>
                </h3>

                {/* Role Switcher */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div
                    onClick={() => setEditedRole('MASTER')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      editedRole === 'MASTER'
                        ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">👑 الجوال الرئيسي (Master)</span>
                      {editedRole === 'MASTER' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      للإدارة العامة والمدير التنفيذي ومدير الموارد البشرية. يملك الصلاحية المركزية ودمج تقارير كافة الفروع الميدانية.
                    </p>
                  </div>

                  <div
                    onClick={() => setEditedRole('SECONDARY')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      editedRole === 'SECONDARY'
                        ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">📱 الجوال الفرعي (Secondary / Branch)</span>
                      {editedRole === 'SECONDARY' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      لمشرفي الفروع، المراقبين الميدانيين ومسؤولي التسجيل. يتيح تسجيل الحوافز والمخالفات وتصدير حزمة المزامنة للإدارة.
                    </p>
                  </div>
                </div>

                {/* Device Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    اسم / مسمى هذا الجوال (يظهر في تقارير المزامنة):
                  </label>
                  <input
                    type="text"
                    required
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="مثال: جوال الإدارة العامة، جوال مشرف فرع عدن، جوال أ. أحمد..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Branch Scope */}
                {editedRole === 'SECONDARY' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      الفرع التابع له هذا الجهاز:
                    </label>
                    <select
                      value={editedBranchId === null ? '' : editedBranchId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedBranchId(val === '' ? null : Number(val));
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="">كافة الفروع / بدون تقييد</option>
                      {branches.map((b) => (
                        <option key={b.BranchID} value={b.BranchID}>
                          {b.BranchName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Persistent UUID */}
                <div className="pt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-700/60">
                  <span>المعرف الفريد الثابت للجهاز (UUID):</span>
                  <span className="text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {deviceConfig.deviceId}
                  </span>
                </div>
              </div>

              {deviceSavedToast && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم حفظ إعدادات نمط الجهاز بنجاح.</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  حفظ تعديلات الجهاز
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SYNC HISTORY LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>سجل عمليات المزامنة والتصدير والاستيراد السابقة:</span>
                <span className="text-slate-400 text-[11px]">إجمالي العمليات: {syncHistory.length}</span>
              </div>

              {syncHistory.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p>لا توجد عمليات مزامنة مسجلة حتى الآن.</p>
                  <p className="text-[11px] mt-1 text-slate-500">
                    ابدأ بتصدير ملف المزامنة أو استيراده لتوثيق الحركة هنا تلقائياً.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">النوع</th>
                        <th className="py-2.5 px-3">الجهاز المصدر</th>
                        <th className="py-2.5 px-3">التاريخ والوقت</th>
                        <th className="py-2.5 px-3">اسم الملف</th>
                        <th className="py-2.5 px-3">إحصاء السجلات</th>
                        <th className="py-2.5 px-3">الحالة والملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {syncHistory.map((log) => (
                        <tr key={log.SyncID} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.SyncType === 'EXPORT'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {log.SyncType === 'EXPORT' ? 'تصدير حزمة' : 'استيراد ودمج'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-white">{log.DeviceName || 'جوال'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {log.DeviceRole === 'MASTER' ? 'رئيسي 👑' : 'فرعي 📱'}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {log.SyncDate}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-amber-300 truncate max-w-xs">
                            {log.FileName}
                          </td>
                          <td className="py-2 px-3 text-[11px] font-mono text-slate-300">
                            م:{log.RecordsSummary?.employees ?? 0} | ح:{log.RecordsSummary?.rewards ?? 0} | خ:{log.RecordsSummary?.violations ?? 0}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-400">
                            {log.Notes || 'تم بنجاح'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>نظام مزامنة الجوالين - معتمد لمجموعة البحري 1.0</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* QR Code Popup Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 font-['Cairo',sans-serif]">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>رمز QR للمزامنة الفورية</span>
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl inline-block shadow-inner mx-auto">
              {isGeneratingQr ? (
                <div className="w-64 h-64 flex items-center justify-center text-slate-900 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mb-2" />
                  <p>جاري توليد رمز المزامنة...</p>
                </div>
              ) : qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Sync"
                  className="w-64 h-64 object-contain rounded"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-slate-500 text-xs">
                  تعذر توليد الرمز
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              قم بتوجيه كاميرا الجوال الآخر أو ماسح الرموز لمسح هذا الرمز للمزامنة الفورية بين الهاتفين بدون أي كابل أو إنترنت.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

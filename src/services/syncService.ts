import { db } from './dbStore';
import { DatabaseState, SyncLog } from '../types/database';
import QRCode from 'qrcode';

export interface DeviceConfig {
  deviceId: string;
  deviceName: string;
  deviceRole: 'MASTER' | 'SECONDARY';
  branchId: number | null;
  branchName: string;
  lastSyncDate: string | null;
  syncCount: number;
}

export interface SyncBundle {
  magic: 'ALBAHRI_SYNC_V1';
  exportedAt: string;
  sourceDevice: {
    deviceId: string;
    deviceName: string;
    deviceRole: 'MASTER' | 'SECONDARY';
    branchId: number | null;
    branchName: string;
  };
  exportType: 'full' | 'incremental';
  summary: {
    branches: number;
    departments: number;
    employees: number;
    rewards: number;
    violations: number;
    extraWork: number;
    performanceEvals: number;
    users: number;
  };
  payload: Partial<DatabaseState>;
  checksum: string;
}

export interface SyncComparison {
  sourceDevice: SyncBundle['sourceDevice'];
  exportedAt: string;
  exportType: 'full' | 'incremental';
  summary: SyncBundle['summary'];
  newEmployees: number;
  newRewards: number;
  newViolations: number;
  newExtraWork: number;
  newEvals: number;
  existingMatched: number;
}

const DEVICE_STORAGE_KEY = 'albahri_mobile_device_config_v1';

// Generate consistent unique device ID if none exists
function generateUniqueDeviceId(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const time = Date.now().toString(36).substring(4).toUpperCase();
  return `DEV-${time}-${rand}`;
}

export const syncService = {
  /**
   * Get current device role and configuration
   */
  getDeviceConfig(): DeviceConfig {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }

    const initial: DeviceConfig = {
      deviceId: generateUniqueDeviceId(),
      deviceName: 'الجوال الرئيسي (الإدارة العامة)',
      deviceRole: 'MASTER',
      branchId: null,
      branchName: 'كافة الفروع',
      lastSyncDate: null,
      syncCount: 0,
    };

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(initial));
    }
    return initial;
  },

  /**
   * Save updated device configuration
   */
  saveDeviceConfig(config: DeviceConfig): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(config));
    }
  },

  /**
   * Simple hash checksum for payload integrity verification
   */
  calculateChecksum(payloadStr: string): string {
    let hash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
      const char = payloadStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase();
  },

  /**
   * Create a synchronization bundle ready for export
   */
  createSyncBundle(exportType: 'full' | 'incremental' = 'full'): SyncBundle {
    const config = this.getDeviceConfig();
    const state = db.getState();

    // In incremental export, we could filter by date if needed; currently export full current collections
    const payload: Partial<DatabaseState> = {
      branches: state.branches,
      departments: state.departments,
      employees: state.employees,
      rewards: state.rewards,
      violations: state.violations,
      extraWork: state.extraWork,
      performanceEvals: state.performanceEvals,
      rewardTypes: state.rewardTypes,
      violationTypes: state.violationTypes,
      violationDegrees: state.violationDegrees,
      currencies: state.currencies,
      users: state.users,
    };

    const payloadJson = JSON.stringify(payload);
    const checksum = this.calculateChecksum(payloadJson);

    const bundle: SyncBundle = {
      magic: 'ALBAHRI_SYNC_V1',
      exportedAt: new Date().toISOString(),
      sourceDevice: {
        deviceId: config.deviceId,
        deviceName: config.deviceName,
        deviceRole: config.deviceRole,
        branchId: config.branchId,
        branchName: config.branchName,
      },
      exportType,
      summary: {
        branches: state.branches.length,
        departments: state.departments.length,
        employees: state.employees.length,
        rewards: state.rewards.length,
        violations: state.violations.length,
        extraWork: state.extraWork.length,
        performanceEvals: state.performanceEvals.length,
        users: state.users.length,
      },
      payload,
      checksum,
    };

    return bundle;
  },

  /**
   * Download the sync bundle as a .albahrisync file
   */
  downloadSyncFile(bundle: SyncBundle, fileFormat: 'albahrisync' | 'json' = 'albahrisync'): void {
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const roleName = bundle.sourceDevice.deviceRole === 'MASTER' ? 'رئيسي' : 'فرعي';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `مزامنة_البحري_${roleName}_${dateStr}.${fileFormat}`;

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Update last sync and log
    const config = this.getDeviceConfig();
    config.lastSyncDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    config.syncCount += 1;
    this.saveDeviceConfig(config);

    db.addSyncLog({
      SyncType: 'EXPORT',
      DeviceRole: config.deviceRole,
      DeviceName: config.deviceName,
      BranchID: config.branchId,
      BranchName: config.branchName,
      SyncDate: config.lastSyncDate,
      FileName: fileName,
      RecordsSummary: bundle.summary,
      Status: 'SUCCESS',
      Notes: `تم تصدير ملف مزامنة (${bundle.exportType === 'full' ? 'شامل' : 'تزايدي'}) بنجاح`,
    });
  },

  /**
   * Share sync file directly via Web Share API (WhatsApp, Bluetooth, etc.)
   */
  async shareSyncBundle(bundle: SyncBundle): Promise<{ success: boolean; message: string }> {
    const jsonStr = JSON.stringify(bundle);
    const roleName = bundle.sourceDevice.deviceRole === 'MASTER' ? 'رئيسي' : 'فرعي';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `مزامنة_البحري_${roleName}_${dateStr}.albahrisync`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        const file = new File([jsonStr], fileName, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `ملف مزامنة نظام الحوافز - مجموعة البحري (${roleName})`,
            text: `ملف مزامنة صادر من ${bundle.sourceDevice.deviceName} بتاريخ ${new Date().toLocaleDateString('ar-YE')}`,
            files: [file],
          });
          return { success: true, message: 'تم فتح نافذة المشاركة بنجاح' };
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(jsonStr);
      return {
        success: true,
        message: 'تم نسخ محتوى ملف المزامنة للحافظة! يمكنك لصقه وإرساله عبر واتساب أو تيليجرام.',
      };
    } catch {
      return { success: false, message: 'تعذرت المشاركة المباشرة، يرجى استخدام زر تنزيل الملف.' };
    }
  },

  /**
   * Generate QR Code Data URL for offline peer sync
   */
  async generateQRCode(bundle: SyncBundle): Promise<string> {
    // For QR code, we create a compact sync payload to fit inside a standard high-density QR
    const compact = {
      m: 'ALB_SYNC',
      d: bundle.sourceDevice,
      t: bundle.exportedAt,
      s: bundle.summary,
      // Pass essentials for quick preview
      c: bundle.checksum,
    };
    const str = JSON.stringify(compact);
    try {
      const dataUrl = await QRCode.toDataURL(str, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      return dataUrl;
    } catch (e) {
      console.error('Failed to generate QR code', e);
      return '';
    }
  },

  /**
   * Parse and validate imported sync file / text
   */
  parseSyncBundle(content: string): { isValid: boolean; bundle?: SyncBundle; error?: string } {
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, error: 'الملف ليس بتنسيق JSON صالح' };
      }
      if (parsed.magic !== 'ALBAHRI_SYNC_V1' && !parsed.payload) {
        return { isValid: false, error: 'الملف لا يحمل توقيع حزم المزامنة المعتمدة لمجموعة البحري' };
      }

      // Payload validation
      if (!parsed.payload || typeof parsed.payload !== 'object') {
        return { isValid: false, error: 'الملف لا يحتوي على بيانات قابلة للدمج' };
      }

      return { isValid: true, bundle: parsed as SyncBundle };
    } catch {
      return { isValid: false, error: 'فشل في قراءة ملف المزامنة. تأكد من سلامة الملف' };
    }
  },

  /**
   * Compare incoming bundle with current state to show diff
   */
  compareSyncBundle(bundle: SyncBundle): SyncComparison {
    const state = db.getState();
    const payload = bundle.payload;

    let newEmployees = 0;
    let newRewards = 0;
    let newViolations = 0;
    let newExtraWork = 0;
    let newEvals = 0;
    let existingMatched = 0;

    if (Array.isArray(payload.employees)) {
      payload.employees.forEach((emp) => {
        const found = state.employees.some(
          (e) => (emp.EmpCode && e.EmpCode.toLowerCase() === emp.EmpCode.toLowerCase()) || e.EmpID === emp.EmpID
        );
        if (found) existingMatched++;
        else newEmployees++;
      });
    }

    if (Array.isArray(payload.rewards)) {
      payload.rewards.forEach((r) => {
        const found = state.rewards.some((ex) => ex.RewardID === r.RewardID);
        if (found) existingMatched++;
        else newRewards++;
      });
    }

    if (Array.isArray(payload.violations)) {
      payload.violations.forEach((v) => {
        const found = state.violations.some((ex) => ex.ViolationID === v.ViolationID);
        if (found) existingMatched++;
        else newViolations++;
      });
    }

    if (Array.isArray(payload.extraWork)) {
      payload.extraWork.forEach((w) => {
        const found = state.extraWork.some((ex) => ex.ExtraID === w.ExtraID);
        if (found) existingMatched++;
        else newExtraWork++;
      });
    }

    if (Array.isArray(payload.performanceEvals)) {
      payload.performanceEvals.forEach((ev) => {
        const found = state.performanceEvals.some((ex) => ex.EvalID === ev.EvalID);
        if (found) existingMatched++;
        else newEvals++;
      });
    }

    return {
      sourceDevice: bundle.sourceDevice,
      exportedAt: bundle.exportedAt,
      exportType: bundle.exportType,
      summary: bundle.summary,
      newEmployees,
      newRewards,
      newViolations,
      newExtraWork,
      newEvals,
      existingMatched,
    };
  },

  /**
   * Execute merge of the sync bundle into the active database
   */
  applySyncBundle(
    bundle: SyncBundle,
    strategy: 'smart' | 'mirror' | 'append',
    currentUserId: number
  ): { addedCount: number; updatedCount: number; unchangedCount: number } {
    const sourceDesc = `${bundle.sourceDevice.deviceName} (${bundle.sourceDevice.deviceRole === 'MASTER' ? 'رئيسي' : 'فرعي'})`;

    const result = db.mergeDatabaseState(bundle.payload, strategy, currentUserId, sourceDesc);

    // Update local device last sync time
    const config = this.getDeviceConfig();
    config.lastSyncDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    config.syncCount += 1;
    this.saveDeviceConfig(config);

    // Save Sync Log
    db.addSyncLog({
      SyncType: 'IMPORT',
      DeviceRole: bundle.sourceDevice.deviceRole,
      DeviceName: bundle.sourceDevice.deviceName,
      BranchID: bundle.sourceDevice.branchId,
      BranchName: bundle.sourceDevice.branchName,
      SyncDate: config.lastSyncDate,
      FileName: `مزامنة_واردة_${bundle.sourceDevice.deviceRole}.albahrisync`,
      RecordsSummary: bundle.summary,
      Status: 'SUCCESS',
      Notes: `تم دمج البيانات بنجاح باستراتيجية [${
        strategy === 'smart' ? 'الدمج الذكي' : strategy === 'mirror' ? 'المطابقة الكاملة' : 'الإلحاق فقط'
      }]. إضافة: ${result.addedCount}، تحديث: ${result.updatedCount}`,
    });

    return result;
  },
};

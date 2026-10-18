import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { AndroidAppModal } from './AndroidAppModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap ${
          isInstalled
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
            : isInstallable
            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
        }`}
        title="تثبيت وتصدير تطبيق الأندرويد"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>تطبيق Android</span>
        {isInstalled ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        ) : isInstallable ? (
          <Download className="w-3 h-3 text-white shrink-0 animate-bounce" />
        ) : null}
      </button>

      {/* Android Center & Export Modal */}
      <AndroidAppModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

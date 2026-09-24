import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { VietTrackLogoMark } from '../ui/logo';
import PwaInstallModal from './PwaInstallModal';

export const PwaBanner: React.FC = () => {
  const { isInstalled, canInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (!isDismissed && !isInstalled) {
      // Delay 2 seconds to not disturb the initial page rendering
      const timer = setTimeout(() => {
        setDismissed(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  if (isInstalled || dismissed) {
    return (
      <PwaInstallModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    );
  }

  return (
    <>
      {/* Floating Bottom-Right Smart Pill Banner */}
      <aside 
        aria-label="Cài đặt ứng dụng Đi Du Lịch"
        className="fixed bottom-16 lg:bottom-5 right-3 sm:right-6 z-40 max-w-sm w-[calc(100%-24px)] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-[#048C73]/30 p-3 sm:p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#edfbf7] border border-[#048C73]/20 flex items-center justify-center shrink-0">
            <VietTrackLogoMark size={28} />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900 truncate">
                Cài đặt Đi Du Lịch App
              </span>
              <span className="flex items-center text-[10px] font-black text-[#EA580C] bg-[#EA580C]/10 px-1 py-0.2 rounded-sm shrink-0">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Mới
              </span>
            </div>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              Mở toàn màn hình, tải nhanh & thông báo phòng
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-gradient-to-r from-[#048C73] to-[#025A4A] hover:opacity-95 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {canInstall ? <Download className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>Cài đặt</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Đóng thông báo tải app"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <PwaInstallModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default PwaBanner;

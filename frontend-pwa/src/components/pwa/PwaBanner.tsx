import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import PwaInstallModal from './PwaInstallModal';

export const PwaBanner: React.FC = () => {
  const { isInstalled, canInstall, installApp } = usePwaInstall();
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (!isDismissed && !isInstalled) {
      // Delay 2 seconds to not disturb the initial page rendering
      const timer = setTimeout(() => {
        setDismissed(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInstalled]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstallDirectly = async () => {
    if (canInstall) {
      const ok = await installApp();
      if (!ok) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
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
      {/* Floating Bottom-Right Smart Pill Banner - Chuẩn style HRM */}
      <aside 
        aria-label="Cài đặt ứng dụng Đi Du Lịch"
        className="fixed bottom-16 lg:bottom-5 right-3 sm:right-6 z-40 max-w-sm w-[calc(100%-24px)] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div 
          onClick={handleInstallDirectly}
          className="group relative bg-white/95 hover:bg-white text-gray-900 rounded-md sm:rounded-lg shadow-xl border border-gray-200/90 p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all cursor-pointer backdrop-blur-md"
        >
          {/* Cụm Icon bo góc màu cam/đỏ như ảnh mẫu HRM */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md sm:rounded-lg bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center shrink-0 shadow-sm text-white transition-transform group-hover:scale-105">
              <Download className="w-5 h-5 stroke-[2.3]" />
            </div>

            {/* Văn bản mô tả */}
            <div className="text-left min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug tracking-tight truncate">
                Cài Đi Du Lịch lên máy
              </h3>
              <p className="text-[11px] text-gray-500 leading-normal truncate mt-0.5">
                Mở nhanh, đặt phòng tiện như một ứng dụng.
              </p>
            </div>
          </div>

          {/* Nút Cài đặt đỏ cam & Nút X */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleInstallDirectly();
              }}
              className="px-3.5 py-1.5 rounded-md text-xs font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Cài đặt
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors cursor-pointer"
              title="Đóng thông báo"
              aria-label="Đóng thông báo"
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

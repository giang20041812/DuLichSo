import React, { useState } from 'react';
import { X } from 'lucide-react';
import { VietTrackLogoMark } from '@/components/ui/logo';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import PwaInstallModal from './PwaInstallModal';

interface HeroPwaDownloadBannerProps {
  className?: string;
}

export const HeroPwaDownloadBanner: React.FC<HeroPwaDownloadBannerProps> = ({ className = '' }) => {
  const { isInstalled, canInstall, installApp } = usePwaInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('hero_pwa_banner_dismissed') === 'true';
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // Không hiển thị nếu đã cài đặt vào máy hoặc người dùng đã bấm tắt
  if (isInstalled || dismissed) {
    return (
      <PwaInstallModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    );
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('hero_pwa_banner_dismissed', 'true');
  };

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInstall) {
      setIsInstalling(true);
      try {
        const ok = await installApp();
        if (!ok) {
          setIsModalOpen(true);
        }
      } catch {
        setIsModalOpen(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* Banner tải app thiết kế tinh tế đặt trên search hub */}
      <div 
        className={`w-full max-w-xl mx-auto mb-5 sm:mb-6 animate-in fade-in slide-in-from-bottom-3 duration-300 ${className}`}
      >
        <div 
          onClick={handleAction}
          className="group relative bg-white/95 hover:bg-white text-gray-900 rounded-xl shadow-md hover:shadow-lg border border-white/70 p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all cursor-pointer backdrop-blur-md"
        >
          {/* Logo Đi Du Lịch đồng nhất chuẩn với web */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border border-[#048C73]/20 flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 p-1">
              <VietTrackLogoMark size={32} />
            </div>

            {/* Văn bản mô tả */}
            <div className="text-left min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug tracking-tight truncate">
                Cài Đi Du Lịch lên máy
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-normal truncate mt-0.5">
                Mở nhanh, đặt phòng tiện như một ứng dụng.
              </p>
            </div>
          </div>

          {/* Nút Cài đặt & Nút X */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAction}
              disabled={isInstalling}
              className="px-4 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold text-white bg-[#048C73] hover:bg-[#03735E] border-2 border-[#025a4a] active:scale-95 transition-all shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-70"
            >
              {isInstalling ? 'Đang cài...' : 'Cài đặt'}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Đóng thông báo"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <PwaInstallModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default HeroPwaDownloadBanner;

import { useEffect } from 'react';
import { X, ExternalLink, BedDouble } from 'lucide-react';
import TikTokEmbedPlayer, { TikTokLogoIcon } from './TikTokEmbedPlayer';
import { Button } from '@/components/ui/button';

interface TikTokReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  homestayName: string;
  authorName?: string;
  onScrollToRooms?: () => void;
}

export default function TikTokReviewModal({
  isOpen,
  onClose,
  url,
  homestayName,
  authorName,
  onScrollToRooms,
}: TikTokReviewModalProps) {
  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBookingClick = () => {
    onClose();
    if (onScrollToRooms) {
      setTimeout(() => {
        onScrollToRooms();
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[460px] max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-sm bg-[#fe2c55] flex items-center justify-center text-white shrink-0">
              <TikTokLogoIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                Video Review · {homestayName}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {authorName ? `@${authorName}` : 'Được gán chính thức từ homestay'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Mở trên TikTok"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Video Body (Scrollable if necessary) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col items-center bg-black">
          <TikTokEmbedPlayer
            url={url}
            homestayName={homestayName}
            authorName={authorName}
            className="w-full border-0 shadow-none bg-transparent"
          />
        </div>

        {/* Modal Footer CTA */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Thấy ưng ý chỗ nghỉ này?
          </div>
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 rounded-md border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-1 sm:flex-initial cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleBookingClick}
              className="text-xs h-8 font-bold rounded-md bg-[var(--color-coral)] hover:bg-[var(--color-coral-hover)] text-white flex-1 sm:flex-initial cursor-pointer shadow-xs"
            >
              <BedDouble className="w-3.5 h-3.5 mr-1.5" />
              Xem phòng & Đặt ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

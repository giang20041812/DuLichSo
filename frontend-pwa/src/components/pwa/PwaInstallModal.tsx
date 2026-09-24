import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Monitor, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  BellRing,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { VietTrackLogoMark } from '../ui/logo';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isIos, platform, installApp } = usePwaInstall();
  const [activeTab, setActiveTab] = useState<'quick' | 'ios' | 'android' | 'desktop'>('quick');
  const [isInstalling, setIsInstalling] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://didulich.vn';

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const res = await installApp();
      if (res) {
        onClose();
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-[#048C73] to-[#025A4A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
              <VietTrackLogoMark size={32} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-white leading-tight">Đi Du Lịch App</h3>
                <span className="bg-[#F59E0B] text-gray-900 text-[10px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                  PWA 2.0
                </span>
              </div>
              <p className="text-white/80 text-xs mt-0.5">
                {isInstalled ? 'Đã cài đặt trên thiết bị này' : 'Cài đặt trực tiếp không qua kho ứng dụng'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Trạng thái đã cài đặt */}
          {isInstalled ? (
            <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-md p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">Ứng dụng đã sẵn sàng!</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Bạn đang sử dụng phiên bản ứng dụng cài đặt. Icon ứng dụng đã có trên Màn hình chính hoặc Menu máy tính.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Hành động Cài Đặt Nhanh (Nếu trình duyệt hỗ trợ beforeinstallprompt) */}
              {canInstall ? (
                <div className="bg-[#F6FAF8] border border-[#048C73]/25 rounded-md p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#048C73] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    Hỗ trợ cài đặt tự động 1 chạm
                  </div>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    Bấm nút bên dưới để tải và đưa biểu tượng Đi Du Lịch ra màn hình chính ngay tức thì.
                  </p>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#d34e0a] hover:to-[#ea580c] shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-70"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalling ? 'Đang kích hoạt...' : 'Cài đặt App vào máy ngay'}</span>
                  </button>
                </div>
              ) : null}

              {/* Navigation Tabs hướng dẫn theo thiết bị */}
              <div className="border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('quick')}
                    className={`pb-2 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'quick'
                        ? 'border-[#048C73] text-[#048C73]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Lợi ích nổi bật
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`pb-2 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'ios' || (isIos && activeTab === 'quick')
                        ? 'border-[#048C73] text-[#048C73]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>iPhone / iOS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={`pb-2 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'android'
                        ? 'border-[#048C73] text-[#048C73]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('desktop')}
                    className={`pb-2 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'desktop'
                        ? 'border-[#048C73] text-[#048C73]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Máy tính PC / Mac</span>
                  </button>
                </div>
              </div>

              {/* Tab Nội Dung: Lợi ích */}
              {activeTab === 'quick' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-md bg-[#F6FAF8] border border-[#048C73]/15">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                        <Zap className="w-4 h-4 text-[#F59E0B]" />
                        <span>Mở tức thì</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Khởi động chỉ dưới 0.5s, không cần tải lại trang mỗi lần mở.
                      </p>
                    </div>

                    <div className="p-3 rounded-md bg-[#F6FAF8] border border-[#048C73]/15">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                        <Smartphone className="w-4 h-4 text-[#048C73]" />
                        <span>Toàn màn hình</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Trải nghiệm nguyên bản độc lập, không vướng thanh địa chỉ URL.
                      </p>
                    </div>

                    <div className="p-3 rounded-md bg-[#F6FAF8] border border-[#048C73]/15">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                        <BellRing className="w-4 h-4 text-[#EA580C]" />
                        <span>Thông báo phòng</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Nhận báo tin xác nhận, số phòng và voucher ưu đãi trực tiếp.
                      </p>
                    </div>

                    <div className="p-3 rounded-md bg-[#F6FAF8] border border-[#048C73]/15">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                        <span>Siêu nhẹ & An toàn</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Chiếm chưa đến 3MB bộ nhớ, không đòi quyền truy cập riêng tư.
                      </p>
                    </div>
                  </div>

                  {/* QR Code chuyển tiếp sang điện thoại */}
                  <div className="mt-4 p-3.5 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <QrCode className="w-4 h-4 text-[#048C73]" />
                        <span>Mở trên điện thoại di động</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Dùng camera điện thoại quét mã này để cài đặt ngay.
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1 text-[11px] text-[#048C73] hover:underline font-semibold cursor-pointer pt-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã sao chép link!' : 'Sao chép đường dẫn'}</span>
                      </button>
                    </div>
                    <div className="w-20 h-20 bg-white p-1 rounded-md border border-gray-300 shrink-0 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentUrl)}`}
                        alt="QR Code Cài Đặt Ứng Dụng"
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Hướng Dẫn: iOS (Safari) */}
              {activeTab === 'ios' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-md text-xs text-amber-900">
                    Trình duyệt <strong>Safari trên iPhone/iPad</strong> không hiển thị pop-up cài đặt tự động. Vui lòng làm theo 3 bước nhanh:
                  </div>

                  <ol className="space-y-2.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <span>Nhấn vào nút <strong>Chia sẻ (Share)</strong></span>
                        <span className="inline-flex items-center justify-center w-5 h-5 mx-1.5 rounded-sm bg-gray-200 text-gray-800 align-middle">
                          <Share2 className="w-3.5 h-3.5" />
                        </span>
                        <span>ở thanh công cụ phía dưới màn hình Safari.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <span>Cuộn menu xuống và bấm chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong></span>
                        <span className="inline-flex items-center justify-center w-5 h-5 mx-1.5 rounded-sm bg-gray-200 text-gray-800 align-middle">
                          <PlusSquare className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <span>Nhấn nút <strong>Thêm (Add)</strong> ở góc trên bên phải màn hình để hoàn tất.</span>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Tab Hướng Dẫn: Android */}
              {activeTab === 'android' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-md text-xs text-emerald-950">
                    Trên <strong>Google Chrome, Samsung Internet hoặc Cốc Cốc</strong>:
                  </div>

                  <ol className="space-y-2.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <span>Nhấn vào nút menu <strong>ba chấm ⋮</strong> ở góc trên bên phải trình duyệt.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <span>Chọn mục <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào Màn hình chính</strong>.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <span>Xác nhận <strong>Cài đặt</strong> để app tự động xuất hiện trên màn hình điện thoại.</span>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Tab Hướng Dẫn: Desktop Chrome/Edge */}
              {activeTab === 'desktop' && (
                <div className="space-y-3">
                  <div className="p-3 bg-sky-50/60 border border-sky-200/80 rounded-md text-xs text-sky-950">
                    Trên <strong>Google Chrome, Microsoft Edge, Cốc Cốc (Windows & macOS)</strong>:
                  </div>

                  <ol className="space-y-2.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <span>Nhìn vào bên phải <strong>thanh nhập địa chỉ web (URL)</strong> trên trình duyệt.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <span>Nhấp vào biểu tượng <strong>Cài đặt</strong> (hình máy tính kèm mũi tên hoặc biểu tượng dấu cộng ⊕).</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50 border border-gray-100">
                      <div className="w-6 h-6 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <span>Chọn <strong>Cài đặt (Install)</strong>. Ứng dụng sẽ mở trong một cửa sổ riêng biệt không có thanh viền trình duyệt.</span>
                      </div>
                    </li>
                  </ol>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-500">Đi Du Lịch &bull; PWA Progressive App</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallModal;

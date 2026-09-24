import React, { useState } from 'react';
import { 
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
  Check, 
  Terminal, 
  Layers, 
  ArrowRight,
  WifiOff
} from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { VietTrackLogoMark } from '@/components/ui/logo';
import PwaInstallModal from '@/components/pwa/PwaInstallModal';

export default function DownloadAppPage() {
  const { canInstall, isInstalled, isIos, installApp } = usePwaInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOsTab, setActiveOsTab] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://didulich.vn';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const capacitorCommands = `# 1. Tạo bản build tối ưu
npm run build

# 2. Cài đặt Capacitor Mobile Engine
npm i @capacitor/core @capacitor/cli @capacitor/android

# 3. Khởi tạo dự án Android Native
npx cap init "Đi Du Lịch" com.didulich.app --web-dir dist

# 4. Thêm nền tảng Android & Mở trong Android Studio để xuất file APK
npx cap add android
npx cap open android`;

  const handleCopyCli = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(capacitorCommands);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8] pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#048C73] via-[#03705C] to-[#024E40] text-white pt-24 md:pt-28 pb-16 px-4 sm:px-6">
        {/* Pattern chìm trang trí */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Cột Trái: Giới thiệu & Kêu gọi hành động */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Tiêu chuẩn PWA 2.0 &bull; Cài đặt siêu tốc 1 chạm</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight leading-tight">
              Tải Ứng Dụng <br />
              <span className="text-[#3DC9D9]">Đi Du Lịch</span> Cho Điện Thoại & Máy Tính
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Trải nghiệm ứng dụng du lịch di sản & sinh thái toàn màn hình. Mở ngay lập tức không cần tải lại, nhận thông báo xác nhận đặt phòng và tra cứu vé mọi lúc mọi nơi.
            </p>

            {/* Badges thông số */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-emerald-100 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
                <span>Dung lượng &lt; 2MB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Android, iOS, PC & Mac</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#3DC9D9]" />
                <span>Tự động cập nhật bản mới</span>
              </div>
            </div>

            {/* Cụm nút hành động chính */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#10B981] text-white font-bold text-sm shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Bạn đang sử dụng phiên bản App đã cài đặt!</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (canInstall) {
                        installApp();
                      } else {
                        setIsModalOpen(true);
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#d34e0a] hover:to-[#ea580c] shadow-lg shadow-orange-950/20 transition-all active:scale-98 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{canInstall ? 'Cài Đặt Ứng Dụng Ngay' : 'Xem Hướng Dẫn Tải App'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-md transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Quét mã QR trên điện thoại</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cột Phải: Mockup App trên điện thoại & Khung QR */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[300px] sm:max-w-[320px] bg-gray-900 p-3 rounded-lg shadow-2xl border-4 border-gray-700">
              {/* Notch / Speaker */}
              <div className="w-20 h-3 bg-gray-800 rounded-sm mx-auto mb-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-900" />
              </div>

              {/* Màn hình điện thoại hiển thị App Đi Du Lịch */}
              <div className="bg-[#F6FAF8] rounded-md overflow-hidden text-gray-800 shadow-inner flex flex-col h-[400px]">
                {/* Header mô phỏng */}
                <div className="bg-[#048C73] text-white p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VietTrackLogoMark size={24} />
                    <span className="font-bold text-xs tracking-tight">Đi Du Lịch</span>
                  </div>
                  <span className="text-[10px] bg-[#F59E0B] text-gray-900 font-bold px-1 rounded-sm">
                    App
                  </span>
                </div>

                {/* Nội dung bên trong mô phỏng */}
                <div className="p-3 space-y-2.5 flex-1 overflow-hidden">
                  <div className="bg-white p-2.5 rounded-md border border-gray-200/80 shadow-xs">
                    <div className="text-[11px] font-bold text-gray-900">Mù Cang Chải Ecolodge</div>
                    <div className="text-[10px] text-gray-500">Bản Thái, Yên Bái &bull; 4.9 ★</div>
                    <div className="mt-1.5 flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[#EA580C]">850.000đ/đêm</span>
                      <span className="bg-[#10B981]/15 text-[#048C73] px-1.5 py-0.5 rounded-sm font-semibold">
                        Đã xác nhận
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-md border border-gray-200/80 shadow-xs">
                    <div className="text-[11px] font-bold text-gray-900">Lễ hội Mùa Vàng 2026</div>
                    <div className="text-[10px] text-gray-500">Khám phá ruộng bậc thang di sản</div>
                  </div>

                  {/* Thẻ QR Code thu nhỏ trong màn hình */}
                  <div className="bg-[#edfbf7] border border-[#048C73]/20 rounded-md p-2 text-center">
                    <div className="text-[10px] font-bold text-[#048C73]">Quét để cài trên máy thật</div>
                    <div className="w-20 h-20 mx-auto my-1 bg-white p-1 rounded-sm border border-gray-200">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentUrl)}`}
                        alt="QR Code Cài App"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[9px] text-gray-500 truncate">{currentUrl}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. So sánh Trải Nghiệm: App vs Web thông thường */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200/80 p-5 sm:p-8">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900">
              Vì Sao Nên Cài Đặt Đi Du Lịch App?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Khác biệt hoàn toàn so với việc lướt web trên trình duyệt
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-[#F6FAF8] border border-[#048C73]/20 space-y-2">
              <div className="w-8 h-8 rounded-md bg-[#048C73]/10 text-[#048C73] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Khởi động siêu tốc</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                App đã được lưu sẵn trong bộ nhớ đệm thiết bị, mở lên ngay tức thì không độ trễ, không cần gõ URL.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#F6FAF8] border border-[#048C73]/20 space-y-2">
              <div className="w-8 h-8 rounded-md bg-[#048C73]/10 text-[#048C73] flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-[#048C73]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Giao diện toàn màn hình</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Không bị che khuất bởi thanh công cụ trình duyệt hay tab rườm rà. Thao tác mượt mà như app gốc.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#F6FAF8] border border-[#048C73]/20 space-y-2">
              <div className="w-8 h-8 rounded-md bg-[#048C73]/10 text-[#048C73] flex items-center justify-center">
                <BellRing className="w-4 h-4 text-[#EA580C]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Thông báo đặt phòng tức thì</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Nhận cảnh báo trực tiếp trên màn hình khóa khi homestay xác nhận giữ chỗ hoặc có tin nhắn hỗ trợ khẩn cấp.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#F6FAF8] border border-[#048C73]/20 space-y-2">
              <div className="w-8 h-8 rounded-md bg-[#048C73]/10 text-[#048C73] flex items-center justify-center">
                <WifiOff className="w-4 h-4 text-[#10B981]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Truy cập khi mất sóng</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Đi vùng cao hoặc rừng sâu không có 4G? Bạn vẫn mở được thông tin đặt chỗ và số điện thoại chủ nhà.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Chi Tiết Hướng Dẫn Cài Đặt Theo Từng Nền Tảng */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200/80 p-5 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold font-display text-gray-900 text-center mb-6">
            Hướng Dẫn Cài Đặt Chi Tiết
          </h2>

          {/* Tab chọn hệ điều hành */}
          <div className="flex border-b border-gray-200 justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveOsTab('ios')}
              className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeOsTab === 'ios'
                  ? 'border-[#048C73] text-[#048C73]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Apple iOS (iPhone / iPad)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOsTab('android')}
              className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeOsTab === 'android'
                  ? 'border-[#048C73] text-[#048C73]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (Samsung, Xiaomi, Oppo...)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOsTab('desktop')}
              className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeOsTab === 'desktop'
                  ? 'border-[#048C73] text-[#048C73]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Máy tính PC / Laptop (Windows, Mac)</span>
            </button>
          </div>

          {/* Nội dung theo OS Tab */}
          {activeOsTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md text-xs text-amber-900">
                <strong>Lưu ý quan trọng cho iPhone:</strong> Vui lòng mở trang này bằng trình duyệt mặc định <strong>Safari</strong> (nếu đang ở Chrome trên iOS, copy link và mở bằng Safari).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Bấm nút Chia Sẻ</h4>
                  <p className="text-xs text-gray-600">
                    Nhấn vào biểu tượng <strong>Chia sẻ (Share ⎋)</strong> ở thanh công cụ đáy trình duyệt Safari.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Chọn Màn hình chính</h4>
                  <p className="text-xs text-gray-600">
                    Cuộn xuống danh sách tùy chọn và nhấn vào dòng <strong>"Thêm vào MH chính" (Add to Home Screen ⊕)</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Xác nhận Thêm</h4>
                  <p className="text-xs text-gray-600">
                    Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải. Biểu tượng Đi Du Lịch sẽ xuất hiện ngay trên màn hình.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeOsTab === 'android' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Mở Menu Trình Duyệt</h4>
                  <p className="text-xs text-gray-600">
                    Trên Chrome, Cốc Cốc hoặc Samsung Internet, nhấn vào <strong>dấu 3 chấm ⋮</strong> ở góc phải trên.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Chọn Cài đặt ứng dụng</h4>
                  <p className="text-xs text-gray-600">
                    Chọn dòng <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Hoàn tất</h4>
                  <p className="text-xs text-gray-600">
                    Hệ điều hành Android sẽ tự động tải icon và tạo ứng dụng độc lập trong App Drawer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeOsTab === 'desktop' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Nhìn vào thanh URL</h4>
                  <p className="text-xs text-gray-600">
                    Ở góc phải thanh địa chỉ web của Google Chrome hoặc Edge sẽ có biểu tượng <strong>Cài đặt (Install)</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Bấm Cài Đặt</h4>
                  <p className="text-xs text-gray-600">
                    Nhấp vào biểu tượng máy tính và chọn <strong>"Cài đặt Đi Du Lịch"</strong> trong thông báo xác nhận.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-2">
                  <div className="w-7 h-7 rounded-md bg-[#048C73] text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Mở từ Desktop</h4>
                  <p className="text-xs text-gray-600">
                    Shortcut ứng dụng sẽ xuất hiện trên Desktop và Start Menu (Windows) hoặc Dock (macOS).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chia sẻ liên kết */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Share2 className="w-4 h-4 text-[#048C73]" />
              <span>Gửi đường dẫn tải app cho bạn bè hoặc du khách:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="bg-gray-50 border border-gray-300 text-xs text-gray-700 px-3 py-1.5 rounded-md w-full sm:w-64 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#048C73] text-white text-xs font-bold hover:bg-[#03705C] transition-colors shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dành cho Developer & Kỹ Thuật Viên: Đóng gói Android APK */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200/80 p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#EA580C]" />
                <h3 className="text-base sm:text-lg font-bold font-display text-gray-900">
                  Dành Cho Nhà Phát Triển & Quản Trị: Xuất Bản File Android APK
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                Nếu bạn cần xuất file APK độc lập để tải lên Google Play Store hoặc cài đặt qua file `.apk`, bạn có thể sử dụng Capacitor Mobile CLI:
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCli}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors shrink-0 cursor-pointer"
            >
              {copiedCli ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCli ? 'Đã sao chép lệnh' : 'Sao chép lệnh CLI'}</span>
            </button>
          </div>

          <div className="bg-gray-950 text-emerald-400 p-4 rounded-md font-mono text-xs overflow-x-auto border border-gray-800 leading-relaxed">
            <pre>{capacitorCommands}</pre>
          </div>

          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-md text-xs text-blue-900 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Cách nhanh nhất không cần cài Android Studio:</strong> Bạn có thể truy cập{' '}
              <a 
                href="https://www.pwabuilder.com/" 
                target="_blank" 
                rel="noreferrer"
                className="underline font-bold text-blue-700 hover:text-blue-900"
              >
                PWABuilder.com (của Microsoft)
              </a>
              , nhập tên miền website của bạn, hệ thống sẽ tự động đóng gói file APK Android đã ký chứng chỉ số để tải về trong vòng 60 giây!
            </div>
          </div>
        </div>
      </section>

      {/* PWA Install Modal */}
      <PwaInstallModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

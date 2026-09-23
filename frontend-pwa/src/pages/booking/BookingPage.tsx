import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Mail,
  User,
  Sparkles,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Calendar,
  Users,
  BedDouble,
  Utensils,
  ArrowRight,
  Edit3,
  Star,
  CheckCircle2,
  Banknote,
  Phone
} from 'lucide-react';
import { BookingNavigationState, BookingResponseDto } from '@/types/booking';
import { createBooking } from '@/services/bookingService';
import { Button } from '@/components/ui/button';

// Định dạng ISO YYYY-MM-DD -> 'Thứ 5, 24 thg 9'
function formatISODate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Nhận state từ HomestayDetailPage hoặc fallback dữ liệu mẫu chuẩn theo ảnh
  const navState = location.state as BookingNavigationState | undefined;

  const roomInfo = {
    placeName: navState?.placeName || 'Homestay Bản Mường Sinh Thái',
    placeAddress: navState?.placeAddress || 'Bản Lác, Mai Châu, Hòa Bình',
    placeRating: navState?.placeRating || 4.8,
    placeReviewCount: navState?.placeReviewCount || 128,
    roomName: navState?.roomTypeName || '(1x) Superior Double No View',
    roomCount: navState?.roomCount || 1,
    nights: navState?.nights || 1,
    checkInDateStr: formatISODate(navState?.checkIn ?? '') || 'Thứ 5, 24 thg 9',
    checkInTime: 'Từ 14:00',
    checkOutDateStr: formatISODate(navState?.checkOut ?? '') || 'Thứ 6, 25 thg 9',
    checkOutTime: 'Trước 12:00',
    guestCount: navState?.guestCount || 2,
    bedInfo: navState?.bedInfo || '1 giường cỡ king',
    hasBreakfast: navState?.hasBreakfast ?? false,
    freeCancellation: navState?.freeCancellation ?? true,
    totalRoomsLeft: navState?.totalRoomCount || 2,
    basePrice: navState?.basePrice || 361028,
    taxAndFees: Math.round((navState?.basePrice || 361028) * 0.155),
    originalPrice: navState?.originalPrice || 1306000,
  };

  const totalPrice = roomInfo.basePrice + roomInfo.taxAndFees;

  // Form states - Cho phép khách vãng lai đặt phòng không cần đăng nhập
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [isBookingForSelf, setIsBookingForSelf] = useState(true);

  // Guest info
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [guestName, setGuestName] = useState('');

  // Special requests
  const [specialRequests, setSpecialRequests] = useState<{ [key: string]: boolean }>({
    nonSmoking: false,
    connectingRooms: false,
    highFloor: false,
  });
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Price breakdown accordion
  const [isPriceDetailOpen, setIsPriceDetailOpen] = useState(true);

  const toggleSpecialRequest = (key: string) => {
    setSpecialRequests((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
  };

  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResponseDto | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isPhoneValid = phone.trim().length >= 9;

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    setSubmitError(null);

    if (!fullName.trim()) {
      alert('Vui lòng nhập họ và tên liên hệ.');
      return;
    }
    if (!isPhoneValid) {
      alert('Vui lòng nhập số điện thoại hợp lệ để tiếp tục.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert('Vui lòng nhập email hợp lệ để nhận xác nhận đặt phòng.');
      return;
    }
    if (!navState?.placeId || !navState?.roomTypeId || !navState?.checkIn || !navState?.checkOut) {
      alert('Thiếu thông tin phòng. Vui lòng quay lại và chọn phòng lại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRequests = (Object.entries(specialRequests) as [string, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k);

      const result = await createBooking({
        placeId: navState.placeId,
        roomTypeId: navState.roomTypeId,
        checkIn: navState.checkIn,
        checkOut: navState.checkOut,
        roomCount: roomInfo.roomCount,
        guestCount: roomInfo.guestCount,
        guestName: !isBookingForSelf && guestName.trim() ? guestName.trim() : fullName.trim(),
        guestPhone: `${countryCode}${phone.trim()}`,
        guestEmail: email.trim(),
        guestNote: customNote.trim() || undefined,
        specialRequests: selectedRequests.length > 0 ? selectedRequests : undefined,
      });
      setBookingResult(result);
      setIsBookingSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đặt phòng thất bại. Vui lòng thử lại.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf8] text-[var(--color-ink)] flex flex-col">
      {/* Header: Chỉ thuần túy Logo và Tên theo yêu cầu */}
      <header className="w-full bg-white border-b border-gray-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5 md:gap-3 group">
            <div className="p-2 rounded-md bg-[var(--color-primary)] text-white shadow-xs transition-transform group-hover:scale-105">
              <Compass className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-xl md:text-2xl font-bold font-display leading-none tracking-tight text-[var(--color-ink-deep)]">
              VietJourney
            </span>
          </Link>
        </div>
      </header>

      {/* Nếu thành công, hiển thị toàn màn hình (Booking Result View) */}
      {isBookingSuccess ? (
        <div className="flex-1 bg-gray-50 py-8 md:py-12">
          <div className="max-w-2xl mx-auto px-4 md:px-0 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Header / Trạng thái */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-ink-deep)] mb-2">
                Yêu cầu đặt phòng đã được gửi!
              </h2>
              <p className="text-sm text-[var(--color-muted)] mb-6">
                Chỗ nghỉ đang xử lý yêu cầu của bạn. Vui lòng đợi xác nhận.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Mã đặt chỗ:</span>
                  <span className="font-bold text-gray-900 tracking-wider">{bookingResult?.bookingCode ?? '—'}</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-[var(--color-primary)] ml-1"
                    title="Sao chép mã đặt chỗ"
                    onClick={() => { if (bookingResult?.bookingCode) navigator.clipboard.writeText(bookingResult.bookingCode); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  Chờ xác nhận
                </div>
              </div>
            </div>

            {/* Cảnh báo thời hạn chờ */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                {(() => {
                  const holdHours = bookingResult?.holdExpiresAt
                    ? Math.max(1, Math.round((new Date(bookingResult.holdExpiresAt).getTime() - Date.now()) / 3_600_000))
                    : 12;
                  return (
                    <>
                      <h4 className="text-sm font-bold text-blue-900">Thời hạn chờ xác nhận: {holdHours} giờ</h4>
                      <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                        Yêu cầu đặt phòng sẽ tự động bị hủy nếu chỗ nghỉ không phản hồi trong vòng {holdHours} giờ tới. Chúng tôi sẽ gửi email thông báo ngay khi có kết quả.
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Banner Chính sách hủy phòng nổi bật */}
            {(() => {
              const policy = bookingResult?.policySnapshot as Record<string, string | number> | undefined;
              const policyName = typeof policy?.policyName === 'string' ? policy.policyName : 'Miễn phí hủy phòng';
              const cutoffHours = typeof policy?.freeCancelCutoffHours === 'number' ? policy.freeCancelCutoffHours : 24;
              const policyDesc = typeof policy?.description === 'string'
                ? policy.description
                : `Miễn phí hủy phòng trước ${cutoffHours} giờ nhận phòng.`;
              return (
                <div className="bg-emerald-50/90 border-2 border-emerald-500/80 rounded-lg p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm md:text-base font-bold text-emerald-900">
                          Chính sách hủy phòng: {policyName}
                        </h4>
                        <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          Linh hoạt
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-emerald-800 mt-1 leading-relaxed">
                        {policyDesc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Thông tin snapshot */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-lg text-[var(--color-ink-deep)]">Chi tiết đặt phòng</h3>
              </div>
              
              <div className="p-5 space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-gray-500">Chỗ nghỉ</div>
                  <div className="col-span-2 font-semibold text-gray-900">{roomInfo.placeName}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-gray-500">Phòng</div>
                  <div className="col-span-2 font-medium text-gray-800">{roomInfo.roomName}</div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-gray-500">Thời gian</div>
                  <div className="col-span-2 font-medium text-gray-800">
                    {roomInfo.checkInDateStr} <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" /> {roomInfo.checkOutDateStr}
                  </div>
                </div>

                {/* Thông tin liên hệ & người đặt phòng */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-gray-500">Người đặt phòng</div>
                  <div className="col-span-2 space-y-1">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span>{fullName || 'Chưa nhập họ tên'}</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      <span>{email || 'Chưa nhập email'}</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      <span>{countryCode} {phone || 'Chưa nhập số điện thoại'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-gray-500">Khách lưu trú</div>
                  <div className="col-span-2 font-medium text-gray-800">
                    {guestName || fullName || 'Khách lưu trú'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-gray-500">Chính sách hủy</div>
                  <div className="col-span-2 text-gray-800">
                    {(() => {
                      const policy = bookingResult?.policySnapshot as Record<string, string | number> | undefined;
                      const policyName = typeof policy?.policyName === 'string' ? policy.policyName : 'Miễn phí hủy phòng';
                      const cutoffHours = typeof policy?.freeCancelCutoffHours === 'number' ? policy.freeCancelCutoffHours : 24;
                      return (
                        <>
                          <span className="font-semibold text-emerald-700">{policyName}</span>
                          <span className="text-gray-600 block text-xs mt-0.5">
                            Hủy miễn phí trước {cutoffHours} giờ nhận phòng ({roomInfo.checkInDateStr}). Sau thời gian này, phí hủy áp dụng theo quy định của chỗ nghỉ.
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-gray-500">Thanh toán (tại chỗ nghỉ)</div>
                  <div className="col-span-2">
                    <div className="font-bold text-lg text-[var(--color-coral)]">
                      {new Intl.NumberFormat('vi-VN').format(totalPrice)} VND
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Không thanh toán trước · Thanh toán tiền mặt hoặc QR khi nhận phòng
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1 py-6 bg-white border-gray-300 text-gray-700 font-semibold rounded-md shadow-sm hover:bg-gray-50 transition-colors"
              >
                Về trang chủ
              </Button>
              <Button
                onClick={() => navigate('/')} 
                className="flex-1 py-6 bg-[var(--color-primary)] hover:bg-[#03725e] text-white font-bold rounded-md shadow-sm transition-colors"
              >
                Theo dõi đặt phòng
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <main className="flex-1 py-6 md:py-8">
          <div className="max-w-[1180px] mx-auto px-4 md:px-6">

            {/* Nút quay lại & Tiêu đề trang */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate(-1)}
                type="button"
                className="text-xs md:text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors cursor-pointer"
              >
                ← Quay lại chi tiết chỗ nghỉ
              </button>
              <span className="text-xs text-[var(--color-muted)] font-medium">
                Bước 1: Điền thông tin đặt chỗ
              </span>
            </div>

            {/* TÊN VÀ ĐÁNH GIÁ SAO (Không cần panel, hiển thị tự nhiên theo mẫu) */}
            <div className="mb-5">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-ink-deep)] leading-tight mb-1.5">
                {roomInfo.placeName}
              </h1>
              <div className="flex items-center gap-1.5 text-xs md:text-sm">
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <span className="font-bold text-[#0284c7] ml-0.5">
                  {roomInfo.placeRating > 5 ? `${roomInfo.placeRating}/10` : `${(roomInfo.placeRating * 2).toFixed(1)}/10`}
                </span>
                <span className="text-gray-400 font-bold">·</span>
                <span className="text-gray-500 font-medium">({roomInfo.placeReviewCount} đánh giá)</span>
              </div>
            </div>

            {/* Grid 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* ================= CỘT TRÁI: FORM ĐIỀN THÔNG TIN ================= */}
              <div className="lg:col-span-7 space-y-6">

                {/* Khối 1: Liên hệ đặt chỗ */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-5">
                    <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Liên hệ đặt chỗ</h2>
                      <p className="text-xs md:text-sm text-[var(--color-muted)] mt-0.5">
                        Thêm liên hệ để nhận xác nhận đặt chỗ.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Họ tên */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Họ tên<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (isBookingForSelf) {
                            setGuestName(e.target.value);
                          }
                        }}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors outline-none"
                        placeholder="Nhập họ và tên đầy đủ"
                      />
                      <span className="text-[11px] text-[var(--color-muted)] mt-1 block">
                        Người Việt: nhập Tên đệm + Tên chính + Họ. Người nước ngoài: nhập Tên + Họ.
                      </span>
                    </div>

                    {/* SĐT + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Điện thoại di động<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="h-11 pl-2.5 pr-7 text-sm font-semibold bg-gray-50 border border-gray-300 rounded-md appearance-none cursor-pointer focus:border-[var(--color-primary)] outline-none"
                            >
                              <option value="+84">+84</option>
                              <option value="+1">+1</option>
                              <option value="+82">+82</option>
                              <option value="+81">+81</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-4 pointer-events-none" />
                          </div>
                          <div className="flex-1">
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              onBlur={handlePhoneBlur}
                              className={`w-full h-11 px-3.5 text-sm bg-white border rounded-md transition-colors outline-none ${phoneTouched && !isPhoneValid
                                  ? 'border-red-500 bg-red-50/20 focus:border-red-500'
                                  : 'border-gray-300 focus:border-[var(--color-primary)]'
                                }`}
                              placeholder="Nhập số điện thoại"
                            />
                          </div>
                        </div>
                        {phoneTouched && !isPhoneValid && (
                          <span className="text-[11px] font-medium text-red-500 mt-1 block">
                            Điện thoại di động là phần bắt buộc
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Email<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-11 px-3.5 text-sm bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors outline-none"
                          placeholder="VD: email@example.com"
                        />
                        <span className="text-[11px] text-[var(--color-muted)] mt-1 block">
                          VD: email@example.com
                        </span>
                      </div>
                    </div>

                    {/* Checkbox tôi đặt chỗ cho chính mình */}
                    <div className="pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isBookingForSelf}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIsBookingForSelf(val);
                            if (val) {
                              setGuestName(fullName);
                              setIsEditingGuest(false);
                            }
                          }}
                          className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded-sm focus:ring-[var(--color-primary)] accent-[var(--color-primary)]"
                        />
                        <span className="text-sm font-medium text-gray-800">
                          Tôi đặt chỗ cho chính mình
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Khối 2: Thông tin Khách hàng */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-4">
                    <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Thông tin Khách hàng</h2>
                      <p className="text-xs md:text-sm text-[var(--color-muted)] mt-0.5">
                        Vui lòng điền đầy đủ các thông tin để nhận xác nhận đơn hàng
                      </p>
                    </div>
                  </div>

                  {isEditingGuest ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Họ tên khách lưu trú<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full h-11 px-3.5 text-sm bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-md"
                          onClick={() => setIsEditingGuest(false)}
                        >
                          Xong
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-md border border-gray-100">
                      <span className="font-semibold text-gray-800 text-sm">
                        {guestName || fullName || 'Chưa nhập tên khách'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingGuest(true)}
                        className="flex items-center gap-1 text-sm font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                      </button>
                    </div>
                  )}
                </div>

                {/* Khối 3: Yêu cầu đặc biệt */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Yêu cầu đặc biệt</h2>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-muted)] mb-4 leading-relaxed">
                    Tất cả các yêu cầu đặc biệt tùy thuộc vào tình trạng sẵn có và không được đảm bảo. Nhận phòng sớm hoặc đưa đón sân bay có thể phát sinh thêm phí. Vui lòng liên hệ trực tiếp với nhân viên khách sạn để biết thêm thông tin.
                  </p>

                  {/* Các nút / checkbox yêu cầu */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => toggleSpecialRequest('nonSmoking')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${specialRequests.nonSmoking
                          ? 'bg-[#edfbf7] border-[var(--color-primary)] text-[var(--color-primary)] shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${specialRequests.nonSmoking
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                            : 'border-gray-400 bg-white'
                          }`}
                      >
                        {specialRequests.nonSmoking && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      Phòng không hút thuốc
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSpecialRequest('connectingRooms')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${specialRequests.connectingRooms
                          ? 'bg-[#edfbf7] border-[var(--color-primary)] text-[var(--color-primary)] shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${specialRequests.connectingRooms
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                            : 'border-gray-400 bg-white'
                          }`}
                      >
                        {specialRequests.connectingRooms && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      Phòng liên thông
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSpecialRequest('highFloor')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${specialRequests.highFloor
                          ? 'bg-[#edfbf7] border-[var(--color-primary)] text-[var(--color-primary)] shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${specialRequests.highFloor
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                            : 'border-gray-400 bg-white'
                          }`}
                      >
                        {specialRequests.highFloor && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      Tầng lầu
                    </button>
                  </div>

                  {showAllRequests && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Ghi chú yêu cầu khác
                      </label>
                      <textarea
                        rows={2}
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Ví dụ: Giờ dự kiến đến chỗ nghỉ, yêu cầu thêm gối hoặc chăn..."
                        className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAllRequests(!showAllRequests)}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer inline-block mt-1"
                  >
                    {showAllRequests ? 'Thu gọn' : 'Đọc tất cả'}
                  </button>
                </div>

                {/* Khối 4: Chính sách Chỗ ở */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Chính sách Chỗ ở</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllPolicies(!showAllPolicies)}
                      className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                    >
                      {showAllPolicies ? 'Thu gọn' : 'Đọc tất cả'}
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed">
                    {/* Chính sách Thanh toán tại chỗ nghỉ */}
                    <div className="p-3.5 bg-[#edfbf7] rounded-md border border-[var(--color-primary)]/20 text-[var(--color-ink-deep)]">
                      <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-primary)] mb-1.5">
                        <Banknote className="w-4 h-4" />
                        Chính sách Thanh toán (Pay at Property)
                      </div>
                      <ul className="space-y-1.5 text-xs text-[var(--color-ink)]">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>Không cần thanh toán trước:</strong> Quý khách không cần trả tiền hay nhập thông tin thẻ hôm nay.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>Thanh toán trực tiếp:</strong> Tiền phòng sẽ được thanh toán cho chủ chỗ nghỉ khi làm thủ tục nhận phòng.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>Phương thức linh hoạt:</strong> Tiền mặt hoặc quét mã QR chuyển khoản ngân hàng tại quầy.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Chính sách Hủy phòng nổi bật */}
                    <div className="p-3.5 bg-emerald-50/80 rounded-md border border-emerald-300 text-[var(--color-ink-deep)]">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Chính sách Hủy phòng (Miễn phí hủy linh hoạt)
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                        ✓ <strong>Miễn phí hủy phòng hoàn toàn trước 24 giờ</strong> so với thời gian nhận phòng ({roomInfo.checkInDateStr}).
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Quý khách có thể chủ động hủy hoặc chỉnh sửa ngày lưu trú trực tiếp trên hệ thống mà không phải chịu bất kỳ khoản phí phạt nào trước thời hạn trên.
                      </p>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <FileText className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-800">Quy định nhận/trả phòng & lưu trú:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-[var(--color-muted)]">
                          <li>Nhận phòng từ 14:00, trả phòng trước 12:00 ngày hôm sau.</li>
                          <li>Khách vui lòng xuất trình CMND/CCCD hoặc Hộ chiếu khi làm thủ tục nhận phòng.</li>
                          {showAllPolicies && (
                            <>
                              <li>Không cho phép mang thú cưng vào khuôn viên phòng nghỉ.</li>
                              <li>Không tổ chức tiệc tùng, sự kiện gây ồn sau 22:00.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ================= CỘT PHẢI: STICKY SIDEBAR TÓM TẮT & GIÁ ================= */}
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">

                {/* Thẻ tóm tắt thông tin phòng */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                  <div className="p-5">
                    {/* Tên phòng & số lượng còn lại */}
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-[var(--color-ink-deep)] leading-snug">
                        {roomInfo.roomName}
                      </h3>
                      <div className="text-xs font-bold text-red-600 mt-1">
                        Chỉ còn {roomInfo.totalRoomsLeft} phòng
                      </div>
                    </div>

                    {/* Hộp lịch Nhận - Trả phòng */}
                    <div className="bg-[#f8faf9] border border-gray-200/80 rounded-md p-3 mb-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-gray-500 font-medium">Nhận phòng</div>
                        <div className="font-bold text-gray-800 mt-0.5">{roomInfo.checkInDateStr}</div>
                        <div className="text-gray-400 text-[11px]">{roomInfo.checkInTime}</div>
                      </div>

                      <div className="text-center px-2">
                        <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-sm border border-gray-200 shadow-2xs inline-flex items-center gap-1">
                          {roomInfo.nights} đêm <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-gray-500 font-medium">Trả phòng</div>
                        <div className="font-bold text-gray-800 mt-0.5">{roomInfo.checkOutDateStr}</div>
                        <div className="text-gray-400 text-[11px]">{roomInfo.checkOutTime}</div>
                      </div>
                    </div>

                    {/* Tiện ích cơ bản của phòng */}
                    <div className="space-y-2 text-xs text-gray-700 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{roomInfo.guestCount} khách</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <BedDouble className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{roomInfo.bedInfo}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{roomInfo.hasBreakfast ? 'Bao gồm bữa sáng miễn phí' : 'Không bao gồm bữa sáng'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {roomInfo.freeCancellation 
                            ? 'Miễn phí hủy phòng trước 24 giờ nhận phòng'
                            : 'Không hoàn tiền nếu hủy phòng'
                          }
                        </span>
                        <Info className="w-3 h-3 text-gray-400 shrink-0 cursor-pointer" />
                      </div>

                      <div className="flex items-center gap-2 text-emerald-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Có thể đổi lịch</span>
                        <Info className="w-3 h-3 text-gray-400 shrink-0 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thẻ Chi tiết giá & Nút Xác nhận đặt phòng */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5">
                  {/* Tiêu đề Chi tiết giá + Accordion */}
                  <div
                    onClick={() => setIsPriceDetailOpen(!isPriceDetailOpen)}
                    className="flex items-center justify-between cursor-pointer select-none pb-3 border-b border-gray-100 mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                      <h3 className="font-bold text-base text-[var(--color-ink-deep)]">Chi tiết giá</h3>
                    </div>
                    {isPriceDetailOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  {isPriceDetailOpen && (
                    <div className="space-y-2.5 text-xs text-gray-600 mb-4 animate-in fade-in duration-150">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-gray-800 font-medium">Giá phòng</span>
                          <div className="text-[11px] text-[var(--color-muted)]">
                            {roomInfo.roomName} ({roomInfo.nights} đêm)
                          </div>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {new Intl.NumberFormat('vi-VN').format(roomInfo.basePrice)} VND
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 font-medium">Thuế và phí</span>
                        <span className="font-semibold text-gray-800">
                          {new Intl.NumberFormat('vi-VN').format(roomInfo.taxAndFees)} VND
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hàng Tổng cộng & Phân tách thanh toán rõ ràng */}
                  <div className="pt-3 border-t border-gray-200/80 mb-4">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="font-bold text-sm text-[var(--color-ink-deep)]">Tổng chi phí</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {roomInfo.roomCount} phòng, {roomInfo.nights} đêm
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 line-through">
                          {new Intl.NumberFormat('vi-VN').format(roomInfo.originalPrice)} VND
                        </div>
                        <div className="text-xl md:text-2xl font-black text-[var(--color-coral)] leading-tight">
                          {new Intl.NumberFormat('vi-VN').format(totalPrice)} VND
                        </div>
                      </div>
                    </div>

                    {/* Bóc tách thanh toán hôm nay vs khi nhận phòng */}
                    <div className="p-3 bg-[#f0fdf4] rounded-md border border-emerald-200 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-emerald-800 font-bold">
                        <span>Thanh toán hôm nay:</span>
                        <span className="text-sm text-emerald-600">0 VND</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-700 font-medium">
                        <span>Thanh toán tại chỗ nghỉ:</span>
                        <span className="font-bold text-gray-900">{new Intl.NumberFormat('vi-VN').format(totalPrice)} VND</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 italic">
                        * Bạn sẽ thanh toán khi làm thủ tục nhận phòng
                      </div>
                    </div>
                  </div>

                  {/* Nút Xác nhận đặt phòng CTA */}
                  {submitError && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700 font-medium">
                      <Info className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{submitError}</span>
                    </div>
                  )}
                  <Button
                    onClick={handleSubmitBooking}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[var(--color-primary)] hover:bg-[#03725e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span className="text-base">Đang xử lý…</span>
                      </>
                    ) : (
                      <span className="text-base">Xác nhận đặt phòng</span>
                    )}
                  </Button>

                  {/* Disclaimer */}
                  <p className="text-[11px] text-[var(--color-muted)] mt-3 leading-normal text-center">
                    Bằng cách nhấn Xác nhận đặt phòng, bạn đã đồng ý với{' '}
                    <a href="#terms" className="text-gray-700 underline font-medium">Điều khoản đặt phòng</a>{' '}
                    và{' '}
                    <a href="#privacy" className="text-gray-700 underline font-medium">Chính sách lưu trú</a>.
                    Bạn không cần trả trước khoản nào hôm nay.
                  </p>

                  {/* Huy hiệu điểm thưởng */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center gap-2 text-xs text-amber-700 font-semibold bg-[#fffbeb] p-2.5 rounded-md border border-[#fde68a]">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                    <span>Kiếm 500.385 Sao Priority</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      )}

    </div>
  );
}

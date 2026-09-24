import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Star,
  FileText,
  ShieldCheck,
  CreditCard,
  BedDouble,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { getBookingByCode, fetchBookingReview } from '@/services/bookingService';
import type { BookingResponseDto, BookingStatus } from '@/types/booking';
import type { ReviewDto } from '@/types/review';
import BookingReviewModal from '@/components/booking/BookingReviewModal';

export default function UserBookingDetailPage() {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingResponseDto | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal đánh giá
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const loadBookingData = async () => {
    if (!bookingCode) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getBookingByCode(bookingCode);
      setBooking(data);

      // Nếu đơn đã hoàn thành, kiểm tra xem đã có đánh giá chưa
      if (data.status === 'COMPLETED') {
        try {
          const rev = await fetchBookingReview(bookingCode);
          setExistingReview(rev);
        } catch {
          // ignore review check error
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin đặt phòng.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookingData();
  }, [bookingCode]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Đã xác nhận đặt chỗ thành công!</span>
              <p className="text-xs text-emerald-700 font-normal mt-0.5">
                Homestay đã sẵn sàng đón tiếp quý khách đúng vào ngày nhận phòng.
              </p>
            </div>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="flex items-center gap-2 p-3 bg-[#E6F4F1] border border-[#048C73]/20 rounded-md text-[var(--color-primary)] text-xs sm:text-sm font-semibold">
            <Sparkles className="w-5 h-5 text-[var(--color-sun)] shrink-0" />
            <div>
              <span className="font-bold">Kỳ nghỉ đã hoàn thành!</span>
              <p className="text-xs text-slate-600 font-normal mt-0.5">
                Cảm ơn bạn đã lựa chọn trải nghiệm du lịch cộng đồng cùng chúng tôi.
              </p>
            </div>
          </div>
        );
      case 'AWAITING_PAYMENT':
        return (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs sm:text-sm font-semibold">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Đang chờ hoàn tất thanh toán</span>
              <p className="text-xs text-amber-700 font-normal mt-0.5">
                Vui lòng thanh toán theo hướng dẫn để đảm bảo phòng không bị hủy tự động.
              </p>
            </div>
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-200 rounded-md text-sky-800 text-xs sm:text-sm font-semibold">
            <Clock className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <span className="font-bold">Đang chờ chủ nhà xác nhận</span>
              <p className="text-xs text-sky-700 font-normal mt-0.5">
                Homestay đang kiểm tra tình trạng phòng còn trống và sẽ phản hồi sớm.
              </p>
            </div>
          </div>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs sm:text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Đơn đặt phòng đã bị hủy / từ chối</span>
              <p className="text-xs text-rose-700 font-normal mt-0.5">
                Phòng đã được nhả lại trên hệ thống. Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 border border-gray-200 rounded-md text-gray-700 text-xs sm:text-sm">
            <Info className="w-5 h-5 shrink-0" />
            <span>Trạng thái đơn: <strong>{status}</strong></span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6FAF8] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Đang tải chi tiết đơn đặt phòng...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !booking) {
    return (
      <div className="min-h-screen bg-[#F6FAF8] flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Không tìm thấy đơn đặt phòng</h2>
          <p className="text-xs text-gray-500">{errorMsg || 'Mã đơn không tồn tại hoặc đã bị xóa.'}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="px-4 py-2 text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[#03705C] rounded-md transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh sách đơn</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = booking.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-[#F6FAF8] pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Danh sách đặt phòng</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Mã booking:</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-sm">
              #{booking.bookingCode}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner trạng thái booking */}
        {getStatusBadge(booking.status)}

        {/* Khối đánh giá nếu hoàn thành */}
        {isCompleted && (
          <div className="bg-white rounded-lg border border-gray-200/90 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[var(--color-sun)] fill-[var(--color-sun)]" />
                  <h3 className="text-base font-bold text-slate-800">
                    {existingReview ? 'Đánh giá của bạn về chuyến đi' : 'Bạn thấy chuyến đi thế nào?'}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {existingReview
                    ? 'Cảm ơn bạn đã để lại phản hồi quý giá giúp hoàn thiện hệ thống du lịch bản địa.'
                    : 'Hãy chia sẻ cảm nhận về dịch vụ và không gian homestay để các du khách khác tham khảo.'}
                </p>
              </div>

              {!existingReview ? (
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-5 py-2.5 rounded-md bg-[var(--color-sun)] hover:bg-[#d97706] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-500/20 active:translate-y-0.5 cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Viết đánh giá ngay</span>
                </button>
              ) : null}
            </div>

            {/* Hiển thị nội dung review đã gửi */}
            {existingReview && (
              <div className="mt-4 pt-4 border-t border-gray-100 bg-[#F6FAF8] p-4 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= existingReview.rating
                            ? 'text-[var(--color-sun)] fill-[var(--color-sun)]'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1.5">
                      {existingReview.rating}/5 sao
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(existingReview.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                  "{existingReview.content}"
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái 2 phần: Thông tin Homestay & Chi tiết đặt phòng */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Homestay */}
            <div className="bg-white rounded-lg border border-gray-200/90 overflow-hidden shadow-xs">
              <div className="p-5 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-44 h-36 rounded-md overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={
                      booking.coverImageUrl ||
                      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={booking.placeName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    Chỗ nghỉ homestay
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                    {booking.placeName}
                  </h2>
                  <div className="flex items-start gap-1.5 text-xs text-gray-500">
                    <MapPin className="w-4 h-4 text-[var(--color-secondary)] shrink-0 mt-0.5" />
                    <span>{booking.placeAddress}</span>
                  </div>
                  <div className="pt-2">
                    <Link
                      to={`/homestays/${booking.placeId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
                    >
                      <span>Xem trang giới thiệu homestay</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin phòng & ngày lưu trú */}
            <div className="bg-white rounded-lg border border-gray-200/90 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <BedDouble className="w-4 h-4 text-[var(--color-primary)]" />
                Thông tin lưu trú
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#F6FAF8] rounded-md border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Nhận phòng (Check-in)</span>
                  <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>{booking.checkIn}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">Từ 14:00</span>
                </div>

                <div className="p-3 bg-[#F6FAF8] rounded-md border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Trả phòng (Check-out)</span>
                  <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[var(--color-coral)]" />
                    <span>{booking.checkOut}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">Trước 12:00</span>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Hạng phòng:</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{booking.roomTypeName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Thời gian ở:</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{booking.nights} đêm</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Số lượng & Khách:</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {booking.roomCount} phòng • {booking.guestCount} người
                  </span>
                </div>
              </div>

              {/* Dịch vụ đi kèm */}
              {booking.serviceItems && booking.serviceItems.length > 0 && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Dịch vụ & Tiện ích đi kèm:</span>
                  <div className="space-y-1.5">
                    {booking.serviceItems.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{s.serviceName}</span>
                        {s.note && <span className="text-gray-400 text-[11px]">({s.note})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Thông tin khách hàng & Ghi chú */}
            <div className="bg-white rounded-lg border border-gray-200/90 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <User className="w-4 h-4 text-[var(--color-primary)]" />
                Thông tin người liên hệ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-400 block">Họ và tên khách:</span>
                  <div className="font-bold text-slate-800 text-sm">{booking.guestName}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 block">Số điện thoại:</span>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{booking.guestPhone}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 block">Email:</span>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{booking.guestEmail || 'Chưa cung cấp'}</span>
                  </div>
                </div>
              </div>

              {booking.guestNote && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">Yêu cầu đặc biệt:</span>
                  <p className="text-xs text-gray-700 bg-slate-50 p-3 rounded-md border border-gray-200/70 italic">
                    "{booking.guestNote}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Chi tiết chi phí & Chính sách */}
          <div className="space-y-6">
            {/* Hóa đơn thanh toán */}
            <div className="bg-white rounded-lg border border-gray-200/90 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
                Tóm tắt chi phí
              </h3>

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Đơn giá phòng / đêm</span>
                  <span className="font-semibold text-slate-800">
                    {Number(booking.unitPrice || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số đêm lưu trú</span>
                  <span className="font-semibold text-slate-800">{booking.nights} đêm</span>
                </div>
                <div className="flex justify-between">
                  <span>Số lượng phòng</span>
                  <span className="font-semibold text-slate-800">{booking.roomCount} phòng</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 text-slate-800">
                  <span>Tiền tệ áp dụng</span>
                  <span className="font-bold uppercase">{booking.currency || 'VND'}</span>
                </div>

                <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-800">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-[var(--color-coral)]">
                    {Number(booking.totalAmount || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-md text-[11px] text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <span>Giá đã bao gồm toàn bộ phí dịch vụ và bảo vệ đặt phòng.</span>
              </div>
            </div>

            {/* Chính sách hủy phòng */}
            <div className="bg-white rounded-lg border border-gray-200/90 p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-400" />
                Chính sách & Quy định
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {booking.policySnapshot?.name ? (
                  <span>
                    Chính sách: <strong>{String(booking.policySnapshot.name)}</strong>
                    {booking.policySnapshot.description && (
                      <span className="block mt-1 text-gray-500">
                        {String(booking.policySnapshot.description)}
                      </span>
                    )}
                  </span>
                ) : (
                  'Miễn phí hủy phòng trước 48h trước ngày nhận phòng. Sau thời gian này sẽ áp dụng phí phạt theo quy định của chỗ nghỉ.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal gửi đánh giá */}
      {isReviewModalOpen && booking && (
        <BookingReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          bookingCode={booking.bookingCode}
          placeName={booking.placeName}
          roomTypeName={booking.roomTypeName}
          onSuccess={(newReview) => {
            setExistingReview(newReview);
            setIsReviewModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

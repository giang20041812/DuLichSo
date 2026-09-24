import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Star,
  ArrowRight,
  Filter,
  Sparkles,
  BedDouble,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { getCurrentCustomer } from '@/services/authService';
import { fetchMyBookings, getUserSavedBookings } from '@/services/bookingService';
import type { BookingResponseDto, BookingStatus } from '@/types/booking';
import BookingReviewModal from '@/components/booking/BookingReviewModal';
import type { ReviewDto } from '@/types/review';

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang hoạt động' },
  { key: 'COMPLETED', label: 'Đã hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy / Từ chối' },
];

export default function UserBookingListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('status') || 'ALL');

  // State cho review modal
  const [reviewBooking, setReviewBooking] = useState<BookingResponseDto | null>(null);
  const [reviewedCodes, setReviewedCodes] = useState<Set<string>>(new Set());

  const currentUser = getCurrentCustomer();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const localBookings = getUserSavedBookings();
      const localCodes = localBookings.map((b) => b.bookingCode);

      const serverBookings = await fetchMyBookings({
        email: currentUser?.email,
        phone: currentUser?.phone,
        codes: localCodes,
      });

      // Hợp nhất dữ liệu tránh trùng lặp
      const map = new Map<string, BookingResponseDto>();
      localBookings.forEach((b) => map.set(b.bookingCode, b));
      serverBookings.forEach((b) => map.set(b.bookingCode, b));

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBookings(combined);
    } catch (err) {
      console.error('Lỗi nạp danh sách đặt phòng:', err);
      setBookings(getUserSavedBookings());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim(), status: selectedFilter });
    } else {
      setSearchParams({ status: selectedFilter });
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Lọc theo tab trạng thái
      if (selectedFilter === 'ACTIVE') {
        const activeStatuses: BookingStatus[] = ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED'];
        if (!activeStatuses.includes(b.status)) return false;
      } else if (selectedFilter === 'COMPLETED') {
        if (b.status !== 'COMPLETED') return false;
      } else if (selectedFilter === 'CANCELLED') {
        const cancelledStatuses: BookingStatus[] = ['CANCELLED', 'REJECTED', 'EXPIRED'];
        if (!cancelledStatuses.includes(b.status)) return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm (mã booking, tên chỗ nghỉ, sđt)
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchCode = b.bookingCode?.toLowerCase().includes(term);
        const matchPlace = b.placeName?.toLowerCase().includes(term);
        const matchPhone = b.guestPhone?.includes(term);
        const matchRoom = b.roomTypeName?.toLowerCase().includes(term);
        if (!matchCode && !matchPlace && !matchPhone && !matchRoom) return false;
      }

      return true;
    });
  }, [bookings, selectedFilter, searchTerm]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-[var(--color-primary-subtle,#E6F4F1)] text-[var(--color-primary)] border border-[#048C73]/20">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-sun)]" /> Hoàn thành
          </span>
        );
      case 'AWAITING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5" /> Đang chờ duyệt
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Đã hủy
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-gray-100 text-gray-700 border border-gray-200">
            <AlertCircle className="w-3.5 h-3.5" /> Bị từ chối
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-gray-100 text-gray-500 border border-gray-200">
            <Clock className="w-3.5 h-3.5" /> Hết hạn giữ chỗ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8] pb-16">
      {/* Banner đầu trang */}
      <div className="bg-gradient-to-r from-[#048C73] to-[#06B6D4] text-white py-8 px-4 sm:px-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" />
                Quản lý hành trình
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
                Chuyến đi & Đơn đặt phòng của tôi
              </h1>
              <p className="text-sm text-emerald-50 mt-1 max-w-xl">
                Theo dõi tình trạng đơn đặt chỗ, tra cứu mã vé phòng homestay bản địa và để lại đánh giá cho những chuyến đi đã hoàn thành.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4">
        {/* Thanh tìm kiếm & Bộ lọc Tab */}
        <div className="bg-white rounded-lg border border-gray-200/90 shadow-md p-4 sm:p-5 mb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập mã đơn (VD: VJ-123456), tên homestay hoặc số điện thoại..."
                className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-[var(--color-primary)] hover:bg-[#03705C] text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm kiếm</span>
            </button>
          </form>

          {/* Tabs bộ lọc */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-400 pr-2 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Bộ lọc:</span>
            </div>
            {STATUS_FILTERS.map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab.key);
                    setSearchParams({ status: tab.key, ...(searchTerm ? { q: searchTerm } : {}) });
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Danh sách các booking */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-gray-500">Đang tải lịch sử đặt phòng...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200/90 p-10 sm:p-14 text-center shadow-xs">
            <div className="w-14 h-14 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {searchTerm ? 'Không tìm thấy đơn đặt phòng phù hợp' : 'Chưa có đơn đặt phòng nào trong danh sách'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              {searchTerm
                ? 'Hãy kiểm tra lại mã booking, số điện thoại hoặc chọn tab trạng thái "Tất cả".'
                : 'Khám phá các homestay cộng đồng độc đáo trên cung đường Tây Bắc và lên kế hoạch trải nghiệm ngay hôm nay!'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilter('ALL');
                    setSearchParams({});
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                >
                  Xóa tìm kiếm
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/homestays')}
                className="px-5 py-2 text-xs font-bold text-white bg-[var(--color-coral)] hover:bg-[#ea580c] rounded-md transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Khám phá Homestay</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const isCompleted = b.status === 'COMPLETED';
              const hasReviewed = reviewedCodes.has(b.bookingCode);

              return (
                <div
                  key={b.bookingCode}
                  className="bg-white rounded-lg border border-gray-200/90 hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4">
                    {/* Ảnh đại diện chỗ nghỉ */}
                    <div className="w-full md:w-48 h-36 md:h-auto rounded-md overflow-hidden bg-slate-100 shrink-0 relative">
                      <img
                        src={
                          b.coverImageUrl ||
                          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={b.placeName}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="font-mono text-[11px] font-bold text-[var(--color-primary)] bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-sm shadow-xs border border-gray-200/70">
                          #{b.bookingCode}
                        </span>
                      </div>
                    </div>

                    {/* Thông tin chính của booking */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(b.status)}
                            <span className="text-[11px] text-gray-400">
                              Đặt ngày: {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 mr-1.5">Tổng tiền:</span>
                            <span className="text-base sm:text-lg font-bold text-[var(--color-coral)]">
                              {Number(b.totalAmount || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-800 hover:text-[var(--color-primary)] transition-colors">
                          {b.placeName}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[var(--color-secondary)] shrink-0" />
                          <span className="line-clamp-1">{b.placeAddress}</span>
                        </div>

                        <div className="mt-2.5 p-2.5 rounded-md bg-[#F6FAF8] border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Hạng phòng</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {b.roomTypeName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Nhận phòng</span>
                            <span className="font-semibold text-slate-800 block">{b.checkIn}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Trả phòng</span>
                            <span className="font-semibold text-slate-800 block">{b.checkOut}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Quy mô</span>
                            <span className="font-semibold text-slate-800 block">
                              {b.nights} đêm • {b.roomCount} phòng
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nút hành động */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          Khách đặt: <span className="font-semibold text-slate-800">{b.guestName}</span> ({b.guestPhone})
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Nút Đánh giá nếu booking đã hoàn thành */}
                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => setReviewBooking(b)}
                              disabled={hasReviewed}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                hasReviewed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                  : 'bg-[var(--color-sun)] hover:bg-[#d97706] text-white active:scale-95'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{hasReviewed ? 'Đã đánh giá' : 'Đánh giá ngay'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/bookings/${b.bookingCode}`)}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-[var(--color-primary)] hover:bg-[#03705C] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết đơn</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal gửi đánh giá */}
      {reviewBooking && (
        <BookingReviewModal
          isOpen={Boolean(reviewBooking)}
          onClose={() => setReviewBooking(null)}
          bookingCode={reviewBooking.bookingCode}
          placeName={reviewBooking.placeName}
          roomTypeName={reviewBooking.roomTypeName}
          onSuccess={(newReview: ReviewDto) => {
            setReviewedCodes((prev) => new Set([...prev, reviewBooking.bookingCode]));
            setReviewBooking(null);
          }}
        />
      )}
    </div>
  );
}

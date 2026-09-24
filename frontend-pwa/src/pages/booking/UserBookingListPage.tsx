import { useState, useEffect, useMemo, useCallback } from 'react';
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
  RotateCcw,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Home,
  Check,
  CreditCard,
  Ban
} from 'lucide-react';
import { getCurrentCustomer } from '@/services/authService';
import {
  fetchMyBookings,
  getUserSavedBookings,
  getReviewedBookingCodes,
  markBookingAsReviewed
} from '@/services/bookingService';
import type { BookingResponseDto, BookingStatus } from '@/types/booking';
import BookingReviewModal from '@/components/booking/BookingReviewModal';
import BookingCancelModal from '@/components/booking/BookingCancelModal';
import type { ReviewDto } from '@/types/review';

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'CHECKED_IN', label: 'Đang lưu trú' },
  { key: 'CHECKED_OUT', label: 'Đã trả phòng' },
  { key: 'COMPLETED', label: 'Đã hoàn thành' },
  { key: 'REFUNDED', label: 'Đã hoàn tiền' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

const ITEMS_PER_PAGE = 4;

export default function UserBookingListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('status') || 'ALL');

  // Filter ngày tháng
  const [dateFilterType, setDateFilterType] = useState<'checkIn' | 'createdAt'>('checkIn');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Đánh giá
  const [reviewBooking, setReviewBooking] = useState<BookingResponseDto | null>(null);
  const [reviewedCodes, setReviewedCodes] = useState<Set<string>>(new Set());

  // Modal Hủy đơn
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingResponseDto | null>(null);

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const currentUser = getCurrentCustomer();

  const loadData = useCallback(async () => {
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
      setReviewedCodes(getReviewedBookingCodes());
    } catch (err) {
      console.error('Lỗi nạp danh sách đặt phòng:', err);
      setBookings(getUserSavedBookings());
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email, currentUser?.phone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tự động ẩn Toast sau 4 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toastMessage]);

  // Reset về trang 1 khi lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, startDate, endDate, dateFilterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim(), status: selectedFilter });
    } else {
      setSearchParams({ status: selectedFilter });
    }
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // Logic lọc dữ liệu
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Lọc theo tab trạng thái
      if (selectedFilter !== 'ALL') {
        if (b.status !== selectedFilter) return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchCode = b.bookingCode?.toLowerCase().includes(term);
        const matchPlace = b.placeName?.toLowerCase().includes(term);
        const matchPhone = b.guestPhone?.includes(term);
        const matchRoom = b.roomTypeName?.toLowerCase().includes(term);
        if (!matchCode && !matchPlace && !matchPhone && !matchRoom) return false;
      }

      // 3. Lọc theo khoảng ngày (startDate - endDate)
      const targetDateStr = dateFilterType === 'checkIn' ? b.checkIn : b.createdAt?.slice(0, 10);
      if (targetDateStr) {
        if (startDate && targetDateStr < startDate) return false;
        if (endDate && targetDateStr > endDate) return false;
      }

      return true;
    });
  }, [bookings, selectedFilter, searchTerm, startDate, endDate, dateFilterType]);

  // Tính toán phân trang
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  // Đếm số lượng booking theo từng trạng thái để hiển thị trên tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: bookings.length };
    for (const b of bookings) {
      counts[b.status] = (counts[b.status] || 0) + 1;
    }
    return counts;
  }, [bookings]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600" /> Đang chờ duyệt
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã xác nhận
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-teal-50 text-teal-700 border border-teal-200">
            <Home className="w-3.5 h-3.5 text-teal-600" /> Đang lưu trú
          </span>
        );
      case 'CHECKED_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Check className="w-3.5 h-3.5 text-indigo-600" /> Đã trả phòng
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-sun)]" /> Hoàn thành
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-purple-50 text-purple-700 border border-purple-200">
            <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Đã hoàn tiền
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Đã hủy
          </span>
        );
      case 'AWAITING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-sm bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
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

  const handleCancelSuccess = (updated: BookingResponseDto) => {
    setBookings((prev) =>
      prev.map((b) => (b.bookingCode === updated.bookingCode ? updated : b))
    );
    setToastMessage({
      type: 'success',
      text: `Đã hủy đơn #${updated.bookingCode} thành công ${
        updated.status === 'REFUNDED' ? 'và hoàn tiền theo chính sách.' : '.'
      }`,
    });
  };

  const handleReviewSuccess = (_newReview: ReviewDto) => {
    if (reviewBooking) {
      markBookingAsReviewed(reviewBooking.bookingCode);
      setReviewedCodes((prev) => new Set([...prev, reviewBooking.bookingCode]));
      setToastMessage({
        type: 'success',
        text: `Đã gửi đánh giá cho homestay "${reviewBooking.placeName}" thành công! Cảm ơn bạn đã đóng góp cho cộng đồng.`,
      });
      setReviewBooking(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8] pb-16">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-white border border-emerald-200 shadow-xl text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header trang tinh tế (thay thế khối banner xanh to) */}
      <div className="bg-white border-b border-gray-200/80 pt-6 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Quản lý lịch trình du lịch</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Đơn đặt phòng & Chuyến đi của tôi
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Theo dõi tình trạng đơn đặt chỗ, tra cứu mã vé phòng, hủy phòng theo chính sách hoặc gửi đánh giá trải nghiệm.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              title="Cập nhật lại danh sách mới nhất"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/homestays')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--color-primary)] hover:bg-[#03705C] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>Đặt phòng mới</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {/* Khối Tìm kiếm & Bộ lọc nâng cao */}
        <div className="bg-white rounded-lg border border-gray-200/90 shadow-xs p-4 sm:p-5 mb-6 space-y-4">
          {/* Hàng 1: Tìm kiếm từ khóa */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã đơn (VD: VJ-782910), tên homestay, hạng phòng, số điện thoại..."
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

          {/* Hàng 2: Bộ lọc ngày tháng (Date Filter) */}
          <div className="p-3 bg-[#F6FAF8] border border-gray-100 rounded-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-slate-700 font-bold shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Lọc theo ngày:</span>
              </div>
              <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setDateFilterType('checkIn')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-sm transition-all cursor-pointer ${
                    dateFilterType === 'checkIn'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-gray-600 hover:text-slate-800'
                  }`}
                >
                  Ngày nhận phòng
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType('createdAt')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-sm transition-all cursor-pointer ${
                    dateFilterType === 'createdAt'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-gray-600 hover:text-slate-800'
                  }`}
                >
                  Ngày đặt đơn
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">Từ:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">Đến:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="px-2.5 py-1.5 rounded-md text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Xóa lọc ngày</span>
                </button>
              )}
            </div>
          </div>

          {/* Hàng 3: Tabs bộ lọc trạng thái */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-400 pr-2 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Trạng thái:</span>
            </div>
            {STATUS_FILTERS.map((tab) => {
              const active = selectedFilter === tab.key;
              const count = statusCounts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab.key);
                    setSearchParams({ status: tab.key, ...(searchTerm ? { q: searchTerm } : {}) });
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
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
              {searchTerm || startDate || endDate || selectedFilter !== 'ALL'
                ? 'Không tìm thấy đơn đặt phòng phù hợp với bộ lọc'
                : 'Chưa có đơn đặt phòng nào trong danh sách'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              {searchTerm || startDate || endDate || selectedFilter !== 'ALL'
                ? 'Hãy thử điều chỉnh lại từ khóa tìm kiếm, khoảng ngày hoặc chọn tab trạng thái "Tất cả".'
                : 'Khám phá các homestay cộng đồng độc đáo trên cung đường Tây Bắc và lên kế hoạch trải nghiệm ngay hôm nay!'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {(searchTerm || startDate || endDate || selectedFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilter('ALL');
                    setStartDate('');
                    setEndDate('');
                    setSearchParams({});
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Xóa tất cả bộ lọc</span>
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
            {paginatedBookings.map((b) => {
              const isCompleted = b.status === 'COMPLETED';
              const canCancel = ['PENDING', 'CONFIRMED', 'AWAITING_PAYMENT'].includes(b.status);
              const hasReviewed = reviewedCodes.has(b.bookingCode);

              return (
                <div
                  key={b.bookingCode}
                  className="bg-white rounded-lg border border-gray-200/90 hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4">
                    {/* Ảnh đại diện chỗ nghỉ */}
                    <div className="w-full md:w-48 h-40 md:h-auto rounded-md overflow-hidden bg-slate-100 shrink-0 relative">
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
                            <span className="font-semibold text-slate-800 block">{b.checkIn} (14h)</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Trả phòng</span>
                            <span className="font-semibold text-slate-800 block">{b.checkOut} (12h)</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Quy mô</span>
                            <span className="font-semibold text-slate-800 block">
                              {b.nights} đêm • {b.roomCount} phòng
                            </span>
                          </div>
                        </div>

                        {/* Ghi chú hoàn tiền / hủy nếu có */}
                        {Boolean(b.policySnapshot?.cancelReason) && (
                          <div className="mt-2 p-2 bg-amber-50/70 border border-amber-200/70 rounded-md text-[11px] text-amber-800">
                            <strong>Lý do hủy:</strong> {String(b.policySnapshot.cancelReason)}
                            {Boolean(b.policySnapshot.refundAmount) && (
                              <span className="ml-2 font-bold text-emerald-700">
                                (Đã hoàn {Number(b.policySnapshot.refundAmount).toLocaleString('vi-VN')} đ)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Nút hành động */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          Khách đặt: <span className="font-semibold text-slate-800">{b.guestName}</span> ({b.guestPhone})
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Nút Hủy đơn theo chính sách (cho đơn PENDING, CONFIRMED, AWAITING_PAYMENT) */}
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancelModalBooking(b)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                              title="Hủy đặt phòng theo chính sách của homestay"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Hủy đơn</span>
                            </button>
                          )}

                          {/* Nút Đánh giá nếu booking đã hoàn thành (COMPLETED) */}
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

                          {/* Nút Xem chi tiết đơn */}
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

            {/* Phân trang (Pagination) */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg border border-gray-200/90 p-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="text-xs text-gray-500">
                  Hiển thị <span className="font-bold text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{' '}
                  <span className="font-bold text-slate-800">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                  </span>{' '}
                  trên tổng số <span className="font-bold text-slate-800">{totalItems}</span> đơn đặt phòng
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    aria-label="Trang tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Modal Hủy đặt phòng theo chính sách */}
      {cancelModalBooking && (
        <BookingCancelModal
          isOpen={Boolean(cancelModalBooking)}
          onClose={() => setCancelModalBooking(null)}
          booking={cancelModalBooking}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

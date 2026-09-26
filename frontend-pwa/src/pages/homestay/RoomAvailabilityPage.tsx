import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Minus,
  Plus,
  AlertTriangle,
  Info,
  ArrowRight,
  Star,
  Users,
  Bed,
  Mountain,
  Bath,
  Loader2,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { getHomestayById } from '@/services/homestayService';
import { checkRoomAvailability } from '@/services/bookingService';
import type { HomestayDetailDto, RoomTypeDto } from '@/types/homestay';
import type { CheckAvailabilityResponse, BookingNavigationState } from '@/types/booking';

interface RoomCheckState {
  checking: boolean;
  status: 'AVAILABLE' | 'NOT_ENOUGH_ROOMS' | 'ERROR';
  available: boolean;
  message?: string;
  minAvailableRooms?: number;
}

export default function RoomAvailabilityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Khởi tạo ngày mặc định: check-in ngày mai, check-out ngày kia
  const defaultCheckIn = useMemo(() => {
    const paramIn = searchParams.get('checkIn');
    if (paramIn && /^\d{4}-\d{2}-\d{2}$/.test(paramIn)) return paramIn;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [searchParams]);

  const defaultCheckOut = useMemo(() => {
    const paramOut = searchParams.get('checkOut');
    if (paramOut && /^\d{4}-\d{2}-\d{2}$/.test(paramOut)) return paramOut;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, [searchParams]);

  const [homestay, setHomestay] = useState<HomestayDetailDto | null>(null);
  const [loadingHomestay, setLoadingHomestay] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [checkInDate, setCheckInDate] = useState<string>(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(defaultCheckOut);
  const [guestsCount, setGuestsCount] = useState<number>(() => {
    const g = Number(searchParams.get('guests'));
    return g > 0 ? g : 2;
  });
  const [roomsCount, setRoomsCount] = useState<number>(() => {
    const r = Number(searchParams.get('rooms'));
    return r > 0 ? r : 1;
  });

  // Tình trạng kiểm tra khả dụng của từng phòng: roomId -> RoomCheckState
  const [roomStatuses, setRoomStatuses] = useState<Record<number, RoomCheckState>>({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  // Tính số đêm lưu trú
  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate + 'T12:00:00');
    const end = new Date(checkOutDate + 'T12:00:00');
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate]);

  // Nạp thông tin Homestay thật từ backend
  useEffect(() => {
    let isMounted = true;
    setLoadingHomestay(true);
    setErrorMessage(null);

    getHomestayById(slug)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setHomestay(data);
        } else {
          setErrorMessage('Không tìm thấy thông tin homestay hoặc homestay đã tạm ngưng hoạt động.');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) setLoadingHomestay(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Kiểm tra phòng trống cho tất cả phòng của homestay
  const checkAllRoomsAvailability = useCallback(async (rooms: RoomTypeDto[], inDate: string, outDate: string, rCount: number) => {
    if (!rooms || rooms.length === 0) return;
    setIsCheckingAll(true);

    const newStatuses: Record<number, RoomCheckState> = {};
    for (const r of rooms) {
      newStatuses[r.id] = { checking: true, status: 'AVAILABLE', available: true };
    }
    setRoomStatuses(newStatuses);

    const results = await Promise.allSettled(
      rooms.map(async (r) => {
        try {
          const res: CheckAvailabilityResponse = await checkRoomAvailability(r.id, inDate, outDate, rCount);
          return {
            roomId: r.id,
            available: res.available,
            status: res.available ? ('AVAILABLE' as const) : ('NOT_ENOUGH_ROOMS' as const),
            message: res.message,
            minAvailableRooms: res.minAvailableRooms
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Không thể kiểm tra';
          return {
            roomId: r.id,
            available: false,
            status: 'ERROR' as const,
            message: msg
          };
        }
      })
    );

    const updated: Record<number, RoomCheckState> = {};
    results.forEach((res, index) => {
      const room = rooms[index];
      if (res.status === 'fulfilled') {
        updated[room.id] = {
          checking: false,
          status: res.value.status,
          available: res.value.available,
          message: res.value.message,
          minAvailableRooms: res.value.minAvailableRooms
        };
      } else {
        updated[room.id] = {
          checking: false,
          status: 'ERROR',
          available: false,
          message: 'Lỗi kiểm tra lịch phòng'
        };
      }
    });

    setRoomStatuses(updated);
    setIsCheckingAll(false);
  }, []);

  // Tự động kiểm tra khi homestay load xong hoặc khi ngày/số phòng thay đổi
  useEffect(() => {
    if (homestay?.rooms && homestay.rooms.length > 0 && checkInDate && checkOutDate) {
      checkAllRoomsAvailability(homestay.rooms, checkInDate, checkOutDate, roomsCount);
    }
  }, [homestay?.rooms, checkInDate, checkOutDate, roomsCount, checkAllRoomsAvailability]);

  // Xử lý chuyển sang trang Đặt phòng
  const handleProceedBooking = (room: RoomTypeDto) => {
    if (!homestay) return;

    const navState: BookingNavigationState = {
      placeId: homestay.id,
      placeName: homestay.name,
      placeAddress: homestay.address,
      placeRating: homestay.ratingAvg,
      placeReviewCount: homestay.ratingCount,
      coverImageUrl: homestay.images?.[0] || '',
      roomTypeId: room.id,
      roomTypeName: room.name,
      basePrice: room.basePrice,
      totalRoomCount: room.totalRoomCount,
      maxOccupancy: room.maxOccupancy,
      bedInfo: room.bedType || 'Giường tiêu chuẩn',
      latitude: homestay.latitude,
      longitude: homestay.longitude,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      guestCount: guestsCount,
      roomCount: roomsCount
    };

    navigate('/booking', { state: navState });
  };

  if (loadingHomestay) {
    return (
      <div className="min-h-screen bg-[#F6FAF8] flex flex-col items-center justify-center gap-3 text-[var(--color-primary)]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-semibold">Đang nạp dữ liệu homestay và hạng phòng...</p>
      </div>
    );
  }

  if (errorMessage || !homestay) {
    return (
      <div className="min-h-screen bg-[#F6FAF8] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-md w-full text-center space-y-3 shadow-xs">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Không tìm thấy Homestay</h2>
          <p className="text-xs text-gray-500">{errorMessage || 'Vui lòng kiểm tra lại đường dẫn.'}</p>
          <button
            type="button"
            onClick={() => navigate('/homestays')}
            className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-md hover:bg-[#03705C] transition-colors cursor-pointer"
          >
            Quay lại danh sách Homestay
          </button>
        </div>
      </div>
    );
  }

  const coverPhoto = homestay.images?.[0] || '';

  return (
    <div className="min-h-screen bg-[#F6FAF8] pb-20 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/homestays/${homestay.id}`)}
            className="flex items-center gap-1.5 text-slate-700 hover:text-[var(--color-primary)] font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Chi tiết Homestay</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] text-[var(--color-primary)] font-extrabold uppercase tracking-wider block">
              TÂY BẮC TRAIL
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block">
              Kiểm Tra Phòng & Giá
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (homestay.rooms) {
                checkAllRoomsAvailability(homestay.rooms, checkInDate, checkOutDate, roomsCount);
              }
            }}
            disabled={isCheckingAll}
            title="Làm mới trạng thái phòng"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingAll ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Compact Homestay Reference Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-3">
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt={homestay.name}
                className="w-16 h-16 rounded-md object-cover shrink-0 border border-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-gray-100 text-slate-400">
                <MapPin className="w-6 h-6 opacity-30" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-[var(--color-primary)] border border-emerald-200 text-[10px] font-bold">
                  Homestay Bản Địa
                </span>
                {Boolean(homestay.ratingAvg) && (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {homestay.ratingAvg}
                    {Boolean(homestay.ratingCount) && (
                      <span className="text-[11px] text-gray-400 font-normal">({homestay.ratingCount})</span>
                    )}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
                {homestay.name}
              </h2>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[var(--color-secondary)] shrink-0" />
                <span>{homestay.address}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stay Criteria Filter Box */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Nhu cầu lưu trú</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {nights} đêm ({checkInDate.split('-').slice(1).reverse().join('/')} - {checkOutDate.split('-').slice(1).reverse().join('/')})
            </span>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-md bg-slate-50 border border-gray-200">
              <label htmlFor="input-check-in" className="text-[10px] font-bold text-gray-400 block uppercase">
                NHẬN PHÒNG
              </label>
              <input
                id="input-check-in"
                type="date"
                value={checkInDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const val = e.target.value;
                  setCheckInDate(val);
                  if (val >= checkOutDate) {
                    const next = new Date(val);
                    next.setDate(next.getDate() + 1);
                    setCheckOutDate(next.toISOString().split('T')[0]);
                  }
                }}
                className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 block">Từ 14:00</span>
            </div>

            <div className="p-2.5 rounded-md bg-slate-50 border border-gray-200">
              <label htmlFor="input-check-out" className="text-[10px] font-bold text-gray-400 block uppercase">
                TRẢ PHÒNG
              </label>
              <input
                id="input-check-out"
                type="date"
                value={checkOutDate}
                min={checkInDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 block">Trước 12:00</span>
            </div>
          </div>

          {/* Guests and Rooms Stepper */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-md bg-sky-50/70 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 block">Số khách</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">{guestsCount} khách</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGuestsCount((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-md bg-white shadow-2xs border border-gray-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setGuestsCount((prev) => Math.min(20, prev + 1))}
                  className="w-6 h-6 rounded-md bg-white shadow-2xs border border-gray-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-sky-50/70 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 block">Số lượng phòng</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">{roomsCount} phòng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRoomsCount((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-md bg-white shadow-2xs border border-gray-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setRoomsCount((prev) => Math.min(10, prev + 1))}
                  className="w-6 h-6 rounded-md bg-white shadow-2xs border border-gray-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isCheckingAll}
            onClick={() => {
              if (homestay.rooms) {
                checkAllRoomsAvailability(homestay.rooms, checkInDate, checkOutDate, roomsCount);
              }
            }}
            className="w-full py-2.5 rounded-md bg-[var(--color-primary)] hover:bg-[#03705C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-70"
          >
            {isCheckingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra phòng trống...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Kiểm tra phòng khả dụng</span>
              </>
            )}
          </button>
        </div>

        {/* Business Rule Notice */}
        <div className="p-3 rounded-md bg-sky-50 border border-sky-200 text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
          <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <p>
            <strong>Lưu ý:</strong> Dữ liệu phòng trống được đối soát theo thời gian thực từ cơ sở dữ liệu lưu trú. Hệ thống giữ chỗ tạm thời khi bạn hoàn tất bước xác nhận thông tin đặt phòng.
          </p>
        </div>

        {/* Room List Section */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Danh sách hạng phòng</h3>
            <span className="text-xs text-slate-500">
              {homestay.rooms?.length || 0} hạng phòng tại homestay
            </span>
          </div>

          {(!homestay.rooms || homestay.rooms.length === 0) ? (
            <div className="p-8 text-center bg-white rounded-lg border border-gray-200 text-gray-500 text-xs sm:text-sm">
              Chưa có thông tin phòng nào được cấu hình cho homestay này.
            </div>
          ) : (
            homestay.rooms.map((room) => {
              const statusInfo = roomStatuses[room.id] || { checking: false, available: true, status: 'AVAILABLE' };
              const isAvailable = statusInfo.available && statusInfo.status === 'AVAILABLE';
              const isExceedCapacity = (room.maxOccupancy * roomsCount) < guestsCount;
              const roomImage = room.images?.[0] || coverPhoto;
              const totalPrice = (room.basePrice || 0) * nights * roomsCount;

              return (
                <div
                  key={room.id}
                  className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                >
                  {/* Room Image with Badge */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                    {roomImage ? (
                      <img src={roomImage} alt={room.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Bed className="w-10 h-10 opacity-30 mb-1" />
                        <span className="text-xs">Chưa có ảnh</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs ${
                          statusInfo.checking
                            ? 'bg-slate-700 text-white'
                            : isAvailable
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-orange-600 text-white'
                        }`}
                      >
                        {statusInfo.checking
                          ? 'Đang kiểm tra...'
                          : isAvailable
                          ? 'ĐÃ CÓ THỂ ĐẶT'
                          : 'KHÔNG ĐỦ PHÒNG'}
                      </span>
                    </div>

                    {Boolean(room.images && room.images.length > 1) && (
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                          {room.images.length} ảnh phòng
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{room.name}</h4>
                      {Boolean(room.description) && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{room.description}</p>
                      )}
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> Tối đa {room.maxOccupancy} khách / phòng
                      </span>
                      {room.bedType ? (
                        <span className="flex items-center gap-1.5">
                          <Bed className="w-3.5 h-3.5 text-slate-400" /> {room.bedType}
                        </span>
                      ) : null}
                      {Boolean(room.areaSqm) && (
                        <span className="flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-slate-400" /> Diện tích: {room.areaSqm} m²
                        </span>
                      )}
                    </div>

                    {/* Capacity Warning */}
                    {isExceedCapacity && (
                      <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          Sức chứa tối đa của {roomsCount} phòng là {room.maxOccupancy * roomsCount} khách. Đoàn của bạn hiện có {guestsCount} khách, vui lòng cân nhắc tăng số phòng.
                        </span>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    {isAvailable && (
                      <div className="p-3 rounded-md bg-[#F6FAF8] border border-gray-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Đơn giá tiêu chuẩn:</span>
                          <span className="font-bold text-slate-800">
                            {Number(room.basePrice || 0).toLocaleString('vi-VN')} đ / đêm
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Quy mô đặt:</span>
                          <span className="font-medium text-slate-700">
                            {nights} đêm × {roomsCount} phòng
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              Tổng tiền tạm tính:
                            </span>
                            <span className="text-[10px] text-gray-500">Đã bao gồm thuế & phí</span>
                          </div>
                          <span className="text-base font-extrabold text-[var(--color-coral)]">
                            {Number(totalPrice).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Not available reason */}
                    {!isAvailable && !statusInfo.checking && (
                      <div className="p-3 rounded-md bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Tình trạng phòng:
                        </div>
                        <p className="leading-relaxed text-[11px] text-slate-700">
                          {statusInfo.message || 'Không đủ phòng trống khả dụng trong khoảng thời gian bạn đã chọn. Vui lòng chọn ngày khác hoặc giảm số lượng phòng.'}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => handleProceedBooking(room)}
                        className="w-full py-2.5 rounded-md bg-[var(--color-coral)] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Tiếp tục đặt phòng</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded-md bg-slate-100 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        Không khả dụng cho kỳ lưu trú này
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

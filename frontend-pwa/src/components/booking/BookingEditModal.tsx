import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  Calendar,
  BedDouble,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Compass,
  Plus,
  Trash2,
  Search,
  Mountain,
  Utensils,
  Bus,
  Check,
  MapPin,
} from 'lucide-react';
import type { BookingResponseDto, UpdateBookingDetailsRequest, BookingServiceItemDto, CheckAvailabilityResponse } from '@/types/booking';
import type { NearbyPlaceDto } from '@/types/homestay';
import { updateBookingDetails, checkRoomAvailability } from '@/services/bookingService';
import { fetchNearbyPlaces } from '@/services/homestayService';
import VietmapView from '@/components/map/VietmapView';
import type { VietmapMarkerItem } from '@/types/integrations/vietmap';

interface BookingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingResponseDto;
  onSuccess: (updatedBooking: BookingResponseDto) => void;
}

export default function BookingEditModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: BookingEditModalProps) {
  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';

  const [guestName, setGuestName] = useState(booking.guestName || '');
  const [guestPhone, setGuestPhone] = useState(booking.guestPhone || '');
  const [guestEmail, setGuestEmail] = useState(booking.guestEmail || '');
  const [guestNote, setGuestNote] = useState(booking.guestNote || '');
  const [checkIn, setCheckIn] = useState(booking.checkIn || '');
  const [checkOut, setCheckOut] = useState(booking.checkOut || '');
  const [roomCount, setRoomCount] = useState<number>(booking.roomCount || 1);
  const [guestCount, setGuestCount] = useState<number>(booking.guestCount || 1);
  const [reason, setReason] = useState('');

  // Quản lý dịch vụ tư vấn
  const [serviceItems, setServiceItems] = useState<BookingServiceItemDto[]>(
    booking.serviceItems ? [...booking.serviceItems] : []
  );

  // Bán kính tìm kiếm (mặc định 10km giống BookingPage)
  const [radius, setRadius] = useState<number>(10);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceDto[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyCategory, setNearbyCategory] = useState<'ALL' | 'ATTRACTION' | 'FOOD' | 'TRANSPORT'>('ALL');

  // Modal xác nhận thêm dịch vụ (ghi chú tùy chọn)
  const [addingPlaceModal, setAddingPlaceModal] = useState<{
    place: NearbyPlaceDto;
    defaultServiceName: string;
    note: string;
  } | null>(null);

  // Modal xem bản đồ vị trí địa điểm
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapTarget, setSelectedMapTarget] = useState<{ lat?: number; lng?: number; zoom?: number } | null>(null);

  // Kiểm tra lịch phòng trống
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<CheckAvailabilityResponse | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load danh sách địa điểm/dịch vụ lân cận homestay theo bán kính radius
  useEffect(() => {
    if (!isOpen || !booking.placeId) return;
    let isMounted = true;
    fetchNearbyPlaces(String(booking.placeId), radius)
      .then((data) => {
        if (isMounted) {
          setNearbyPlaces(data);
          setIsLoadingNearby(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingNearby(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, booking.placeId, radius]);

  // Xử lý dữ liệu khoảng cách hiển thị
  const processedNearbyPlaces = useMemo(() => {
    return nearbyPlaces.map((p) => ({
      ...p,
      displayDistance: typeof p.distance === 'number' ? Math.round(p.distance * 10) / 10 : 0,
    }));
  }, [nearbyPlaces]);

  // Bộ lọc danh mục
  const filteredNearbyPlaces = useMemo(() => {
    if (nearbyCategory === 'ALL') return processedNearbyPlaces;
    if (nearbyCategory === 'ATTRACTION') {
      return processedNearbyPlaces.filter((p) => p.kind === 'ATTRACTION' || p.kind === 'PHOTO');
    }
    if (nearbyCategory === 'FOOD') {
      return processedNearbyPlaces.filter(
        (p) => p.kind === 'FOOD' || p.kind === 'RESTAURANT' || p.kind === 'CUISINE'
      );
    }
    if (nearbyCategory === 'TRANSPORT') {
      return processedNearbyPlaces.filter((p) => p.kind === 'TRANSPORT');
    }
    return processedNearbyPlaces;
  }, [processedNearbyPlaces, nearbyCategory]);

  // Reset kết quả kiểm tra lịch nếu người dùng sửa ngày hoặc số phòng
  const handleDateOrRoomChange = (
    newCheckIn: string,
    newCheckOut: string,
    newRoomCount: number
  ) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
    setRoomCount(newRoomCount);
    setAvailabilityResult(null);
  };

  // Hàm kiểm tra lịch phòng
  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      setErrorMsg('Vui lòng chọn ngày nhận phòng và ngày trả phòng trước khi kiểm tra.');
      return;
    }
    if (checkOut <= checkIn) {
      setErrorMsg('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    setErrorMsg(null);
    setIsCheckingAvailability(true);

    try {
      const result = await checkRoomAvailability(
        booking.roomTypeId,
        checkIn,
        checkOut,
        roomCount,
        booking.bookingCode
      );
      setAvailabilityResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kiểm tra tình trạng phòng.';
      setErrorMsg(msg);
      setAvailabilityResult(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Quản lý toggle hoặc mở modal add dịch vụ quanh đây (giống hệt BookingPage.tsx)
  const handleOpenAddService = (place: NearbyPlaceDto) => {
    const isAlreadyAdded = serviceItems.some(
      (item) =>
        item.serviceCode === `NEARBY_${place.kind}_${place.id}` ||
        (item.serviceName && item.serviceName.includes(place.name))
    );

    if (isAlreadyAdded) {
      // Nếu đã add thì cho phép xóa trực tiếp (Bỏ chọn)
      setServiceItems((prev) =>
        prev.filter(
          (item) =>
            item.serviceCode !== `NEARBY_${place.kind}_${place.id}` &&
            !(item.serviceName && item.serviceName.includes(place.name))
        )
      );
      return;
    }

    let defaultName = `Tư vấn dịch vụ thêm: ${place.name}`;
    const k = (place.kind || '').toUpperCase();
    if (k.includes('TRANSPORT')) {
      defaultName = `Hỗ trợ đưa đón / di chuyển: ${place.name}`;
    } else if (k.includes('FOOD') || k.includes('RESTAURANT') || k.includes('CUISINE')) {
      defaultName = `Hỗ trợ đặt bàn / ẩm thực: ${place.name}`;
    } else if (k.includes('ATTRACTION') || k.includes('PHOTO')) {
      defaultName = `Tư vấn tham quan / trải nghiệm: ${place.name}`;
    } else if (k.includes('RENTAL')) {
      defaultName = `Dịch vụ quanh đây: ${place.name}`;
    }

    setAddingPlaceModal({
      place,
      defaultServiceName: defaultName,
      note: '',
    });
  };

  // Xác nhận thêm dịch vụ từ modal popup
  const handleConfirmAddService = () => {
    if (!addingPlaceModal) return;
    const { place, defaultServiceName, note } = addingPlaceModal;
    const newItem: BookingServiceItemDto = {
      serviceName: defaultServiceName.trim() || `Tư vấn dịch vụ thêm: ${place.name}`,
      serviceCode: `NEARBY_${place.kind}_${place.id}`,
      note: note.trim() || undefined,
      isIncluded: true,
    };
    setServiceItems((prev) => [...prev, newItem]);
    setAddingPlaceModal(null);
  };

  const handleRemoveService = (index: number) => {
    setServiceItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Danh sách markers bản đồ VietMap
  const mapMarkers: VietmapMarkerItem[] = useMemo(() => {
    const list: VietmapMarkerItem[] = [];

    // Marker homestay
    const centerLat = booking.latitude || 21.84912;
    const centerLng = booking.longitude || 104.09245;
    list.push({
      id: 'main-homestay',
      name: booking.placeName,
      latitude: centerLat,
      longitude: centerLng,
      isMain: true,
      address: booking.placeAddress || 'Chỗ nghỉ chính',
      tagText: 'Chỗ nghỉ',
      kind: 'HOMESTAY',
    });

    // Markers nearby places
    filteredNearbyPlaces.forEach((item) => {
      if (item.latitude && item.longitude) {
        list.push({
          id: `nearby-${item.id}`,
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          address: item.address,
          distance: item.displayDistance,
          kind: item.kind,
          tagText: item.kind === 'FOOD' ? 'Ẩm thực' : item.kind === 'TRANSPORT' ? 'Di chuyển' : 'Thắng cảnh',
        });
      }
    });

    return list;
  }, [booking, filteredNearbyPlaces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên khách lưu trú.');
      return;
    }
    if (!guestPhone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (!checkIn || !checkOut) {
      setErrorMsg('Vui lòng chọn ngày nhận phòng và trả phòng.');
      return;
    }
    if (checkOut <= checkIn) {
      setErrorMsg('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    if (roomCount < 1) {
      setErrorMsg('Số lượng phòng phải từ 1 trở lên.');
      return;
    }
    if (guestCount < 1) {
      setErrorMsg('Số lượng khách phải từ 1 trở lên.');
      return;
    }
    if (isConfirmed && !reason.trim()) {
      setErrorMsg('Đơn đã xác nhận: Vui lòng nhập lý do đề xuất thay đổi để gửi cho nhà quản lý duyệt.');
      return;
    }

    // Nếu đã kiểm tra lịch và thấy hết phòng, chặn submit
    if (availabilityResult && !availabilityResult.available) {
      setErrorMsg('Khoảng thời gian này đã hết phòng. Vui lòng kiểm tra và chọn ngày khác trước khi lưu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateBookingDetailsRequest = {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        guestNote: guestNote.trim() || undefined,
        checkIn,
        checkOut,
        roomCount,
        guestCount,
        reason: isConfirmed ? reason.trim() : undefined,
        serviceItems: serviceItems,
      };

      const updated = await updateBookingDetails(booking.bookingCode, payload);
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu thay đổi đặt phòng.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-2 sm:p-4 pt-20 sm:pt-24 pb-8 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[calc(100vh-6.5rem)] flex flex-col shadow-2xl border border-gray-200 overflow-hidden my-auto sm:my-0">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-[var(--color-primary)]" />
              <span>{isPending ? 'Chỉnh sửa chi tiết đặt phòng' : 'Gửi yêu cầu thay đổi đặt phòng'}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Mã booking: <strong className="font-mono text-[var(--color-primary)]">#{booking.bookingCode}</strong> ({booking.roomTypeName})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo phân nhánh PENDING vs CONFIRMED */}
        <div className="px-5 pt-3 shrink-0">
          {isPending ? (
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-md text-teal-800 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đơn đang chờ duyệt (PENDING):</span>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  Bạn có thể cập nhật trực tiếp thông tin liên hệ, thời gian, số phòng, số khách và thêm/bớt các dịch vụ tư vấn đính kèm.
                </p>
              </div>
            </div>
          ) : isConfirmed ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đơn đã xác nhận (CONFIRMED):</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Mọi thay đổi về thời gian, số phòng, dịch vụ tư vấn hay thông tin khách sẽ được chuyển thành yêu cầu gửi nhà quản lý duyệt trước khi có hiệu lực.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 shrink-0" />
              <span>Trạng thái đơn hiện tại: {booking.status}.</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-5 mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Form Body cuộn mượt */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-4 text-xs">
          {/* Nhóm 1: Thông tin khách liên hệ */}
          <div className="space-y-3 p-3.5 bg-[#F6FAF8] rounded-md border border-gray-100">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              Thông tin người liên hệ
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Họ và tên khách <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-medium mb-1">Email nhận xác nhận</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Lịch trình & Số lượng phòng + NÚT CHECK LỊCH PHÒNG */}
          <div className="space-y-3 p-3.5 bg-[#F6FAF8] rounded-md border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Thời gian &amp; Số lượng phòng
              </span>

              {/* Nút kiểm tra lịch phòng */}
              <button
                type="button"
                onClick={handleCheckAvailability}
                disabled={isCheckingAvailability || !checkIn || !checkOut}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCheckingAvailability ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    <span>Kiểm tra phòng trống</span>
                  </>
                )}
              </button>
            </div>

            {/* Thông báo kết quả kiểm tra lịch phòng */}
            {availabilityResult && (
              <div
                className={`p-2.5 rounded-md text-xs flex items-start gap-2 transition-all ${
                  availabilityResult.available
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {availabilityResult.available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-bold block">
                    {availabilityResult.available ? 'Phòng khả dụng' : 'Không thể đặt'}
                  </span>
                  <p className="text-[11px] mt-0.5 leading-snug">
                    {availabilityResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Nhận phòng (Check-in) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={checkIn}
                  onChange={(e) => handleDateOrRoomChange(e.target.value, checkOut, roomCount)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Trả phòng (Check-out) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  value={checkOut}
                  onChange={(e) => handleDateOrRoomChange(checkIn, e.target.value, roomCount)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Số lượng phòng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <BedDouble className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={roomCount}
                    onChange={(e) =>
                      handleDateOrRoomChange(checkIn, checkOut, parseInt(e.target.value) || 1)
                    }
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Số lượng khách <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Users className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= KHỐI TƯ VẤN DỊCH VỤ THÊM (I HỆT FORM Ở TRANG BOOKING) ================= */}
          <div className="bg-white rounded-md border border-gray-200 shadow-2xs p-4 space-y-3">
            {/* Header + Radius Slider */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Tư vấn dịch vụ thêm</h4>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Khám phá điểm đến quanh đây và nhấn <strong>"+ Thêm vào booking"</strong> để homestay tư vấn dịch vụ thêm và chuẩn bị chu đáo trước khi nhận phòng
                </p>
              </div>

              {/* Radius slider: Kéo để chỉnh bán kính */}
              <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200 shrink-0 self-start sm:self-auto">
                <span className="text-[11px] font-semibold text-gray-600">Bán kính:</span>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-20 sm:w-24 h-1.5 bg-gray-300 rounded-sm appearance-none cursor-pointer accent-[var(--color-primary)]"
                />
                <span className="text-xs font-bold text-[var(--color-primary)] w-9 text-right">{radius}km</span>
              </div>
            </div>

            {/* BỘ LỌC PHÂN LOẠI DANH MỤC */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setNearbyCategory('ALL')}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer ${
                  nearbyCategory === 'ALL'
                    ? 'bg-[#048c73] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({processedNearbyPlaces.length})
              </button>
              <button
                type="button"
                onClick={() => setNearbyCategory('ATTRACTION')}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  nearbyCategory === 'ATTRACTION'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Mountain className="w-3 h-3" />
                Thắng cảnh ({processedNearbyPlaces.filter((p) => p.kind === 'ATTRACTION' || p.kind === 'PHOTO').length})
              </button>
              <button
                type="button"
                onClick={() => setNearbyCategory('FOOD')}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  nearbyCategory === 'FOOD'
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Utensils className="w-3 h-3" />
                Ẩm thực ({processedNearbyPlaces.filter((p) => p.kind === 'FOOD' || p.kind === 'RESTAURANT' || p.kind === 'CUISINE').length})
              </button>
              <button
                type="button"
                onClick={() => setNearbyCategory('TRANSPORT')}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  nearbyCategory === 'TRANSPORT'
                    ? 'bg-[#d97706] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Bus className="w-3 h-3" />
                Di chuyển ({processedNearbyPlaces.filter((p) => p.kind === 'TRANSPORT').length})
              </button>
            </div>

            {/* Danh sách địa điểm quanh đây (grid 2 cột) */}
            {isLoadingNearby ? (
              <div className="py-6 text-center text-gray-400 flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span>Đang tải các địa điểm quanh homestay trong bán kính {radius}km...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredNearbyPlaces.length > 0 ? (
                  filteredNearbyPlaces.map((item, idx) => {
                    const isAdded = serviceItems.some(
                      (s) =>
                        s.serviceCode === `NEARBY_${item.kind}_${item.id}` ||
                        (s.serviceName && s.serviceName.includes(item.name))
                    );

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-md border transition-all flex flex-col justify-between gap-2 ${
                          isAdded
                            ? 'bg-[#f0fdf4] border-emerald-300 shadow-2xs'
                            : 'bg-slate-50/70 border-gray-200/70 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center border border-gray-200 shrink-0 mt-0.5">
                              {getPlaceIcon(item.kind)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-gray-500 block truncate">
                                {item.kind === 'FOOD' || item.kind === 'RESTAURANT' || item.kind === 'CUISINE'
                                  ? 'Ẩm thực & Quán ăn'
                                  : item.kind === 'ATTRACTION' || item.kind === 'PHOTO'
                                  ? 'Danh lam thắng cảnh'
                                  : item.kind === 'TRANSPORT'
                                  ? 'Bến xe & Di chuyển'
                                  : 'Dịch vụ lân cận'}
                                {item.address ? ` · ${item.address}` : ''}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-[var(--color-primary)] bg-white px-1.5 py-0.5 rounded-sm border border-gray-200 shrink-0 shadow-2xs">
                            {item.displayDistance < 1
                              ? Math.round(item.displayDistance * 1000) + ' m'
                              : item.displayDistance + ' km'}
                          </span>
                        </div>

                        {/* Nút hành động: Xem trên map & Thêm / Bỏ chọn */}
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-200/60 mt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMapTarget({ lat: item.latitude, lng: item.longitude, zoom: 16 });
                              setShowMapModal(true);
                            }}
                            className="text-[11px] font-semibold text-gray-500 hover:text-[var(--color-primary)] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <MapPin className="w-3 h-3" /> Xem vị trí
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAddService(item)}
                            className={`px-2 py-0.5 rounded-xs text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                : 'bg-[var(--color-primary)] text-white hover:bg-[#03725e]'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                Đã thêm (Bỏ chọn)
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                                + Thêm vào booking
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="col-span-2 text-xs text-gray-500 italic p-3 text-center bg-gray-50 rounded-md">
                    Không tìm thấy địa điểm nào phù hợp trong danh mục này trong bán kính {radius}km.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ================= KHỐI HIỂN THỊ DỊCH VỤ TƯ VẤN ĐÃ CHỌN (TÓM TẮT ĐÍNH KÈM) ================= */}
          {serviceItems.length > 0 && (
            <div className="bg-white rounded-md border-2 border-[var(--color-primary)]/40 shadow-xs p-3.5 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Dịch vụ tư vấn thêm đính kèm ({serviceItems.length})
                  </h4>
                </div>
                <span className="text-[10px] font-bold bg-[#edfbf7] text-[var(--color-primary)] px-2 py-0.5 rounded-sm border border-[var(--color-primary)]/30">
                  Miễn phí tư vấn
                </span>
              </div>

              <div className="space-y-2">
                {serviceItems.map((svc, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2.5 p-2.5 rounded-md bg-[#f6faf8] border border-gray-200/90 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{svc.serviceName}</span>
                      </div>
                      {svc.note && (
                        <p className="text-gray-600 italic pl-5 text-[11px] line-clamp-2">
                          Ghi chú: &ldquo;{svc.note}&rdquo;
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-sm cursor-pointer transition-colors shrink-0"
                      title="Xóa dịch vụ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ghi chú chung */}
          <div>
            <label className="block text-gray-500 font-medium mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-gray-400" />
              <span>Ghi chú thêm cho chủ homestay</span>
            </label>
            <textarea
              rows={2}
              value={guestNote}
              onChange={(e) => setGuestNote(e.target.value)}
              placeholder="VD: Đến muộn sau 18h, cần đệm phụ..."
              className="w-full p-2.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden resize-none"
            />
          </div>

          {/* Lý do thay đổi (bắt buộc khi CONFIRMED) */}
          {isConfirmed && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md space-y-1.5">
              <label className="block text-amber-900 font-bold text-xs">
                Lý do yêu cầu thay đổi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Chuyến bay bị hoãn, muốn dời ngày nhận phòng sang hôm sau..."
                className="w-full p-2.5 bg-white border border-amber-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden resize-none"
              />
              <span className="text-[11px] text-amber-700 block">
                Yêu cầu này sẽ được gửi ngay đến Nhà quản lý để thẩm định tình trạng phòng và liên hệ xác nhận lại với bạn.
              </span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (availabilityResult !== null && !availabilityResult.available)}
              className="px-5 py-2 text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[#03705C] rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : isPending ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi ngay</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi yêu cầu cho quản lý</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ================= MODAL NHỎ THÊM DỊCH VỤ (TƯƠNG TỰ BOOKINGPAGE) ================= */}
      {addingPlaceModal && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-3 pt-20 sm:pt-24 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="font-bold text-sm text-slate-800">
                Thêm dịch vụ tư vấn: {addingPlaceModal.place.name}
              </h3>
              <button
                type="button"
                onClick={() => setAddingPlaceModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tên dịch vụ tư vấn
                </label>
                <input
                  type="text"
                  value={addingPlaceModal.defaultServiceName}
                  onChange={(e) =>
                    setAddingPlaceModal({ ...addingPlaceModal, defaultServiceName: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Ghi chú cho chỗ nghỉ (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={addingPlaceModal.note}
                  onChange={(e) =>
                    setAddingPlaceModal({ ...addingPlaceModal, note: e.target.value })
                  }
                  placeholder="Ví dụ: Cần xe đón 2 người lúc 14:00, hoặc nhờ đặt bàn ăn tối..."
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAddingPlaceModal(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAddService}
                className="px-4 py-1.5 text-xs font-bold bg-[var(--color-primary)] hover:bg-[#03725e] text-white rounded-md shadow-xs cursor-pointer"
              >
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL VIETMAP XEM VỊ TRÍ ================= */}
      {showMapModal && (
        <div className="fixed inset-0 z-[10001] flex items-start justify-center p-3 pt-20 sm:pt-24 pb-8 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[75vh] max-h-[calc(100vh-7rem)] p-4 shadow-2xl flex flex-col border border-gray-200 relative my-auto sm:my-0">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-800">
                  Bản đồ vị trí quanh {booking.placeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 rounded-md overflow-hidden border border-gray-200 relative">
              <VietmapView
                centerLat={selectedMapTarget?.lat || booking.latitude || 21.84912}
                centerLng={selectedMapTarget?.lng || booking.longitude || 104.09245}
                zoomLevel={selectedMapTarget?.zoom || 14}
                className="w-full h-full"
                markers={mapMarkers}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer"
              >
                Đóng bản đồ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPlaceIcon(kind?: string) {
  const k = (kind || '').toUpperCase();
  if (k.includes('FOOD') || k.includes('RESTAURANT') || k.includes('CUISINE')) {
    return <Utensils className="w-3.5 h-3.5 text-red-600" />;
  }
  if (k.includes('TRANSPORT')) {
    return <Bus className="w-3.5 h-3.5 text-amber-600" />;
  }
  if (k.includes('ATTRACTION') || k.includes('PHOTO')) {
    return <Mountain className="w-3.5 h-3.5 text-blue-600" />;
  }
  return <Compass className="w-3.5 h-3.5 text-emerald-600" />;
}

import React, { useState, useEffect, useMemo } from 'react';
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
  Phone,
  Mountain,
  Bus,
  MapPin,
  Map as MapIcon,
  Plus,
  Trash2,
  X,
  Lock
} from 'lucide-react';
import { BookingNavigationState, BookingResponseDto, BookingServiceItemDto } from '@/types/booking';
import { createBooking, saveUserBooking } from '@/services/bookingService';
import { fetchNearbyPlaces, getHomestayById } from '@/services/homestayService';
import { getCurrentCustomer } from '@/services/authService';
import { NearbyPlaceDto } from '@/types/homestay';
import { Button } from '@/components/ui/button';
import { VietTrackLogoMark } from '@/components/ui/logo';
import OpenStreetMapView, { OsmMarkerItem } from '@/components/map/OpenStreetMapView';

// Helper tính khoảng cách Haversine chuẩn theo tọa độ GPS/OSM
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

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

  // Nhận state từ HomestayDetailPage hoặc fallback dữ liệu mẫu
  const navState = location.state as BookingNavigationState | undefined;

  const checkIn = navState?.checkIn;
  const checkOut = navState?.checkOut;
  const stateNights = navState?.nights;

  // 1. Tính toán số đêm lưu trú chính xác từ khoảng ngày checkIn - checkOut
  const nights = useMemo(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn + 'T12:00:00');
      const end = new Date(checkOut + 'T12:00:00');
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) return diff;
    }
    return stateNights && stateNights > 0 ? stateNights : 1;
  }, [checkIn, checkOut, stateNights]);

  // 2. Số lượng phòng và khách lưu trú
  const [roomCount, setRoomCount] = useState<number>(() => navState?.roomCount || 1);
  const [guestCount, setGuestCount] = useState<number>(() => navState?.guestCount || 2);

  // 3. Đơn giá 1 phòng / 1 đêm
  const unitPrice = useMemo(() => navState?.basePrice || 361028, [navState?.basePrice]);
  const originalUnitPrice = useMemo(
    () => navState?.originalPrice || Math.round(unitPrice * 1.25),
    [navState?.originalPrice, unitPrice]
  );

  // 4. Logic tính toán tiền phòng & tổng chi phí chuẩn xác
  // Tiền phòng thực tế = đơn giá * số đêm * số phòng
  const subtotalRoomPrice = useMemo(() => unitPrice * nights * roomCount, [unitPrice, nights, roomCount]);
  // Tổng giá niêm yết ban đầu
  const totalOriginalPrice = useMemo(
    () => originalUnitPrice * nights * roomCount,
    [originalUnitPrice, nights, roomCount]
  );
  // Số tiền ưu đãi tiết kiệm được
  const discountAmount = useMemo(
    () => (totalOriginalPrice > subtotalRoomPrice ? totalOriginalPrice - subtotalRoomPrice : 0),
    [totalOriginalPrice, subtotalRoomPrice]
  );

  // Tổng thanh toán thực tế (khớp tuyệt đối với backend: unitPrice * nights * roomCount)
  const totalPrice = subtotalRoomPrice;

  // Lấy dữ liệu rating thực tế nếu chưa có trong state điều hướng
  const [fetchedRating, setFetchedRating] = useState<{ ratingAvg?: number; ratingCount?: number } | null>(null);

  useEffect(() => {
    if (navState?.placeId && (!navState?.placeRating || !navState?.placeReviewCount)) {
      getHomestayById(navState.placeId.toString())
        .then((detail) => {
          if (detail) {
            setFetchedRating({
              ratingAvg: detail.ratingAvg,
              ratingCount: detail.ratingCount,
            });
          }
        })
        .catch((err) => console.error('Error fetching homestay detail for rating:', err));
    }
  }, [navState?.placeId, navState?.placeRating, navState?.placeReviewCount]);

  const roomInfo = useMemo(() => {
    return {
      placeId: navState?.placeId,
      placeName: navState?.placeName || 'Chỗ nghỉ',
      placeAddress: navState?.placeAddress || '',
      placeRating: navState?.placeRating ?? fetchedRating?.ratingAvg,
      placeReviewCount: navState?.placeReviewCount ?? fetchedRating?.ratingCount,
      coverImageUrl: navState?.coverImageUrl || '',
      latitude: navState?.latitude,
      longitude: navState?.longitude,
      roomName: navState?.roomTypeName || 'Phòng nghỉ',
      checkInDateStr: navState?.checkIn ? formatISODate(navState.checkIn) : '',
      checkInTime: 'Từ 14:00',
      checkOutDateStr: navState?.checkOut ? formatISODate(navState.checkOut) : '',
      checkOutTime: 'Trước 12:00',
      bedInfo: navState?.bedInfo || '1 giường đôi',
      hasBreakfast: navState?.hasBreakfast ?? false,
      freeCancellation: navState?.freeCancellation ?? true,
      totalRoomsLeft: navState?.totalRoomCount || 5,
      maxOccupancy: navState?.maxOccupancy || 2,
    };
  }, [navState, fetchedRating]);

  // Yêu cầu bắt buộc đăng nhập tài khoản khách hàng để đặt phòng
  const customer = useMemo(() => getCurrentCustomer(), []);

  useEffect(() => {
    if (!customer) {
      navigate('/login', {
        state: {
          returnUrl: '/booking',
          bookingState: navState,
          message: 'Vui lòng đăng nhập tài khoản khách hàng để tiến hành đặt phòng.',
        },
        replace: true,
      });
    }
  }, [customer, navState, navigate]);

  // Tự động điền thông tin khách hàng đã đăng nhập vào form
  const [fullName, setFullName] = useState(() => customer?.fullName || '');
  const [countryCode, setCountryCode] = useState('+84');
  const [phone, setPhone] = useState(() => {
    const p = customer?.phone || '';
    return p.startsWith('+84') ? p.slice(3) : p;
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [email, setEmail] = useState(() => customer?.email || '');
  const [isBookingForSelf, setIsBookingForSelf] = useState(true);

  // Guest info
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [guestName, setGuestName] = useState(() => customer?.fullName || '');

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

  // Dịch vụ đi kèm theo thiết kế DB mới: booking_service_item
  const [serviceItems, setServiceItems] = useState<BookingServiceItemDto[]>([]);

  // State cho phần Địa điểm quanh đây (đồng bộ như trang chi tiết)
  const [radius, setRadius] = useState<number>(10);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceDto[]>([]);
  const [nearbyCategory, setNearbyCategory] = useState<'ALL' | 'ATTRACTION' | 'FOOD' | 'TRANSPORT'>('ALL');
  const [showOsmModal, setShowOsmModal] = useState<boolean>(false);
  const [selectedMapTarget, setSelectedMapTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  // Modal thêm nhanh ghi chú khi add dịch vụ quanh đây
  const [addingPlaceModal, setAddingPlaceModal] = useState<{
    place: NearbyPlaceDto;
    defaultServiceName: string;
    note: string;
  } | null>(null);

  // Fetch địa điểm quanh đây từ API backend
  useEffect(() => {
    if (roomInfo.placeId) {
      fetchNearbyPlaces(roomInfo.placeId.toString(), radius)
        .then((data) => setNearbyPlaces(data))
        .catch((err) => console.error('Error fetching nearby places on booking page:', err));
    }
  }, [roomInfo.placeId, radius]);

  // Tính khoảng cách Haversine chính xác theo tọa độ
  const processedNearbyPlaces = useMemo(() => {
    const homeLat = roomInfo.latitude || 21.85;
    const homeLng = roomInfo.longitude || 104.08;

    return nearbyPlaces.map((item) => {
      const pLat = item.latitude ?? (homeLat + ((item.id % 7) - 3) * 0.007);
      const pLng = item.longitude ?? (homeLng + ((item.id % 5) - 2) * 0.007);
      const calculatedDistance = calculateDistanceKm(homeLat, homeLng, pLat, pLng);

      return {
        ...item,
        latitude: pLat,
        longitude: pLng,
        displayDistance: calculatedDistance,
      };
    });
  }, [nearbyPlaces, roomInfo.latitude, roomInfo.longitude]);

  // Bộ lọc danh mục quanh đây
  const filteredNearbyPlaces = useMemo(() => {
    if (nearbyCategory === 'ALL') return processedNearbyPlaces;
    return processedNearbyPlaces.filter((item) => {
      if (nearbyCategory === 'FOOD') {
        return item.kind === 'FOOD' || item.kind === 'RESTAURANT' || item.kind === 'CUISINE';
      }
      if (nearbyCategory === 'ATTRACTION') {
        return item.kind === 'ATTRACTION';
      }
      if (nearbyCategory === 'TRANSPORT') {
        return item.kind === 'TRANSPORT';
      }
      return true;
    });
  }, [processedNearbyPlaces, nearbyCategory]);

  // Markers cho modal OpenStreetMap
  const mapMarkers = useMemo<OsmMarkerItem[]>(() => {
    const list: OsmMarkerItem[] = [
      {
        id: `homestay-${roomInfo.placeId}`,
        name: roomInfo.placeName,
        latitude: roomInfo.latitude || 21.751214,
        longitude: roomInfo.longitude || 104.318420,
        price: unitPrice,
        displayMode: 'name',
        district: roomInfo.placeAddress,
        coverImageUrl: roomInfo.coverImageUrl,
        isMain: true,
        kind: 'HOMESTAY',
      },
    ];

    filteredNearbyPlaces.forEach((p) => {
      list.push({
        id: `poi-${p.id}`,
        name: p.name,
        latitude: p.latitude || 21.751214,
        longitude: p.longitude || 104.318420,
        district: p.address || `${p.displayDistance} km từ chỗ nghỉ`,
        kind: p.kind,
        category: p.kind,
        distance: p.displayDistance,
        displayMode: 'name',
        isMain: false,
      });
    });

    return list;
  }, [roomInfo, filteredNearbyPlaces, unitPrice]);

  // Quản lý toggle hoặc mở modal add dịch vụ quanh đây
  const handleOpenAddService = (place: NearbyPlaceDto) => {
    const isAlreadyAdded = serviceItems.some(item => item.serviceCode === `NEARBY_${place.kind}_${place.id}`);
    if (isAlreadyAdded) {
      // Nếu đã add thì cho phép xóa trực tiếp
      setServiceItems(prev => prev.filter(item => item.serviceCode !== `NEARBY_${place.kind}_${place.id}`));
      return;
    }

    let defaultName = `Tư vấn dịch vụ thêm: ${place.name}`;
    if (place.kind === 'TRANSPORT') {
      defaultName = `Tư vấn đưa đón / di chuyển: ${place.name}`;
    } else if (place.kind === 'FOOD' || place.kind === 'RESTAURANT' || place.kind === 'CUISINE') {
      defaultName = `Tư vấn đặt bàn / ẩm thực: ${place.name}`;
    } else if (place.kind === 'ATTRACTION') {
      defaultName = `Tư vấn tham quan / trải nghiệm: ${place.name}`;
    }

    setAddingPlaceModal({
      place,
      defaultServiceName: defaultName,
      note: ''
    });
  };

  const handleConfirmAddService = () => {
    if (!addingPlaceModal) return;
    const { place, defaultServiceName, note } = addingPlaceModal;
    const newItem: BookingServiceItemDto = {
      serviceName: defaultServiceName,
      serviceCode: `NEARBY_${place.kind}_${place.id}`,
      note: note.trim() || undefined,
      isIncluded: true,
    };
    setServiceItems(prev => [...prev, newItem]);
    setAddingPlaceModal(null);
  };

  const handleRemoveService = (index: number) => {
    setServiceItems(prev => prev.filter((_, idx) => idx !== index));
  };

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

    const activeCustomer = getCurrentCustomer();
    if (!activeCustomer) {
      alert('Vui lòng đăng nhập tài khoản khách hàng để tiến hành đặt phòng.');
      navigate('/login', {
        state: {
          returnUrl: '/booking',
          bookingState: navState,
          message: 'Vui lòng đăng nhập tài khoản khách hàng để tiến hành đặt phòng.',
        },
      });
      return;
    }

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
        roomCount: roomCount,
        guestCount: guestCount,
        guestName: !isBookingForSelf && guestName.trim() ? guestName.trim() : fullName.trim(),
        guestPhone: `${countryCode}${phone.trim()}`,
        guestEmail: email.trim(),
        guestNote: customNote.trim() || undefined,
        specialRequests: selectedRequests.length > 0 ? selectedRequests : undefined,
        serviceItems: serviceItems.length > 0 ? serviceItems : undefined,
      });
      setBookingResult(result);
      saveUserBooking(result);
      setIsBookingSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đặt phòng thất bại. Vui lòng thử lại.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Icon biểu tượng địa điểm
  const getPlaceIcon = (kind: string) => {
    switch (kind) {
      case 'FOOD':
      case 'RESTAURANT':
      case 'CUISINE':
        return <Utensils className="w-3.5 h-3.5 text-[#dc2626]" />;
      case 'ATTRACTION':
        return <Mountain className="w-3.5 h-3.5 text-[#2563eb]" />;
      case 'TRANSPORT':
        return <Bus className="w-3.5 h-3.5 text-[#d97706]" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // Nếu chưa đăng nhập khách hàng, hiển thị yêu cầu đăng nhập
  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f6faf8] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Yêu cầu đăng nhập</h2>
          <p className="text-xs text-gray-600">
            Bạn cần đăng nhập tài khoản khách hàng để xem chi tiết và thực hiện đặt phòng. Đang chuyển hướng đến trang đăng nhập...
          </p>
          <Button
            onClick={() =>
              navigate('/login', {
                state: {
                  returnUrl: '/booking',
                  bookingState: navState,
                  message: 'Vui lòng đăng nhập tài khoản khách hàng để tiến hành đặt phòng.',
                },
                replace: true,
              })
            }
            className="w-full bg-[var(--color-primary)] hover:bg-[#03725e] text-white font-bold rounded-md"
          >
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf8] text-[var(--color-ink)] flex flex-col">
      {/* Header: Chỉ thuần túy Logo và Tên theo chuẩn */}
      <header className="w-full bg-white border-b border-gray-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1180px] mx-auto px-4 md:px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5 md:gap-3 group">
            <VietTrackLogoMark size={38} className="transition-transform group-hover:scale-105" />
            <span className="text-xl md:text-2xl font-black font-display leading-none tracking-tight text-[var(--color-ink-deep)]">
              Đi Du Lịch
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
                    className="text-gray-400 hover:text-[var(--color-primary)] ml-1 cursor-pointer"
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
                    ? Math.max(1, Math.round((new Date(bookingResult.holdExpiresAt).getTime() - new Date().getTime()) / 3_600_000))
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
                    {roomInfo.checkInDateStr} <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" /> {roomInfo.checkOutDateStr} ({bookingResult?.nights ?? nights} đêm)
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-gray-500">Số lượng đặt</div>
                  <div className="col-span-2 font-medium text-gray-800">
                    {bookingResult?.roomCount ?? roomCount} phòng · {bookingResult?.guestCount ?? guestCount} khách
                  </div>
                </div>

                {/* Dịch vụ đi kèm theo DB mới: booking_service_item */}
                {bookingResult?.serviceItems && bookingResult.serviceItems.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-gray-500">Dịch vụ đi kèm đã lưu</div>
                    <div className="col-span-2 space-y-2">
                      {bookingResult.serviceItems.map((svc, idx) => (
                        <div key={idx} className="p-2.5 rounded-md bg-[#edfbf7] border border-[#048c73]/20 text-xs">
                          <div className="font-bold text-[#048c73] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#048c73]" />
                            {svc.serviceName}
                          </div>
                          {svc.note && (
                            <div className="text-gray-600 mt-1 italic">
                              Ghi chú: {svc.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      {new Intl.NumberFormat('vi-VN').format(bookingResult?.totalAmount ?? totalPrice)} VND
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

            {/* TÊN VÀ ĐÁNH GIÁ THỰC TẾ TỪ CHỖ NGHỈ */}
            <div className="mb-5">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-ink-deep)] leading-tight mb-1.5">
                {roomInfo.placeName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                {roomInfo.placeRating ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200 text-amber-900 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{Number(roomInfo.placeRating).toFixed(1)} / 5.0</span>
                    </div>
                    {roomInfo.placeReviewCount !== undefined && roomInfo.placeReviewCount > 0 && (
                      <span className="text-gray-500 font-medium">({roomInfo.placeReviewCount} đánh giá)</span>
                    )}
                  </div>
                ) : null}

                {roomInfo.placeAddress && (
                  <div className="text-gray-500 flex items-center gap-1">
                    {roomInfo.placeRating ? <span className="text-gray-300 font-bold mr-1">·</span> : null}
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{roomInfo.placeAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* ================= CỘT TRÁI: FORM ĐIỀN THÔNG TIN ================= */}
              <div className="lg:col-span-7 space-y-6">

                {/* Khối 1: Liên hệ đặt chỗ (Tự động điền theo tài khoản) */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Liên hệ đặt chỗ</h2>
                        <p className="text-xs md:text-sm text-[var(--color-muted)] mt-0.5">
                          Thông tin liên hệ nhận xác nhận đặt phòng
                        </p>
                      </div>
                    </div>

                    {customer && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tài khoản: {customer.fullName}</span>
                      </div>
                    )}
                  </div>

                  {customer && (
                    <div className="mb-4 p-3 rounded-md bg-[#f0fdf4] border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Hệ thống đã tự động điền thông tin từ tài khoản <strong>{customer.fullName}</strong> ({customer.email}).
                      </span>
                    </div>
                  )}

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

                {/* ================= KHỐI MỚI: ĐỊA ĐIỂM & DỊCH VỤ QUANH ĐÂY (GIỐNG TRANG CHI TIẾT & ADD VÀO BOOKING) ================= */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Tư vấn dịch vụ thêm</h2>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Khám phá điểm đến quanh đây và nhấn <strong>"+ Thêm vào booking"</strong> để homestay tư vấn dịch vụ thêm và chuẩn bị chu đáo trước khi nhận phòng
                      </p>
                    </div>

                    {/* Radius slider */}
                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 shrink-0">
                      <span className="text-xs font-semibold text-gray-600">Bán kính:</span>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-20 md:w-28 h-1.5 bg-gray-300 rounded-sm appearance-none cursor-pointer accent-[var(--color-primary)]"
                      />
                      <span className="text-xs font-bold text-[var(--color-primary)] w-9 text-right">{radius}km</span>
                    </div>
                  </div>

                  {/* BỘ LỌC PHÂN LOẠI DANH MỤC */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setNearbyCategory('ALL')}
                      className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
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
                      className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        nearbyCategory === 'ATTRACTION'
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Mountain className="w-3.5 h-3.5" />
                      Điểm đến & Thắng cảnh ({processedNearbyPlaces.filter(p => p.kind === 'ATTRACTION').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNearbyCategory('FOOD')}
                      className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        nearbyCategory === 'FOOD'
                          ? 'bg-[#dc2626] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Ẩm thực & Quán ngon ({processedNearbyPlaces.filter(p => p.kind === 'FOOD' || p.kind === 'RESTAURANT' || p.kind === 'CUISINE').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNearbyCategory('TRANSPORT')}
                      className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        nearbyCategory === 'TRANSPORT'
                          ? 'bg-[#d97706] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Bus className="w-3.5 h-3.5" />
                      Bến xe & Di chuyển ({processedNearbyPlaces.filter(p => p.kind === 'TRANSPORT').length})
                    </button>
                  </div>

                  {/* Danh sách địa điểm quanh đây có nút Add vào booking */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {filteredNearbyPlaces.length > 0 ? (
                      filteredNearbyPlaces.map((item, idx) => {
                        const isAdded = serviceItems.some(s => s.serviceCode === `NEARBY_${item.kind}_${item.id}`);

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-md border transition-all flex flex-col justify-between gap-2.5 ${
                              isAdded
                                ? 'bg-[#f0fdf4] border-emerald-300 shadow-2xs'
                                : 'bg-[var(--color-canvas)] border-gray-100 hover:border-gray-200 hover:bg-gray-50/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center border border-gray-200 shrink-0 mt-0.5">
                                  {getPlaceIcon(item.kind)}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs md:text-sm font-bold text-[var(--color-ink-deep)] block truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[11px] text-gray-500 block truncate">
                                    {item.kind === 'FOOD' ? 'Ẩm thực & Quán ăn' : item.kind === 'ATTRACTION' ? 'Danh lam thắng cảnh' : item.kind === 'TRANSPORT' ? 'Bến xe & Di chuyển' : 'Điểm lân cận'}
                                    {item.address ? ` · ${item.address}` : ''}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[11px] font-bold text-[var(--color-primary)] bg-white px-2 py-0.5 rounded-sm border border-gray-200 shrink-0 shadow-2xs">
                                {item.displayDistance < 1 ? Math.round(item.displayDistance * 1000) + ' m' : item.displayDistance + ' km'}
                              </span>
                            </div>

                            {/* Nút hành động: Xem trên map & Thêm vào booking */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMapTarget({ lat: item.latitude, lng: item.longitude, zoom: 16 });
                                  setShowOsmModal(true);
                                }}
                                className="text-[11px] font-semibold text-gray-500 hover:text-[var(--color-primary)] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <MapIcon className="w-3 h-3" /> Xem vị trí
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAddService(item)}
                                className={`px-2.5 py-1 rounded-xs text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isAdded
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                    : 'bg-[var(--color-primary)] text-white hover:bg-[#03725e]'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    Đã thêm (Bỏ chọn)
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    + Thêm vào booking
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="col-span-2 text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-md">
                        Không tìm thấy địa điểm nào phù hợp trong danh mục này trong bán kính {radius}km.
                      </p>
                    )}
                  </div>

                  {/* Nút mở bản đồ OpenStreetMap toàn cảnh */}
                  <div className="pt-2 flex justify-center">
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedMapTarget(null);
                        setShowOsmModal(true);
                      }}
                      variant="outline"
                      className="rounded-md font-bold text-xs md:text-sm flex items-center gap-2 px-5 py-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] cursor-pointer"
                    >
                      <MapIcon className="w-4 h-4" />
                      Mở bản đồ OpenStreetMap toàn cảnh ({filteredNearbyPlaces.length} địa điểm)
                    </Button>
                  </div>
                </div>

                {/* ================= KHỐI HIỂN THỊ DỊCH VỤ ĐI KÈM ĐÃ CHỌN (booking_service_item) ================= */}
                {serviceItems.length > 0 && (
                  <div className="bg-white rounded-lg border-2 border-[var(--color-primary)]/40 shadow-xs p-5 md:p-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-[var(--color-ink-deep)]">
                          Dịch vụ tư vấn thêm đính kèm ({serviceItems.length})
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold bg-[#edfbf7] text-[var(--color-primary)] px-2 py-0.5 rounded-sm border border-[var(--color-primary)]/30">
                        Miễn phí tư vấn
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                      Các dịch vụ/yêu cầu tư vấn thêm dưới đây sẽ được gửi trực tiếp đến chủ homestay để tư vấn và chuẩn bị trước khi bạn đến nhận phòng.
                    </p>

                    <div className="space-y-2.5">
                      {serviceItems.map((svc, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 p-3 rounded-md bg-[#f6faf8] border border-gray-200/90 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{svc.serviceName}</span>
                            </div>
                            {svc.note && (
                              <p className="text-gray-600 italic pl-5">
                                Ghi chú: &ldquo;{svc.note}&rdquo;
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-sm cursor-pointer transition-colors"
                            title="Xóa dịch vụ này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    <div className="bg-[#f8faf9] border border-gray-200/80 rounded-md p-3 mb-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-gray-500 font-medium">Nhận phòng</div>
                        <div className="font-bold text-gray-800 mt-0.5">{roomInfo.checkInDateStr}</div>
                        <div className="text-gray-400 text-[11px]">{roomInfo.checkInTime}</div>
                      </div>

                      <div className="text-center px-2">
                        <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-sm border border-gray-200 shadow-2xs inline-flex items-center gap-1">
                          {nights} đêm <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-gray-500 font-medium">Trả phòng</div>
                        <div className="font-bold text-gray-800 mt-0.5">{roomInfo.checkOutDateStr}</div>
                        <div className="text-gray-400 text-[11px]">{roomInfo.checkOutTime}</div>
                      </div>
                    </div>

                    {/* Bộ chọn số lượng phòng & số khách */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-200/80 mb-3 text-xs">
                      <div>
                        <div className="text-gray-600 font-medium mb-1 flex items-center justify-between">
                          <span>Số phòng:</span>
                          <span className="text-[11px] text-gray-400">(còn {roomInfo.totalRoomsLeft})</span>
                        </div>
                        <div className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-gray-200">
                          <button
                            type="button"
                            disabled={roomCount <= 1}
                            onClick={() => setRoomCount((prev) => Math.max(1, prev - 1))}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="font-bold text-gray-900">{roomCount}</span>
                          <button
                            type="button"
                            disabled={roomCount >= roomInfo.totalRoomsLeft}
                            onClick={() => setRoomCount((prev) => Math.min(roomInfo.totalRoomsLeft, prev + 1))}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 font-medium mb-1 flex items-center justify-between">
                          <span>Số khách:</span>
                          <span className="text-[11px] text-gray-400">({roomCount * roomInfo.maxOccupancy} max)</span>
                        </div>
                        <div className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-gray-200">
                          <button
                            type="button"
                            disabled={guestCount <= 1}
                            onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="font-bold text-gray-900">{guestCount}</span>
                          <button
                            type="button"
                            disabled={guestCount >= roomCount * roomInfo.maxOccupancy * 2}
                            onClick={() => setGuestCount((prev) => prev + 1)}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tiện ích cơ bản của phòng */}
                    <div className="space-y-2 text-xs text-gray-700 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{guestCount} khách lưu trú ({roomCount} phòng)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <BedDouble className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{roomInfo.bedInfo}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{roomInfo.hasBreakfast ? 'Bao gồm bữa sáng miễn phí' : 'Không bao gồm bữa sáng'}</span>
                      </div>

                      {/* Hiển thị tóm tắt các dịch vụ đi kèm đã add */}
                      {serviceItems.length > 0 && (
                        <div className="p-2.5 bg-[#edfbf7] rounded-md border border-[#048c73]/30 space-y-1">
                          <div className="font-bold text-xs text-[#048c73] flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Đã thêm {serviceItems.length} dịch vụ tư vấn thêm:
                          </div>
                          <ul className="text-[11px] text-gray-700 space-y-0.5 list-disc list-inside pl-1">
                            {serviceItems.map((s, idx) => (
                              <li key={idx} className="truncate">
                                {s.serviceName}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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
                          <span className="text-gray-800 font-medium">
                            Giá phòng ({roomCount} phòng × {nights} đêm)
                          </span>
                          <div className="text-[11px] text-[var(--color-muted)]">
                            {new Intl.NumberFormat('vi-VN').format(unitPrice)} đ/đêm × {roomCount} phòng × {nights} đêm
                          </div>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {new Intl.NumberFormat('vi-VN').format(subtotalRoomPrice)} VND
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-800 font-medium">Thuế và phí dịch vụ</span>
                          <div className="text-[11px] text-[var(--color-muted)]">Cam kết giá minh bạch, không phí ẩn</div>
                        </div>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                          Đã bao gồm (0 VND)
                        </span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-700">
                          <span className="font-medium">Ưu đãi tiết kiệm trực tiếp</span>
                          <span className="font-bold">
                            -{new Intl.NumberFormat('vi-VN').format(discountAmount)} VND
                          </span>
                        </div>
                      )}

                      {serviceItems.length > 0 && (
                        <div className="flex justify-between items-center text-[#048c73] pt-1 border-t border-dashed border-gray-200">
                          <span className="font-medium">Dịch vụ đính kèm ({serviceItems.length} mục)</span>
                          <span className="font-bold">Miễn phí (Hỗ trợ tại chỗ)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hàng Tổng cộng & Phân tách thanh toán rõ ràng */}
                  <div className="pt-3 border-t border-gray-200/80 mb-4">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="font-bold text-sm text-[var(--color-ink-deep)]">Tổng chi phí</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {roomCount} phòng, {nights} đêm
                        </div>
                      </div>
                      <div className="text-right">
                        {totalOriginalPrice > totalPrice && (
                          <div className="text-xs text-gray-400 line-through">
                            {new Intl.NumberFormat('vi-VN').format(totalOriginalPrice)} VND
                          </div>
                        )}
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
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700 font-medium mb-3">
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
                </div>

              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= MODAL NHẬP GHI CHÚ KHI THÊM DỊCH VỤ QUANH ĐÂY ================= */}
      {addingPlaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl relative border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[var(--color-ink-deep)]">
                  Tư vấn thêm dịch vụ vào đơn đặt phòng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddingPlaceModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Địa điểm / Dịch vụ lựa chọn
                </label>
                <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200 font-semibold text-gray-800">
                  {addingPlaceModal.place.name}
                  <span className="block text-[11px] text-gray-500 font-normal mt-0.5">
                    Khoảng cách: {addingPlaceModal.place.distance} km từ chỗ nghỉ
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tên mục dịch vụ đính kèm
                </label>
                <input
                  type="text"
                  value={addingPlaceModal.defaultServiceName}
                  onChange={(e) =>
                    setAddingPlaceModal({ ...addingPlaceModal, defaultServiceName: e.target.value })
                  }
                  className="w-full h-10 px-3 text-xs bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] outline-none"
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
                  className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md"
                onClick={() => setAddingPlaceModal(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[var(--color-primary)] hover:bg-[#03725e] text-white font-bold rounded-md"
                onClick={handleConfirmAddService}
              >
                Xác nhận thêm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL OPENSTREETMAP TOÀN CẢNH ================= */}
      {showOsmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[85vh] p-4 md:p-5 shadow-2xl flex flex-col border border-gray-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-bold text-base md:text-lg text-[var(--color-ink-deep)]">
                  Bản đồ OpenStreetMap xung quanh {roomInfo.placeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOsmModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chú thích màu sắc */}
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 bg-[#edfbf7] text-[#048c73] px-2.5 py-1 rounded-sm border border-[#048c73]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#048C73]"></span> Chỗ nghỉ (Mục tiêu)
              </div>
              <div className="flex items-center gap-1.5 bg-[#eff6ff] text-[#2563eb] px-2.5 py-1 rounded-sm border border-[#2563eb]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]"></span> Thắng cảnh / Check-in
              </div>
              <div className="flex items-center gap-1.5 bg-[#fef2f2] text-[#dc2626] px-2.5 py-1 rounded-sm border border-[#dc2626]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]"></span> Quán ăn / Ẩm thực
              </div>
              <div className="flex items-center gap-1.5 bg-[#fffbeb] text-[#d97706] px-2.5 py-1 rounded-sm border border-[#d97706]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]"></span> Bến xe / Di chuyển
              </div>
            </div>

            {/* Khung bản đồ OSM */}
            <div className="flex-1 rounded-md overflow-hidden border border-gray-200 relative">
              <OpenStreetMapView
                centerLat={selectedMapTarget?.lat || roomInfo.latitude || 21.85}
                centerLng={selectedMapTarget?.lng || roomInfo.longitude || 104.08}
                zoomLevel={selectedMapTarget?.zoom || 14}
                className="w-full h-full"
                markers={mapMarkers}
              />
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-md cursor-pointer"
                onClick={() => setShowOsmModal(false)}
              >
                Đóng bản đồ
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

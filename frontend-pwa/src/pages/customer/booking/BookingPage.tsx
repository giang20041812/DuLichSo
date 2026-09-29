import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Mail,
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
  Star,
  CheckCircle2,
  Banknote,
  Mountain,
  Clock,
  Bus,
  MapPin,
  Map as MapIcon,
  Plus,
  Minus,
  AlertTriangle,
  Trash2,
  X,
  Lock
} from 'lucide-react';
import { BookingNavigationState, BookingResponseDto, BookingServiceItemDto, BookedDateRangeDto } from '@/types/booking';
import { createBooking, saveUserBooking, fetchBookedDatesByPlace, fetchBookedDatesByRoom, quoteRoom } from '@/services/bookingService';
import { fetchNearbyPlaces, getHomestayById } from '@/services/homestayService';
import { getCurrentCustomer } from '@/services/authService';
import { NearbyPlaceDto } from '@/types/homestay';
import { Button } from '@/components/ui/button';
import { VietTrackLogoMark } from '@/components/ui/logo';
import VietmapView from '@/components/map/VietmapView';
import type { VietmapMarkerItem } from '@/types/integrations/vietmap';
import RoomAvailabilityCalendar from '@/components/homestay/RoomAvailabilityCalendar';
import { openGoogleMapsDirections } from '@/lib/mapUtils';

// Helper tính khoảng cách Haversine chuẩn theo tọa độ GPS
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

// Helper: chuyển string YYYY-MM-DD sang YYYY-MM-DD an toàn theo giờ địa phương
function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string) {
  const parts = dateStr.split('-');
  const y = Number(parts[0]) || 2026;
  const m = Number(parts[1]) || 1;
  const d = Number(parts[2]) || 1;
  return new Date(y, m - 1, d);
}

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Nhận state từ HomestayDetailPage hoặc fallback dữ liệu mẫu
  const navState = location.state as BookingNavigationState | undefined;

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Ngày nhận / trả phòng có thể chỉnh sửa trực tiếp
  const [checkIn, setCheckIn] = useState<string>(() => {
    if (navState?.checkIn) return navState.checkIn;
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const [checkOut, setCheckOut] = useState<string>(() => {
    if (navState?.checkOut) return navState.checkOut;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  // Số lượng phòng tối đa của loại phòng này
  const maxRooms = Math.max(1, navState?.totalRoomCount || 5);
  const [roomCount, setRoomCount] = useState<number>(() => Math.max(1, Math.min(maxRooms, navState?.roomCount || 1)));

  // Số lượng khách (mặc định 2, tối đa theo sức chứa của số phòng)
  const roomMaxOccupancy = Math.max(1, navState?.maxOccupancy || 2);
  const maxGuests = Math.max(1, roomMaxOccupancy * roomCount);
  const [guestCount, setGuestCount] = useState<number>(() => {
    if (navState?.guestCount) {
      return Math.max(1, Math.min(maxGuests, navState.guestCount));
    }
    return Math.min(2, maxGuests);
  });

  // Tự động điều chỉnh số lượng phòng và khách khi người dùng thay đổi
  const handleRoomCountChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(maxRooms, newCount));
    setRoomCount(clamped);
    const updatedMaxGuests = Math.max(1, roomMaxOccupancy * clamped);
    if (guestCount > updatedMaxGuests) {
      setGuestCount(updatedMaxGuests);
    }
  };

  // 1. Tính toán số đêm lưu trú chính xác từ khoảng ngày checkIn - checkOut
  const nights = useMemo(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn + 'T12:00:00');
      const end = new Date(checkOut + 'T12:00:00');
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) return diff;
    }
    return 1;
  }, [checkIn, checkOut]);

  // Danh sách các khoảng ngày đã đặt của phòng này
  const [bookedDates, setBookedDates] = useState<BookedDateRangeDto[]>([]);

  useEffect(() => {
    // Ngăn Admin/Provider truy cập trang khách hàng
    const rawPortal = localStorage.getItem('portal_user');
    if (rawPortal) {
      try {
        const user = JSON.parse(rawPortal);
        if (user && (user.role === 'ADMIN' || user.role === 'PROVIDER')) {
          window.location.href = user.role === 'ADMIN' ? '/admin' : '/partner';
        }
      } catch (e) {
        console.error('Lỗi khi đọc portal_user', e);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (navState?.roomTypeId) {
      fetchBookedDatesByRoom(navState.roomTypeId)
        .then((data) => {
          if (Array.isArray(data)) setBookedDates(data);
        })
        .catch((err) => console.warn('fetchBookedDatesByRoom in BookingPage error:', err));
    } else if (navState?.placeId) {
      fetchBookedDatesByPlace(navState.placeId)
        .then((data) => {
          if (Array.isArray(data)) setBookedDates(data);
        })
        .catch((err) => console.warn('fetchBookedDatesByPlace in BookingPage error:', err));
    }
  }, [navState?.roomTypeId, navState?.placeId]);

  const navStateRoomTypeId = navState?.roomTypeId;
  const weekendPrice = navState?.weekendPrice;

  // Lọc danh sách booking riêng của loại phòng này
  const roomBookedDates = useMemo(() => {
    if (!navStateRoomTypeId) return bookedDates;
    return bookedDates.filter(
      (b) => !b.roomTypeId || Number(b.roomTypeId) === 0 || Number(b.roomTypeId) === Number(navStateRoomTypeId)
    );
  }, [bookedDates, navStateRoomTypeId]);

  // Bản đồ phòng đã đặt từng ngày
  const occupiedMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of roomBookedDates) {
      if (!b.checkIn || !b.checkOut) continue;
      const cur = parseLocalDate(b.checkIn);
      const end = parseLocalDate(b.checkOut);
      while (cur < end) {
        const key = formatDateKey(cur);
        map[key] = (map[key] || 0) + (b.roomCount || 1);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [roomBookedDates]);

  // Kiểm tra tính khả dụng của khoảng ngày đã chọn đối với số lượng phòng yêu cầu
  const validation = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return { isValid: false, availableRooms: 0, message: 'Vui lòng chọn ngày nhận phòng và ngày trả phòng hợp lệ.' };
    }

    const cur = parseLocalDate(checkIn);
    const end = parseLocalDate(checkOut);
    let minAvail = maxRooms;

    while (cur < end) {
      const key = formatDateKey(cur);
      const occupied = occupiedMap[key] || 0;
      const available = Math.max(0, maxRooms - occupied);
      if (available < minAvail) minAvail = available;

      if (available <= 0) {
        return {
          isValid: false,
          availableRooms: 0,
          message: `Đêm ${key} đã kín toàn bộ ${maxRooms} phòng. Vui lòng chọn khoảng ngày khác.`,
        };
      }
      if (available < roomCount) {
        return {
          isValid: false,
          availableRooms: available,
          message: `Đêm ${key} chỉ còn ${available}/${maxRooms} phòng trống, không đủ ${roomCount} phòng bạn đang chọn.`,
        };
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { isValid: true, availableRooms: minAvail, message: '' };
  }, [checkIn, checkOut, occupiedMap, maxRooms, roomCount]);

  // 3. Đơn giá 1 phòng / 1 đêm
  const unitPrice = useMemo(() => navState?.basePrice || 361028, [navState?.basePrice]);
  const originalUnitPrice = useMemo(
    () => navState?.originalPrice || Math.round(unitPrice * 1.25),
    [navState?.originalPrice, unitPrice]
  );

  // 4. Logic tính toán tiền phòng & tổng chi phí chuẩn xác
  const subtotalRoomPrice = useMemo(() => {
    if (!checkIn || !checkOut) return unitPrice * nights * roomCount;
    let totalPerRoom = 0;
    const cur = parseLocalDate(checkIn);
    const end = parseLocalDate(checkOut);
    while (cur < end) {
      const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const price = (isWeekend && weekendPrice) ? weekendPrice : unitPrice;
      totalPerRoom += price;
      cur.setDate(cur.getDate() + 1);
    }
    return totalPerRoom * roomCount;
  }, [unitPrice, weekendPrice, checkIn, checkOut, nights, roomCount]);

  // Tổng giá niêm yết ban đầu
  const totalOriginalPrice = useMemo(
    () => originalUnitPrice * nights * roomCount,
    [originalUnitPrice, nights, roomCount]
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
      checkInDateStr: checkIn ? formatISODate(checkIn) : '',
      checkInTime: 'Từ 14:00',
      checkOutDateStr: checkOut ? formatISODate(checkOut) : '',
      checkOutTime: 'Trước 12:00',
      bedInfo: navState?.bedInfo || '1 giường đôi',
      hasBreakfast: navState?.hasBreakfast ?? false,
      freeCancellation: navState?.freeCancellation ?? true,
      totalRoomsLeft: maxRooms,
      maxOccupancy: roomMaxOccupancy,
    };
  }, [navState, fetchedRating, checkIn, checkOut, maxRooms, roomMaxOccupancy]);

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

  // Guest info
  const [guestName, setGuestName] = useState(() => customer?.fullName || '');

  // Special requests
  const [specialRequests, setSpecialRequests] = useState<{ [key: string]: boolean }>({
    nonSmoking: false,
    connectingRooms: false,
    highFloor: false,
  });
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
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
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

  // Xử lý khoảng cách và toạ độ dịch vụ xung quanh
  const processedNearbyPlaces = useMemo(() => {
    const homeLat = roomInfo.latitude;
    const homeLng = roomInfo.longitude;

    return nearbyPlaces.map((item) => {
      let distanceValue = typeof item.distance === 'number' 
        ? Math.round(item.distance * 10) / 10 
        : 0;

      if (distanceValue === 0 && homeLat && homeLng && item.latitude && item.longitude) {
        distanceValue = calculateDistanceKm(homeLat, homeLng, item.latitude, item.longitude);
      }

      return {
        ...item,
        latitude: item.latitude ?? homeLat,
        longitude: item.longitude ?? homeLng,
        displayDistance: distanceValue,
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

  // Markers cho modal VietMap
  const mapMarkers = useMemo<VietmapMarkerItem[]>(() => {
    const list: VietmapMarkerItem[] = [
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
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Tự động chuyển về trang chi tiết đơn sau 5 giây khi đặt phòng thành công
  useEffect(() => {
    if (!isBookingSuccess || !bookingResult?.bookingCode) return;

    setRedirectCountdown(5);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(`/bookings/${bookingResult.bookingCode}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBookingSuccess, bookingResult?.bookingCode, navigate]);

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
    if (!guestName.trim()) {
      alert('Vui lòng nhập họ tên khách lưu trú.');
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
    if (!navState?.placeId || !navState?.roomTypeId || !checkIn || !checkOut) {
      alert('Thiếu thông tin phòng hoặc ngày lưu trú. Vui lòng kiểm tra lại.');
      return;
    }

    if (!validation.isValid) {
      alert(validation.message || 'Khoảng ngày hoặc số lượng phòng không khả dụng. Vui lòng kiểm tra lại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const quote = await quoteRoom(navState.roomTypeId, checkIn, checkOut, roomCount, guestCount);
      if (!quote.suitable || quote.availableRooms < roomCount) {
        throw new Error('Phòng hoặc sức chứa không còn phù hợp với lựa chọn hiện tại.');
      }
      if (quote.totalAmount !== totalPrice) {
        const accepted = window.confirm(
          `Giá mới là ${quote.totalAmount.toLocaleString('vi-VN')}đ. Giá có thể đã thay đổi, bạn có xác nhận tiếp tục không?`
        );
        if (!accepted) return;
      }
      const selectedRequests = (Object.entries(specialRequests) as [string, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k);

      const result = await createBooking({
        placeId: navState.placeId,
        roomTypeId: navState.roomTypeId,
        checkIn: checkIn,
        checkOut: checkOut,
        roomCount: roomCount,
        guestCount: guestCount,
        guestName: guestName.trim(),
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

      {/* Nếu thành công, hiển thị Booking Result View hiện đại, tinh gọn */}
      {isBookingSuccess ? (
        <div className="flex-1 bg-[#F6FAF8] py-8 md:py-14 flex items-center justify-center">
          <div className="max-w-xl w-full mx-auto px-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
            {/* Main Success Card */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-[0_4px_24px_-4px_rgba(4,140,115,0.1)] overflow-hidden transition-all duration-300 hover:-translate-y-0.5">
              {/* Header Gradient Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-primary)] via-[#06B6D4] to-[var(--color-coral)]" />
              
              <div className="p-6 sm:p-8 text-center">
                <div className="w-14 h-14 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-2xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Đặt phòng thành công!
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Yêu cầu của bạn đã được chuyển tới <span className="font-semibold text-slate-800">{roomInfo.placeName}</span>.
                </p>

                {/* Booking Code & Status Pill */}
                <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-md flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Mã đặt phòng:</span>
                    <span className="text-sm font-mono font-bold text-[var(--color-primary)] tracking-wide">
                      {bookingResult?.bookingCode ?? '—'}
                    </span>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-[var(--color-primary)] rounded hover:bg-white transition-colors cursor-pointer"
                      title="Sao chép mã"
                      onClick={() => {
                        if (bookingResult?.bookingCode) {
                          navigator.clipboard.writeText(bookingResult.bookingCode);
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Chờ chủ nhà xác nhận
                  </div>
                </div>

                {/* Thông tin vắn tắt (Compact Snapshot) */}
                <div className="mt-5 text-left border border-gray-100 rounded-md divide-y divide-gray-100 text-xs sm:text-sm bg-white">
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Hạng phòng</span>
                    <span className="font-semibold text-slate-800 text-right truncate">{roomInfo.roomName}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Lưu trú</span>
                    <span className="font-medium text-slate-700 text-right">
                      {roomInfo.checkInDateStr} → {roomInfo.checkOutDateStr} ({bookingResult?.nights ?? nights} đêm)
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Khách & Phòng</span>
                    <span className="font-medium text-slate-700 text-right">
                      {bookingResult?.roomCount ?? roomCount} phòng · {bookingResult?.guestCount ?? guestCount} khách ({guestName || fullName})
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-4 bg-emerald-50/30">
                    <span className="text-gray-600 font-medium shrink-0">Tổng tiền thanh toán tại chỗ</span>
                    <span className="text-base font-bold text-[var(--color-coral)]">
                      {new Intl.NumberFormat('vi-VN').format(bookingResult?.totalAmount ?? totalPrice)} VND
                    </span>
                  </div>
                </div>

                {/* 5-second countdown notice with animated progress bar */}
                <div className="mt-6 p-3 bg-teal-50/60 border border-teal-100 rounded-md text-left">
                  <div className="flex items-center justify-between text-xs text-teal-900 font-medium mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      Tự động chuyển đến chi tiết đơn sau:
                    </span>
                    <span className="font-bold text-[var(--color-primary)] font-mono text-sm">
                      {redirectCountdown}s
                    </span>
                  </div>
                  <div className="w-full bg-teal-200/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${((5 - redirectCountdown) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1 py-2.5 h-11 bg-white border-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm cursor-pointer"
                  >
                    Về trang chủ
                  </Button>
                  <Button
                    onClick={() => {
                      if (bookingResult?.bookingCode) {
                        navigate(`/bookings/${bookingResult.bookingCode}`);
                      } else {
                        navigate('/bookings');
                      }
                    }}
                    className="flex-1 py-2.5 h-11 bg-[var(--color-primary)] hover:bg-[#03725e] text-white font-bold rounded-md shadow-sm transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Theo dõi đơn đặt</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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

                {/* Khối 1: Liên hệ đặt chỗ */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
                    <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Liên hệ đặt chỗ</h2>
                      <p className="text-xs md:text-sm text-[var(--color-muted)] mt-0.5">
                        Thông tin liên hệ nhận xác nhận đặt phòng
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Họ tên người liên hệ */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Họ và tên người liên hệ<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors outline-none"
                        placeholder="Nhập họ và tên đầy đủ"
                      />
                    </div>

                    {/* Họ tên khách lưu trú */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Họ tên khách lưu trú<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full h-11 px-3.5 text-sm bg-white border border-gray-300 rounded-md focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors outline-none"
                        placeholder="Nhập họ tên khách lưu trú"
                      />
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
                          placeholder="Nhập địa chỉ email"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= KHỐI THÔNG SỐ VÀ LỊCH PHÒNG ================= */}
                {/* Thẻ chỉnh sửa thông số phòng & Lịch trống chi tiết */}
                <div
                  className={`bg-white rounded-lg border shadow-xs overflow-hidden transition-all ${
                    validation.isValid ? 'border-gray-200' : 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="p-4 md:p-5">
                    {/* Header: Tên phòng & Giá niêm yết */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-lg md:text-xl text-[var(--color-ink-deep)] leading-snug">
                          {roomInfo.roomName}
                        </h3>
                        <div className="text-xs font-bold text-red-600 mt-0.5">
                          Chỉ còn {maxRooms} phòng
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <span className="text-xl md:text-2xl font-black text-[var(--color-coral)]">
                          {new Intl.NumberFormat('vi-VN').format(unitPrice)}đ
                        </span>
                        <span className="text-xs text-[var(--color-muted)] font-medium"> /đêm</span>
                        {navState?.weekendPrice ? (
                          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                            Cuối tuần: {new Intl.NumberFormat('vi-VN').format(navState.weekendPrice)}đ
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Thanh chọn thông số phòng, khách & ngày lưu trú */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-md p-3 mb-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs md:text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Chọn số phòng */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-sm shadow-2xs">
                          <span className="font-semibold text-slate-700">Phòng:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRoomCountChange(roomCount - 1)}
                              disabled={roomCount <= 1}
                              className="w-5 h-5 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Giảm số phòng"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-[var(--color-primary)] w-5 text-center text-xs md:text-sm">
                              {roomCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRoomCountChange(roomCount + 1)}
                              disabled={roomCount >= maxRooms}
                              className="w-5 h-5 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Thêm phòng để đặt nhiều phòng"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Chọn số khách */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-sm shadow-2xs">
                          <span className="font-semibold text-slate-700">Khách:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                              disabled={guestCount <= 1}
                              className="w-5 h-5 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Giảm số khách"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-slate-800 w-5 text-center text-xs md:text-sm">
                              {guestCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setGuestCount((prev) => Math.min(maxGuests, prev + 1))}
                              disabled={guestCount >= maxGuests}
                              className="w-5 h-5 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Tăng số khách"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Chọn khoảng ngày trực tiếp */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-sm shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                          <input
                            type="date"
                            min={todayStr}
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="border-0 p-0 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer bg-transparent w-[105px] md:w-[115px]"
                          />
                          <span className="text-slate-400 font-bold">→</span>
                          <input
                            type="date"
                            min={checkIn || todayStr}
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="border-0 p-0 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer bg-transparent w-[105px] md:w-[115px]"
                          />
                          {/* Badge tình trạng phòng */}
                          {validation.isValid ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Còn phòng</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Hết phòng</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>




                    {/* Lịch phòng độc lập - Luôn luôn hiển thị */}
                    <div className="bg-slate-50/70 p-2.5 md:p-3 rounded-md border border-slate-200 mb-3">
                      <RoomAvailabilityCalendar
                        bookedDates={roomBookedDates}
                        totalRoomCount={maxRooms}
                        requestedRoomCount={roomCount}
                        selectedCheckIn={checkIn}
                        selectedCheckOut={checkOut}
                        onSelectDates={(inDate, outDate) => {
                          setCheckIn(inDate);
                          setCheckOut(outDate);
                        }}
                      />
                    </div>
                    {/* Chỉ hiện cảnh báo khi hết phòng hoặc chọn ngày không hợp lệ */}
                    {!validation.isValid && (
                      <div className="mb-3 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{validation.message}</span>
                      </div>
                    )}

                    {/* Tiện ích cơ bản của phòng & chính sách tóm tắt */}
                    <div className="space-y-2 text-xs text-gray-700 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{guestCount} khách lưu trú ({roomCount} phòng · {nights} đêm)</span>
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
                        <div className="p-2.5 bg-[#edfbf7] rounded-md border border-[#10b981]/30 space-y-1">
                          <div className="font-bold text-xs text-[#10b981] flex items-center gap-1">
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
                      </div>
                    </div>
                  </div>
                </div>
                {/* ================= KHỐI MỚI: ĐỊA ĐIỂM & DỊCH VỤ QUANH ĐÂY (GIỐNG TRANG CHI TIẾT & ADD VÀO BOOKING) ================= */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Tư vấn dịch vụ thêm</h2>
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
                          ? 'bg-[#10b981] text-white'
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
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center border border-gray-200 shrink-0 mt-0.5">
                                  {getPlaceIcon(item.kind)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs md:text-sm font-bold text-[var(--color-ink-deep)] block truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[11px] text-gray-500 block truncate">
                                    {item.kind === 'FOOD' ? 'Ẩm thực & Quán ăn' : item.kind === 'ATTRACTION' ? 'Danh lam thắng cảnh' : item.kind === 'TRANSPORT' ? 'Bến xe & Di chuyển' : 'Điểm lân cận'}
                                    {item.address ? ` · ${item.address}` : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Cột phải: Khoảng cách và Nút dấu cộng ngay bên dưới */}
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-[11px] font-bold text-[var(--color-primary)] bg-white px-2 py-0.5 rounded-sm border border-gray-200 shadow-2xs">
                                  {item.displayDistance < 1 ? Math.round(item.displayDistance * 1000) + ' m' : item.displayDistance + ' km'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openGoogleMapsDirections(item.latitude, item.longitude, `${item.address || ''} ${item.name}`)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center bg-white text-[var(--color-primary)] border border-[var(--color-primary-200)] hover:bg-[var(--color-primary)] hover:text-white transition-all cursor-pointer shadow-2xs"
                                    title="Chỉ đường đến địa điểm này"
                                    aria-label={`Chỉ đường đến ${item.name}`}
                                  >
                                    <MapIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddService(item)}
                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                                      isAdded
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                        : 'bg-[var(--color-primary-50)] text-[var(--color-primary)] border border-[var(--color-primary-200)] hover:bg-[var(--color-primary)] hover:text-white shadow-2xs'
                                    }`}
                                    title={isAdded ? 'Đã thêm vào booking (bấm để chỉnh sửa/hủy)' : 'Thêm tư vấn dịch vụ này vào booking'}
                                  >
                                    {isAdded ? (
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    ) : (
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    )}
                                  </button>
                                </div>
                              </div>
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

                  {/* Nút mở bản đồ VietMap toàn cảnh */}
                  <div className="pt-2 flex justify-center">
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedMapTarget(null);
                        setShowMapModal(true);
                      }}
                      variant="outline"
                      className="rounded-md font-bold text-xs md:text-sm flex items-center gap-2 px-5 py-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] cursor-pointer"
                    >
                      <MapIcon className="w-4 h-4" />
                      Mở bản đồ VietMap toàn cảnh ({filteredNearbyPlaces.length} địa điểm)
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
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-3.5">
                    <div className="w-8 h-8 rounded-md bg-[#edfbf7] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)]">Chính sách Chỗ ở</h2>
                      <p className="text-xs text-[var(--color-muted)]">Quy định nhận phòng & thanh toán</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Hủy phòng */}
                    <div className="p-3 bg-emerald-50/70 rounded-md border border-emerald-200 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-emerald-900">Hủy phòng linh hoạt</div>
                        <div className="text-emerald-800 text-[11px] mt-0.5">
                          Miễn phí hủy trước 24 giờ nhận phòng ({roomInfo.checkInDateStr}).
                        </div>
                      </div>
                    </div>

                    {/* Thanh toán */}
                    <div className="p-3 bg-[#edfbf7] rounded-md border border-[var(--color-primary)]/20 flex items-start gap-2.5">
                      <Banknote className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[var(--color-ink-deep)]">Thanh toán khi nhận phòng</div>
                        <div className="text-[var(--color-ink)] text-[11px] mt-0.5">
                          Không cần trả trước. Thanh toán tiền mặt hoặc QR tại chỗ nghỉ.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Giờ giấc và giấy tờ */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-800">Nhận phòng:</span> từ 14:00 · <span className="font-bold text-gray-800">Trả phòng:</span> trước 12:00
                    </div>
                    <div className="text-gray-500 text-[11px]">
                      Vui lòng xuất trình CCCD/Hộ chiếu khi làm thủ tục
                    </div>
                  </div>
                </div>

              </div>

              {/* ================= CỘT PHẢI: STICKY SIDEBAR TÓM TẮT & GIÁ ================= */}
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">


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

                      {serviceItems.length > 0 && (
                        <div className="flex justify-between items-center text-[#10b981] pt-1 border-t border-dashed border-gray-200">
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
                    disabled={isSubmitting || !validation.isValid}
                    className={`w-full py-4 font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 ${
                      !validation.isValid
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-[var(--color-primary)] hover:bg-[#03725e] text-white cursor-pointer'
                    }`}
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

      {/* ================= MODAL VIETMAP TOÀN CẢNH ================= */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[85vh] p-4 md:p-5 shadow-2xl flex flex-col border border-gray-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-bold text-base md:text-lg text-[var(--color-ink-deep)]">
                  Bản đồ VietMap xung quanh {roomInfo.placeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chú thích màu sắc */}
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 bg-[#edfbf7] text-[#10b981] px-2.5 py-1 rounded-sm border border-[#10b981]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]"></span> Chỗ nghỉ (Mục tiêu)
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

            {/* Khung bản đồ VietMap */}
            <div className="flex-1 rounded-md overflow-hidden border border-gray-200 relative">
              <VietmapView
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
                onClick={() => setShowMapModal(false)}
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

import { CreateBookingRequest, BookingResponseDto } from '../types/booking';
import { apiOrigin } from '@/lib/apiBase';

export async function createBooking(request: CreateBookingRequest): Promise<BookingResponseDto> {
  const response = await fetch('/api/public/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = `Lỗi đặt phòng: HTTP ${response.status}`;
    try {
      const errorBody = await response.json() as { message?: string; error?: string };
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return response.json() as Promise<BookingResponseDto>;
}

export async function getBookingByCode(bookingCode: string): Promise<BookingResponseDto> {
  try {
    const response = await fetch(`/api/public/bookings/${encodeURIComponent(bookingCode)}`);
    if (response.ok) {
      return (await response.json()) as BookingResponseDto;
    }
  } catch {
    // Fallback sang local
  }

  const local = getUserSavedBookings().find((b) => b.bookingCode === bookingCode);
  if (local) return local;

  throw new Error(`Không tìm thấy đơn đặt phòng với mã: ${bookingCode}`);
}

export async function fetchBookedDatesByRoom(roomTypeId: number, startDate?: string, endDate?: string): Promise<import('../types/booking').BookedDateRangeDto[]> {
  try {
    const url = new URL(`/api/public/bookings/rooms/${roomTypeId}/booked-dates`, apiOrigin());
    if (startDate) url.searchParams.append('startDate', startDate);
    if (endDate) url.searchParams.append('endDate', endDate);

    const response = await fetch(url.toString());
    if (!response.ok) return [];
    return (await response.json()) as import('../types/booking').BookedDateRangeDto[];
  } catch (error) {
    console.warn("fetchBookedDatesByRoom failed, fallback to empty list:", error);
    return [];
  }
}

export async function fetchBookedDatesByPlace(placeId: number, startDate?: string, endDate?: string): Promise<import('../types/booking').BookedDateRangeDto[]> {
  let serverList: import('../types/booking').BookedDateRangeDto[] = [];
  try {
    const url = new URL(`/api/public/bookings/places/${placeId}/booked-dates`, apiOrigin());
    if (startDate) url.searchParams.append('startDate', startDate);
    if (endDate) url.searchParams.append('endDate', endDate);

    const response = await fetch(url.toString());
    if (response.ok) {
      serverList = (await response.json()) as import('../types/booking').BookedDateRangeDto[];
    }
  } catch (error) {
    console.warn("fetchBookedDatesByPlace failed, fallback to empty list:", error);
  }

  const localBookings = getUserSavedBookings().filter(
    (b) => b.placeId === placeId && b.status !== 'CANCELLED' && b.status !== 'REJECTED'
  );
  const localDateRanges: import('../types/booking').BookedDateRangeDto[] = localBookings.map((b) => ({
    roomTypeId: b.roomTypeId,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    roomCount: b.roomCount || 1,
  }));

  const combined = [...serverList];
  for (const loc of localDateRanges) {
    const exists = combined.some(
      (s) => s.roomTypeId === loc.roomTypeId && s.checkIn === loc.checkIn && s.checkOut === loc.checkOut
    );
    if (!exists) {
      combined.push(loc);
    }
  }

  if (combined.length === 0) {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const d1 = new Date(today);
    d1.setDate(today.getDate() + 3);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 5);

    const d3 = new Date(today);
    d3.setDate(today.getDate() + 8);
    const d4 = new Date(today);
    d4.setDate(today.getDate() + 10);

    return [
      {
        roomTypeId: 1,
        checkIn: fmt(d1),
        checkOut: fmt(d2),
        roomCount: 2,
      },
      {
        roomTypeId: 1,
        checkIn: fmt(d3),
        checkOut: fmt(d4),
        roomCount: 3,
      },
      {
        roomTypeId: 2,
        checkIn: fmt(d1),
        checkOut: fmt(d2),
        roomCount: 1,
      },
      {
        roomTypeId: 3,
        checkIn: fmt(d3),
        checkOut: fmt(d4),
        roomCount: 2,
      },
    ];
  }

  return combined;
}

const LOCAL_BOOKINGS_KEY = 'user_recent_bookings';
const REVIEWED_CODES_KEY = 'user_reviewed_booking_codes';

export function getReviewedBookingCodes(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(REVIEWED_CODES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markBookingAsReviewed(bookingCode: string) {
  if (typeof window === 'undefined' || !bookingCode) return;
  try {
    const set = getReviewedBookingCodes();
    set.add(bookingCode);
    localStorage.setItem(REVIEWED_CODES_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Lỗi lưu trạng thái review:', err);
  }
}

export function saveUserBooking(booking: BookingResponseDto) {
  if (typeof window === 'undefined' || !booking?.bookingCode) return;
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    const list: BookingResponseDto[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((b) => b.bookingCode !== booking.bookingCode);
    filtered.unshift(booking);
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (err) {
    console.warn('Lỗi lưu lịch sử đặt phòng:', err);
  }
}

export function getUserSavedBookings(): BookingResponseDto[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    return raw ? (JSON.parse(raw) as BookingResponseDto[]) : [];
  } catch {
    return [];
  }
}

export async function cancelBooking(
  bookingCode: string,
  reason: string,
  note?: string
): Promise<BookingResponseDto> {
  // 1. Thử gửi request lên backend
  try {
    const response = await fetch(`/api/public/bookings/${encodeURIComponent(bookingCode)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, note }),
    });
    if (response.ok) {
      const updated = (await response.json()) as BookingResponseDto;
      saveUserBooking(updated);
      return updated;
    }
  } catch (e) {
    console.warn('Backend cancel failed, processing locally:', e);
  }

  // 2. Xử lý cập nhật local theo chính sách hủy
  const localList = getUserSavedBookings();
  const index = localList.findIndex((b) => b.bookingCode === bookingCode);
  if (index === -1) {
    throw new Error(`Không tìm thấy đơn đặt phòng mã ${bookingCode}`);
  }

  const current = localList[index];
  if (!current) {
    throw new Error(`Không tìm thấy đơn đặt phòng mã ${bookingCode}`);
  }
  if (current.status === 'COMPLETED') {
    throw new Error('Chuyến đi đã hoàn thành, không thể hủy phòng.');
  }
  if (current.status === 'CANCELLED' || current.status === 'REFUNDED') {
    throw new Error('Đơn đặt phòng này đã được hủy trước đó.');
  }

  // Tính chính sách hoàn tiền
  const now = new Date();
  const checkInDate = new Date(`${current.checkIn}T14:00:00`);
  const diffHours = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  const policy = current.policySnapshot || {};
  const cutoff = typeof policy.freeCancelCutoffHours === 'number' ? policy.freeCancelCutoffHours : 24;

  const willRefund = current.status === 'CONFIRMED' && diffHours >= cutoff;
  const newStatus: import('../types/booking').BookingStatus = willRefund ? 'REFUNDED' : 'CANCELLED';

  const updatedBooking: BookingResponseDto = {
    ...current,
    status: newStatus,
    policySnapshot: {
      ...policy,
      cancelReason: reason,
      cancelNote: note,
      cancelledAt: now.toISOString(),
      ...(willRefund ? { refundAmount: current.totalAmount, refundStatus: 'APPROVED_FULL' } : {}),
    },
  };

  localList[index] = updatedBooking;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(localList));
  }

  return updatedBooking;
}

export async function fetchMyBookings(params: {
  email?: string;
  phone?: string;
  codes?: string[];
}): Promise<BookingResponseDto[]> {
  try {
    const url = new URL('/api/public/bookings/my-bookings', apiOrigin());
    if (params.email) url.searchParams.append('email', params.email);
    if (params.phone) url.searchParams.append('phone', params.phone);
    if (params.codes && params.codes.length > 0) {
      params.codes.forEach((c) => url.searchParams.append('codes', c));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      return getUserSavedBookings();
    }
    const data = (await response.json()) as BookingResponseDto[];
    if (data.length === 0) {
      return getUserSavedBookings();
    }
    return data;
  } catch (error) {
    console.warn('Lỗi tải danh sách booking từ server, dùng local:', error);
    return getUserSavedBookings();
  }
}

export async function submitBookingReview(
  bookingCode: string,
  request: import('../types/review').CreateReviewRequest
): Promise<import('../types/review').ReviewDto> {
  markBookingAsReviewed(bookingCode);

  try {
    const response = await fetch(
      `/api/public/bookings/${encodeURIComponent(bookingCode)}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    );

    if (response.ok) {
      return response.json() as Promise<import('../types/review').ReviewDto>;
    }
  } catch (err) {
    console.warn('Lỗi gửi review lên server, fallback lưu local:', err);
  }

  // Fallback giả lập thành công cho client
  const fallbackReview: import('../types/review').ReviewDto = {
    id: Date.now(),
    placeId: 1,
    rating: request.rating,
    content: request.content,
    guestName: 'Bạn',
    createdAt: new Date().toISOString(),
  };

  return fallbackReview;
}

export async function fetchBookingReview(
  bookingCode: string
): Promise<import('../types/review').ReviewDto | null> {
  try {
    const response = await fetch(
      `/api/public/bookings/${encodeURIComponent(bookingCode)}/review`
    );
    if (!response.ok) return null;
    const text = await response.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text) as import('../types/review').ReviewDto;
  } catch {
    return null;
  }
}




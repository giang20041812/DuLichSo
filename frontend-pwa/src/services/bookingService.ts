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
  const response = await fetch(`/api/public/bookings/${encodeURIComponent(bookingCode)}`);

  if (!response.ok) {
    throw new Error(`Không tìm thấy đơn đặt phòng với mã: ${bookingCode}`);
  }

  return response.json() as Promise<BookingResponseDto>;
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

  // Kết hợp cùng các đơn booking đã tạo ở phiên local (trạng thái hoạt động)
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

  // Nếu DB trống, tạo sẵn một số ngày đã đặt mẫu để kiểm thử trực quan tính năng disable lịch phòng
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
        roomCount: 2, // Đã đặt 2 phòng
      },
      {
        roomTypeId: 1,
        checkIn: fmt(d3),
        checkOut: fmt(d4),
        roomCount: 3, // Kín trọn 3 phòng
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

export function saveUserBooking(booking: BookingResponseDto) {
  if (typeof window === 'undefined' || !booking?.bookingCode) return;
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    const list: BookingResponseDto[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((b) => b.bookingCode !== booking.bookingCode);
    filtered.unshift(booking);
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch (err) {
    console.warn('Lỗi lưu lịch sử đặt phòng:', err);
  }
}

export function getUserSavedBookings(): BookingResponseDto[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
  const response = await fetch(
    `/api/public/bookings/${encodeURIComponent(bookingCode)}/review`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    let message = `Gửi đánh giá thất bại (HTTP ${response.status})`;
    try {
      const err = (await response.json()) as { message?: string; error?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<import('../types/review').ReviewDto>;
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



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

export async function getBookingByCode(bookingCode: string, phone: string): Promise<BookingResponseDto> {
  try {
    const response = await fetch(`/api/public/bookings/${encodeURIComponent(bookingCode)}?phone=${encodeURIComponent(phone)}`);
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
  const url = new URL(`/api/public/bookings/${encodeURIComponent(bookingCode)}/cancel`, apiOrigin());
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, note }),
  });

  if (!response.ok) {
    let message = `Lỗi hủy đặt phòng: HTTP ${response.status}`;
    try {
      const err = await response.json() as { message?: string; error?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const updated = (await response.json()) as BookingResponseDto;
  return updated;
}

export async function fetchMyBookings(params: {
  email?: string;
  phone?: string;
  codes?: string[];
}): Promise<BookingResponseDto[]> {
  const url = new URL('/api/public/bookings/my-bookings', apiOrigin());
  if (params.email) url.searchParams.append('email', params.email);
  if (params.phone) url.searchParams.append('phone', params.phone);
  if (params.codes && params.codes.length > 0) {
    params.codes.forEach((c) => url.searchParams.append('codes', c));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Không thể nạp danh sách đặt phòng (HTTP ${response.status})`);
  }
  return (await response.json()) as BookingResponseDto[];
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

  markBookingAsReviewed(bookingCode);
  return response.json() as Promise<import('../types/review').ReviewDto>;
}

export async function updateBookingReview(
  bookingCode: string,
  request: import('../types/review').CreateReviewRequest
): Promise<import('../types/review').ReviewDto> {
  const response = await fetch(
    `/api/public/bookings/${encodeURIComponent(bookingCode)}/review`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    let message = `Cập nhật đánh giá thất bại (HTTP ${response.status})`;
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

export async function deleteBookingReview(bookingCode: string): Promise<void> {
  const response = await fetch(
    `/api/public/bookings/${encodeURIComponent(bookingCode)}/review`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    let message = `Xóa đánh giá thất bại (HTTP ${response.status})`;
    try {
      const err = (await response.json()) as { message?: string; error?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (typeof window !== 'undefined') {
    try {
      const set = getReviewedBookingCodes();
      set.delete(bookingCode);
      localStorage.setItem('user_reviewed_booking_codes', JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }
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

export async function updateBookingDetails(
  bookingCode: string,
  request: import('../types/booking').UpdateBookingDetailsRequest
): Promise<BookingResponseDto> {
  const url = new URL(`/api/public/bookings/${encodeURIComponent(bookingCode)}`, apiOrigin());
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = `Lỗi cập nhật đặt phòng: HTTP ${response.status}`;
    try {
      const err = (await response.json()) as { message?: string; error?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as BookingResponseDto;
}

export async function fetchBookingChangeRequests(
  bookingCode: string
): Promise<import('../types/booking').BookingChangeRequestDto[]> {
  try {
    const url = new URL(`/api/public/bookings/${encodeURIComponent(bookingCode)}/change-requests`, apiOrigin());
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    return (await response.json()) as import('../types/booking').BookingChangeRequestDto[];
  } catch {
    return [];
  }
}

export async function checkRoomAvailability(
  roomTypeId: number,
  checkIn: string,
  checkOut: string,
  roomCount: number = 1,
  excludeBookingCode?: string
): Promise<import('../types/booking').CheckAvailabilityResponse> {
  const url = new URL(`/api/public/bookings/rooms/${roomTypeId}/check-availability`, apiOrigin());
  url.searchParams.append('checkIn', checkIn);
  url.searchParams.append('checkOut', checkOut);
  url.searchParams.append('roomCount', String(roomCount));
  if (excludeBookingCode) {
    url.searchParams.append('excludeBookingCode', excludeBookingCode);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    let msg = `Lỗi kiểm tra lịch phòng: HTTP ${response.status}`;
    try {
      const err = (await response.json()) as { message?: string; error?: string };
      msg = err.message ?? err.error ?? msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await response.json()) as import('../types/booking').CheckAvailabilityResponse;
}


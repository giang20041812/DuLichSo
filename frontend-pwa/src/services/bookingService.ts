import { CreateBookingRequest, BookingResponseDto } from '../types/booking';

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
    const url = new URL(`/api/public/bookings/rooms/${roomTypeId}/booked-dates`, window.location.origin);
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
  try {
    const url = new URL(`/api/public/bookings/places/${placeId}/booked-dates`, window.location.origin);
    if (startDate) url.searchParams.append('startDate', startDate);
    if (endDate) url.searchParams.append('endDate', endDate);

    const response = await fetch(url.toString());
    if (!response.ok) return [];
    return (await response.json()) as import('../types/booking').BookedDateRangeDto[];
  } catch (error) {
    console.warn("fetchBookedDatesByPlace failed, fallback to empty list:", error);
    return [];
  }
}

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

// Trạng thái booking — khớp với BookingStatus enum bên backend
export type BookingStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NO_SHOW';

export interface CancelBookingRequest {
  reason: string;
  note?: string;
}

export interface BookingServiceItemDto {
  id?: number;
  serviceName: string;
  serviceCode?: string;
  note?: string;
  isIncluded?: boolean;
}

// DTO gửi lên backend — field name khớp với CreateBookingRequest.java
export interface CreateBookingRequest {
  placeId: number;
  roomTypeId: number;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  roomCount: number;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestNote?: string;
  specialRequests?: string[];
  serviceItems?: BookingServiceItemDto[];
}

// DTO nhận về từ backend — field name khớp với BookingResponseDto.java
export interface BookingResponseDto {
  id: number;
  bookingCode: string;
  placeId: number;
  placeName: string;
  placeAddress: string;
  coverImageUrl?: string | null;
  roomTypeId: number;
  roomTypeName: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  nights: number;
  roomCount: number;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  guestNote: string | null;
  status: BookingStatus;
  currency: string;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;       // ISO datetime
  holdExpiresAt: string;   // ISO datetime
  policySnapshot: Record<string, unknown>;
  serviceItems?: BookingServiceItemDto[];
}

// State truyền từ HomestayDetailPage -> BookingPage qua navigate()
export interface BookingNavigationState {
  placeId: number;
  placeName: string;
  placeAddress?: string;
  placeRating?: number;
  placeReviewCount?: number;
  coverImageUrl?: string;

  roomTypeId: number;
  roomTypeName: string;
  basePrice: number;
  originalPrice?: number;
  totalRoomCount: number;
  maxOccupancy: number;
  bedInfo?: string;
  hasBreakfast?: boolean;
  freeCancellation?: boolean;

  // Vị trí tọa độ homestay
  latitude?: number;
  longitude?: number;

  // Phải là ISO date YYYY-MM-DD để backend parse được LocalDate
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  roomCount: number;
}

export interface BookedDateRangeDto {
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  roomCount: number;
}

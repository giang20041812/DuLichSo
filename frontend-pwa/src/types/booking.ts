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

export interface BookingChangeRequestDto {
  id: number;
  bookingId: number;
  bookingCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  guestNote?: string;
  checkIn?: string;
  checkOut?: string;
  roomCount?: number;
  guestCount?: number;
  reason?: string;
  rejectionReason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  createdAt: string;
}

export interface UpdateBookingDetailsRequest {
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  guestNote?: string;
  checkIn?: string;
  checkOut?: string;
  roomCount?: number;
  guestCount?: number;
  reason?: string;
  serviceItems?: BookingServiceItemDto[];
}

export interface CheckAvailabilityResponse {
  available: boolean;
  requestedRooms: number;
  minAvailableRooms: number;
  message: string;
}

// DTO nhận về từ backend — field name khớp với BookingResponseDto.java
export interface BookingResponseDto {
  id: number;
  bookingCode: string;
  placeId: number;
  placeName: string;
  placeAddress: string;
  latitude?: number | null;
  longitude?: number | null;
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
  changeRequests?: BookingChangeRequestDto[];
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
  weekendPrice?: number;
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

// ---- Nhà cung cấp xử lý đơn — khớp PartnerBookingDtos.java ----

export type BookingActorType = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SYSTEM';
export type BookingCheckLevel = 'OK' | 'WARN' | 'FAIL';

export interface BookingCheckDto {
  code: string;
  label: string;
  level: BookingCheckLevel;
  detail: string;
}

export interface BookingNightPriceDto {
  stayDate: string;
  unitPrice: number;
  roomCount: number;
}

export interface BookingHistoryDto {
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actor: BookingActorType;
  reason: string | null;
  createdAt: string;
}

export interface BookingRoomOptionDto {
  roomTypeId: number;
  name: string;
  maxOccupancy: number | null;
  current: boolean;
  availableRooms: number;
  capacityOk: boolean;
  suitable: boolean;
  totalAmount: number | null;
  unavailableReason: string | null;
}

export interface PartnerBookingDetailDto {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  placeId: number;
  placeName: string;
  roomTypeId: number;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomCount: number;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  guestNote: string | null;
  totalAmount: number;
  currency: string;
  createdAt: string;
  holdExpiresAt: string | null;
  paymentDeadlineAt: string | null;
  confirmedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  policySnapshot: Record<string, unknown>;
  nightPrices: BookingNightPriceDto[];
  serviceItems: { serviceName: string; note: string | null }[];
  history: BookingHistoryDto[];
  infoRequests: BookingInfoRequestDto[];
  checks: BookingCheckDto[];
  roomOptions: BookingRoomOptionDto[];
  canAccept: boolean;
  canReject: boolean;
  canRequestInfo: boolean;
  stayActions: StayAction[];
}

/** roomTypeId null = giữ loại phòng khách đã chọn. */
export interface AcceptBookingInput {
  roomTypeId: number | null;
  note: string;
}

export interface RejectBookingInput {
  reason: string;
}

/** FR-NCC-14 — khớp PartnerBookingDtos.InfoRequestDto */
export interface BookingInfoRequestDto {
  id: number;
  message: string;
  createdAt: string;
  responseText: string | null;
  respondedAt: string | null;
}

export interface InfoRequestInput {
  message: string;
}

/** Vận hành lưu trú của NCC — khớp PartnerBookingDtos.StayAction */
export type StayAction = 'CHECK_IN' | 'CHECK_OUT' | 'COMPLETE' | 'NO_SHOW';

export interface StayActionInput {
  action: StayAction;
  note?: string;
}

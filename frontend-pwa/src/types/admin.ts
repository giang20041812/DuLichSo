/**
 * Types cho module Quản trị hệ thống (Admin Portal).
 * Tên field khớp 100% với các DTOs ở backend-api:
 * AdminAccountDtos, AdminProviderDtos, AdminPlaceDtos, AdminDashboardDtos.
 */

export type AccountRole = 'ADMIN' | 'PROVIDER' | 'CUSTOMER';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';
export type ProviderStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
export type PlaceVisibility = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
export type PlaceOperationStatus = 'OPERATING' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';
export type PlaceVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'NEEDS_UPDATE' | 'ARCHIVED';
/** Khớp enum CategoryKind ở backend — định nghĩa gốc nằm ở types/home.ts. */
export type { CategoryKind } from './home';
import type { CategoryKind } from './home';

export interface AdminAccountDto {
  id: number;
  /** null với tài khoản NCC cũ chỉ đăng nhập bằng SĐT. */
  email: string | null;
  phone?: string | null;
  /** null khi tài khoản chưa cập nhật họ tên. */
  fullName: string | null;
  role: AccountRole;
  status: AccountStatus;
  providerId?: number;
  providerName?: string;
  lastLoginAt?: string;
  createdAt: string;
}

/** Khớp Spring Data Page<T> trả về từ backend-api. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Khớp AdminTravelerService.TravelerDto */
export type TravelerSignupMethod = 'GOOGLE' | 'EMAIL';

export interface AdminTravelerDto {
  id: number;
  email: string;
  phone?: string | null;
  fullName?: string | null;
  pictureUrl?: string | null;
  status: AccountStatus;
  signupMethod: TravelerSignupMethod;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface AccountSearchParams {
  role?: AccountRole;
  status?: AccountStatus;
  keyword?: string;
  providerStatus?: ProviderStatus;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface TravelerSearchParams {
  status?: AccountStatus;
  keyword?: string;
  signupMethod?: TravelerSignupMethod;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface CreateAdminAccountRequest {
  email: string;
  phone: string;
  password: string;
  fullName: string;
}

export interface UpdateAccountRequest {
  email?: string;
  phone?: string;
  fullName?: string;
}

export interface UpdateAccountStatusRequest {
  status: AccountStatus;
  reason?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  reason?: string;
}

export interface AdminProviderSummaryDto {
  id: number;
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  note?: string;
  status: ProviderStatus;
  placeCount: number;
  accountCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Khớp AdminProviderDtos.ProviderAccountDto (backend). Không có mật khẩu: backend chỉ lưu băm BCrypt. */
export interface ProviderAccountDto {
  id: number;
  email: string;
  phone?: string | null;
  fullName: string;
  status: string | null;
  lastLoginAt?: string | null;
}

export interface CreateProviderWithAccountRequest {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  note?: string;
  accountEmail: string;
  accountPhone?: string;
  accountPassword: string;
  accountFullName: string;
}

export interface UpdateProviderRequest {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  note?: string;
}

export interface UpdateProviderStatusRequest {
  status: ProviderStatus;
  reason?: string;
}

export interface AdminPlaceSummaryDto {
  id: number;
  slug: string;
  name: string;
  kind: CategoryKind;
  categoryId?: number;
  categoryName?: string;
  providerId?: number;
  providerName?: string;
  regionId?: number;
  regionName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  priceRefMin?: number;
  priceRefMax?: number;
  visibility: PlaceVisibility;
  operationStatus: PlaceOperationStatus;
  verification: PlaceVerificationStatus;
  lastVerifiedAt?: string;
  ratingAvg?: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceSearchParams {
  keyword?: string;
  visibility?: PlaceVisibility;
  verification?: PlaceVerificationStatus;
  kind?: CategoryKind;
  providerId?: number;
  regionId?: number;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export type PlaceVerificationSummary = Record<PlaceVerificationStatus, number>;

export interface UpdatePlaceVerificationRequest {
  verification: PlaceVerificationStatus;
  reason?: string;
}

export interface UpdatePlaceVisibilityRequest {
  visibility: PlaceVisibility;
  reason?: string;
}

export interface AdminDashboardSummaryDto {
  totalPlaces: number;
  unverifiedPlaces: number;
  totalProviders: number;
  activeProviders: number;
  suspendedProviders: number;
  totalAccounts: number;
  activeAccounts: number;
  monthlyBookingsCount: number;
  monthlyRevenue: number;
  pendingRefundsCount: number;
  terminatedProviders: number;
  needsUpdatePlaces: number;
  pendingSosCount: number;
  totalTravelers: number;
  newTravelers7d: number;
  newTravelers30d: number;
  lockedTravelers: number;
  revenueTrend: MonthlyRevenuePoint[];
  /** Giá trị đặt phòng (GMV) 6 tháng — dùng thay khi doanh thu đối soát = 0đ. */
  gmvTrend?: MonthlyRevenuePoint[];
}

/** Khớp AdminDashboardDtos.AuditLogEntryDto */
export interface AuditLogEntryDto {
  id: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  reason: string | null;
  actorName: string;
  createdAt: string;
}

/** Khớp AdminPlaceDtos.AdminPlaceDetailDto */
export interface AdminPlaceDetailDto {
  id: number;
  slug: string;
  name: string;
  kind: CategoryKind;
  categoryId?: number | null;
  categoryName?: string | null;
  providerId?: number | null;
  providerName?: string | null;
  regionId?: number | null;
  regionName?: string | null;
  address?: string | null;
  description?: string | null;
  accessNote?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceRefMin?: number | null;
  priceRefMax?: number | null;
  priceUnitNote?: string | null;
  visibility: PlaceVisibility;
  operationStatus: PlaceOperationStatus;
  verification: PlaceVerificationStatus;
  lastVerifiedAt?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  attributes?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyRevenuePoint {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
}

/** Khớp AdminBookingService.BookingDto */
export type BookingStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface AdminBookingDto {
  id: number;
  bookingCode: string;
  placeId: number;
  placeName: string;
  roomTypeName: string;
  providerId: number;
  providerName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomCount: number;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  guestNote?: string | null;
  status: BookingStatus;
  totalAmount?: number | null;
  currency?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
  closedAt?: string | null;
  closeReason?: string | null;
}

export interface BookingSearchParams {
  status?: BookingStatus;
  keyword?: string;
  /** Lọc theo khách: tên, SĐT hoặc email */
  guest?: string;
  /** Lọc theo tên homestay */
  place?: string;
  placeId?: number;
  providerId?: number;
  checkInFrom?: string;
  checkInTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export type BookingStatusSummary = Record<BookingStatus, number>;

// ─────────────────────────────────────────────
// Giám sát Booking (khớp AdminBookingMonitorService)
// ─────────────────────────────────────────────
export type BookingAttentionReason = 'PENDING_STALE' | 'PAYMENT_OVERDUE' | 'STAY_UNRESOLVED' | 'FOLLOW_UP';

export interface BookingAttentionItem {
  booking: AdminBookingDto;
  reason: BookingAttentionReason;
  reasonLabel: string;
}

export type BookingNoteKind = 'VERIFICATION' | 'OUTCOME';
export type BookingNoteOutcome = 'NO_ISSUE' | 'SUPPORTED' | 'ESCALATED' | 'FOLLOW_UP';

export interface BookingNoteDto {
  id: number;
  kind: BookingNoteKind;
  outcome: BookingNoteOutcome | null;
  content: string;
  adminName: string | null;
  createdAt: string;
}

export interface BookingHistoryDto {
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actor: string | null;
  actorId: number | null;
  reason: string | null;
  createdAt: string;
}

export interface BookingServiceItemDto {
  serviceName: string;
  serviceCode: string | null;
  note: string | null;
  included: boolean | null;
}

export interface BookingPaymentDto {
  id: number;
  gateway: string;
  externalTxnId: string | null;
  amount: number;
  currency: string;
  status: string;
  initiatedAt: string;
  paidAt: string | null;
}

export interface AdminBookingDetailDto {
  booking: AdminBookingDto;
  holdExpiresAt: string | null;
  paymentDeadlineAt: string | null;
  closedByActor: string | null;
  history: BookingHistoryDto[];
  services: BookingServiceItemDto[];
  payments: BookingPaymentDto[];
  notes: BookingNoteDto[];
  attention: BookingAttentionReason[];
}

export interface AddBookingNoteRequest {
  kind: BookingNoteKind;
  outcome?: BookingNoteOutcome;
  content: string;
}

// ─────────────────────────────────────────────
// Báo cáo (khớp AdminReportService)
// ─────────────────────────────────────────────
export type ReportGroup = 'ALL' | 'CONFIRMED' | 'OPEN' | 'LOST';

export interface ReportSearchParams {
  from?: string;
  to?: string;
  providerId?: number;
  group?: ReportGroup;
}

export interface ReportKpi {
  totalBookings: number;
  confirmedBookings: number;
  openBookings: number;
  lostBookings: number;
  bookingValue: number;
  averageValue: number;
  paidRevenue: number;
  confirmationRate: number;
  /** null khi đang lọc theo một NCC */
  newProviders: number | null;
  newPlaces: number | null;
}

export interface ReportSeriesPoint {
  key: string;
  label: string;
  from: string;
  to: string;
  bookings: number;
  value: number;
}

export interface ReportTopProvider {
  id: number;
  name: string;
  bookings: number;
  value: number;
}

export interface ReportTopPlace {
  id: number;
  name: string;
  providerId: number;
  providerName: string;
  bookings: number;
  value: number;
}

export interface AdminOverviewReport {
  from: string;
  to: string;
  providerId: number | null;
  granularity: 'DAY' | 'MONTH';
  kpi: ReportKpi;
  byStatus: { status: BookingStatus; count: number }[];
  series: ReportSeriesPoint[];
  topProviders: ReportTopProvider[];
  topPlaces: ReportTopPlace[];
}

export interface CreateTravelerRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

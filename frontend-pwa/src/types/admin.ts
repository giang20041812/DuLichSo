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
export type CategoryKind = 'HOMESTAY' | 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'ACTIVITY' | 'TRANSPORT';

export interface AdminAccountDto {
  id: number;
  email: string;
  phone?: string;
  fullName: string;
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

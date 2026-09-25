import axios from 'axios';
import type {
  AdminAccountDto,
  CreateAdminAccountRequest,
  UpdateAccountRequest,
  UpdateAccountStatusRequest,
  ResetPasswordRequest,
  AdminProviderSummaryDto,
  CreateProviderWithAccountRequest,
  UpdateProviderRequest,
  UpdateProviderStatusRequest,
  AdminPlaceSummaryDto,
  UpdatePlaceVerificationRequest,
  UpdatePlaceVisibilityRequest,
  AdminDashboardSummaryDto,
  AccountStatus,
  ProviderStatus,
  PlaceVerificationStatus,
  PageResponse,
  AdminBookingDto,
  BookingSearchParams,
  BookingStatusSummary,
  PlaceSearchParams,
  PlaceVerificationSummary,
  AdminTravelerDto,
  AccountSearchParams,
  TravelerSearchParams,
} from '../types/admin';
import type { BookingStatus } from '../types/booking';

const API_BASE = '/api/v1/admin';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null;
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

// ─────────────────────────────────────────────
// 1. Dashboard Summary
// ─────────────────────────────────────────────
export const adminService = {
  async getDashboardSummary(): Promise<AdminDashboardSummaryDto> {
    const res = await axios.get<AdminDashboardSummaryDto>(`${API_BASE}/dashboard/summary`, getAuthHeaders());
    return res.data;
  },

  // ─────────────────────────────────────────────
  // 2. Quản lý Tài khoản (/accounts)
  // ─────────────────────────────────────────────
  async getAccounts(params?: AccountSearchParams): Promise<PageResponse<AdminAccountDto>> {
    const res = await axios.get<PageResponse<AdminAccountDto>>(`${API_BASE}/accounts`, {
      ...getAuthHeaders(),
      params,
    });
    return res.data;
  },

  async getTravelers(params?: TravelerSearchParams): Promise<PageResponse<AdminTravelerDto>> {
    const res = await axios.get<PageResponse<AdminTravelerDto>>(`${API_BASE}/travelers`, {
      ...getAuthHeaders(),
      params,
    });
    return res.data;
  },

  async updateTravelerStatus(id: number, data: { status: AccountStatus; reason?: string }): Promise<AdminTravelerDto> {
    const res = await axios.patch<AdminTravelerDto>(`${API_BASE}/travelers/${id}/status`, data, getAuthHeaders());
    return res.data;
  },

  async getAccountById(id: number): Promise<AdminAccountDto> {
    const res = await axios.get<AdminAccountDto>(`${API_BASE}/accounts/${id}`, getAuthHeaders());
    return res.data;
  },

  async createAdminAccount(data: CreateAdminAccountRequest): Promise<AdminAccountDto> {
    const res = await axios.post<AdminAccountDto>(`${API_BASE}/accounts`, data, getAuthHeaders());
    return res.data;
  },

  async updateAccount(id: number, data: UpdateAccountRequest): Promise<AdminAccountDto> {
    const res = await axios.put<AdminAccountDto>(`${API_BASE}/accounts/${id}`, data, getAuthHeaders());
    return res.data;
  },

  async updateAccountStatus(id: number, data: UpdateAccountStatusRequest): Promise<AdminAccountDto> {
    const res = await axios.patch<AdminAccountDto>(`${API_BASE}/accounts/${id}/status`, data, getAuthHeaders());
    return res.data;
  },

  async resetPassword(id: number, data: ResetPasswordRequest): Promise<void> {
    await axios.patch(`${API_BASE}/accounts/${id}/reset-password`, data, getAuthHeaders());
  },

  // ─────────────────────────────────────────────
  // 3. Quản lý Đối tác / NCC (/providers)
  // ─────────────────────────────────────────────
  async getProviders(status?: ProviderStatus): Promise<AdminProviderSummaryDto[]> {
    const res = await axios.get<AdminProviderSummaryDto[]>(`${API_BASE}/providers`, {
      ...getAuthHeaders(),
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  async getProviderById(id: number): Promise<AdminProviderSummaryDto> {
    const res = await axios.get<AdminProviderSummaryDto>(`${API_BASE}/providers/${id}`, getAuthHeaders());
    return res.data;
  },

  async createProviderWithAccount(data: CreateProviderWithAccountRequest): Promise<AdminProviderSummaryDto> {
    const res = await axios.post<AdminProviderSummaryDto>(`${API_BASE}/providers`, data, getAuthHeaders());
    return res.data;
  },

  async updateProvider(id: number, data: UpdateProviderRequest): Promise<AdminProviderSummaryDto> {
    const res = await axios.put<AdminProviderSummaryDto>(`${API_BASE}/providers/${id}`, data, getAuthHeaders());
    return res.data;
  },

  async updateProviderStatus(id: number, data: UpdateProviderStatusRequest): Promise<AdminProviderSummaryDto> {
    const res = await axios.patch<AdminProviderSummaryDto>(`${API_BASE}/providers/${id}/status`, data, getAuthHeaders());
    return res.data;
  },

  // ─────────────────────────────────────────────
  // 4. Kiểm duyệt Điểm đến (/places)
  // ─────────────────────────────────────────────
  async getPlaces(params?: PlaceSearchParams): Promise<PageResponse<AdminPlaceSummaryDto>> {
    const res = await axios.get<PageResponse<AdminPlaceSummaryDto>>(`${API_BASE}/places`, {
      ...getAuthHeaders(),
      params,
    });
    return res.data;
  },

  async getBookings(params?: BookingSearchParams): Promise<PageResponse<AdminBookingDto>> {
    const res = await axios.get<PageResponse<AdminBookingDto>>(`${API_BASE}/bookings`, {
      ...getAuthHeaders(),
      params,
    });
    return res.data;
  },

  async getBookingsSummary(): Promise<BookingStatusSummary> {
    const res = await axios.get<BookingStatusSummary>(`${API_BASE}/bookings/summary`, getAuthHeaders());
    return res.data;
  },

  async updateBookingStatus(id: number, status: BookingStatus, reason?: string): Promise<AdminBookingDto> {
    const res = await axios.put<AdminBookingDto>(`${API_BASE}/bookings/${id}/status`, { status, reason }, getAuthHeaders());
    return res.data;
  },

  async getPlacesSummary(): Promise<PlaceVerificationSummary> {
    const res = await axios.get<PlaceVerificationSummary>(`${API_BASE}/places/summary`, getAuthHeaders());
    return res.data;
  },

  async bulkUpdatePlaceVerification(data: {
    ids: number[];
    verification: PlaceVerificationStatus;
    reason?: string;
  }): Promise<{ updated: number }> {
    const res = await axios.patch<{ updated: number }>(`${API_BASE}/places/verification/bulk`, data, getAuthHeaders());
    return res.data;
  },

  async updatePlaceVerification(id: number, data: UpdatePlaceVerificationRequest): Promise<AdminPlaceSummaryDto> {
    const res = await axios.patch<AdminPlaceSummaryDto>(`${API_BASE}/places/${id}/verification`, data, getAuthHeaders());
    return res.data;
  },

  async updatePlaceVisibility(id: number, data: UpdatePlaceVisibilityRequest): Promise<AdminPlaceSummaryDto> {
    const res = await axios.patch<AdminPlaceSummaryDto>(`${API_BASE}/places/${id}/visibility`, data, getAuthHeaders());
    return res.data;
  },

  // ─────────────────────────────────────────────
  // 5. Quản lý Tài chính & Hoàn tiền (/finance)
  // ─────────────────────────────────────────────
  async getRevenueSummary(): Promise<{
    grandTotal: number;
    totalTransactions: number;
    byMonth: Array<{ year: number; month: number; totalAmount: number; transactionCount: number }>;
  }> {
    const res = await axios.get(`${API_BASE}/finance/revenue-summary`, getAuthHeaders());
    return res.data;
  },

  async getRefunds(pendingOnly: boolean = false): Promise<Array<{
    id: number;
    bookingCode: string;
    amount: number;
    reason: string;
    type: string;
    status: 'PENDING' | 'PROCESSED' | 'REJECTED';
    requestedAt: string;
    processedAt?: string;
  }>> {
    const res = await axios.get(`${API_BASE}/finance/refunds`, {
      ...getAuthHeaders(),
      params: { pendingOnly },
    });
    return res.data;
  },

  async approveRefund(id: number, note?: string): Promise<void> {
    await axios.post(`${API_BASE}/finance/refunds/${id}/approve`, { note }, getAuthHeaders());
  },

  async rejectRefund(id: number, note: string): Promise<void> {
    await axios.post(`${API_BASE}/finance/refunds/${id}/reject`, { note }, getAuthHeaders());
  },
};

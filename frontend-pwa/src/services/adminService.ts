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
  AccountRole,
  AccountStatus,
  ProviderStatus,
  PlaceVisibility,
  PlaceVerificationStatus,
  CategoryKind,
} from '../types/admin';

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
  async getAccounts(params?: {
    role?: AccountRole;
    status?: AccountStatus;
    keyword?: string;
  }): Promise<AdminAccountDto[]> {
    const res = await axios.get<AdminAccountDto[]>(`${API_BASE}/accounts`, {
      ...getAuthHeaders(),
      params,
    });
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
  async getPlaces(params?: {
    keyword?: string;
    visibility?: PlaceVisibility;
    verification?: PlaceVerificationStatus;
    kind?: CategoryKind;
    page?: number;
    size?: number;
  }): Promise<{ content: AdminPlaceSummaryDto[]; totalElements: number; totalPages: number }> {
    const res = await axios.get<{ content: AdminPlaceSummaryDto[]; totalElements: number; totalPages: number }>(
      `${API_BASE}/places`,
      {
        ...getAuthHeaders(),
        params,
      }
    );
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

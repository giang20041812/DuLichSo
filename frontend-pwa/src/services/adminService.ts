import axios from 'axios';
import type {
  AdminAccountDto,
  CreateAdminAccountRequest,
  UpdateAccountRequest,
  UpdateAccountStatusRequest,
  ResetPasswordRequest,
  UpdateAccountRoleRequest,
  AdminProviderSummaryDto,
  ProviderAccountDto,
  CreateProviderWithAccountRequest,
  UpdateProviderRequest,
  UpdateProviderStatusRequest,
  AdminPlaceSummaryDto,
  UpdatePlaceVerificationRequest,
  UpdatePlaceVisibilityRequest,
  AdminDashboardSummaryDto,
  AuditLogEntryDto,
  AdminPlaceDetailDto,
  PlaceShowcase,
  AccountStatus,
  ProviderStatus,
  PlaceVerificationStatus,
  PageResponse,
  AdminBookingDto,
  BookingSearchParams,
  BookingStatusSummary,
  AdminBookingDetailDto,
  AddBookingNoteRequest,
  BookingNoteDto,
  AdminOverviewReport,
  ReportSearchParams,
  CreateTravelerRequest,
  PlaceSearchParams,
  PlaceVerificationSummary,
  AdminTravelerDto,
  AccountSearchParams,
  TravelerSearchParams,
  AdminNotificationFeed,
  UpdateAdminLevelRequest,
} from '../types/admin';
import type { CashflowReport, CashflowSearchParams } from '../types/cashflow';
import type { AuditLogItem, AuditLogSearchParams } from '../types/auditLog';
import type { AdminReview, AdminReviewSearchParams, ReviewModerationAction } from '../types/adminReview';
import type {
  PendingApplicationCount,
  ProviderApplicationBulkResult,
  ProviderApplicationDetail,
  ProviderApplicationSearchParams,
  ProviderApplicationSummary,
} from '../types/providerApplication';
import type {
  ChangeRequestDetail,
  ChangeRequestSearchParams,
  ChangeRequestSummary,
  PendingChangeCount,
} from '../types/changeRequest';

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

  /** Đổi quyền ADMIN ⇄ PROVIDER (hiệu lực ngay, phiên cũ bị thu hồi, bắt buộc lý do). */
  async updateAccountRole(id: number, data: UpdateAccountRoleRequest): Promise<AdminAccountDto> {
    const res = await axios.patch<AdminAccountDto>(`${API_BASE}/accounts/${id}/role`, data, getAuthHeaders());
    return res.data;
  },

  async resetPassword(id: number, data: ResetPasswordRequest): Promise<void> {
    await axios.patch(`${API_BASE}/accounts/${id}/reset-password`, data, getAuthHeaders());
  },

  /** Thông tin và cấp quản trị của chính người đang đăng nhập (mọi cấp Admin). */
  async getMe(): Promise<AdminAccountDto> {
    const res = await axios.get<AdminAccountDto>(`${API_BASE}/accounts/me`, getAuthHeaders());
    return res.data;
  },

  /** Đổi cấp quản trị viên (chỉ cấp 1; không tự đổi cấp của mình). */
  async updateAdminLevel(id: number, data: UpdateAdminLevelRequest): Promise<AdminAccountDto> {
    const res = await axios.patch<AdminAccountDto>(`${API_BASE}/accounts/${id}/admin-level`, data, getAuthHeaders());
    return res.data;
  },

  // ─────────────────────────────────────────────
  // Thông báo cho Admin (/notifications): NCC gửi hồ sơ đăng ký, khách đăng ký mới
  // ─────────────────────────────────────────────
  async getNotifications(): Promise<AdminNotificationFeed> {
    const res = await axios.get<AdminNotificationFeed>(`${API_BASE}/notifications`, getAuthHeaders());
    return res.data;
  },

  async markNotificationRead(id: number): Promise<void> {
    await axios.post(`${API_BASE}/notifications/${id}/read`, null, getAuthHeaders());
  },

  async markAllNotificationsRead(): Promise<void> {
    await axios.post(`${API_BASE}/notifications/read-all`, null, getAuthHeaders());
  },

  // ─────────────────────────────────────────────
  // Duyệt thay đổi Homestay / phòng / giá của NCC (/change-requests)
  // ─────────────────────────────────────────────
  async getChangeRequests(params?: ChangeRequestSearchParams): Promise<PageResponse<ChangeRequestSummary>> {
    const res = await axios.get<PageResponse<ChangeRequestSummary>>(`${API_BASE}/change-requests`, { ...getAuthHeaders(), params });
    return res.data;
  },

  async getPendingChangeRequestCount(): Promise<number> {
    const res = await axios.get<PendingChangeCount>(`${API_BASE}/change-requests/summary`, getAuthHeaders());
    return res.data.pending;
  },

  async getChangeRequest(id: number): Promise<ChangeRequestDetail> {
    const res = await axios.get<ChangeRequestDetail>(`${API_BASE}/change-requests/${id}`, getAuthHeaders());
    return res.data;
  },

  async approveChangeRequest(id: number, note?: string): Promise<ChangeRequestDetail> {
    const res = await axios.post<ChangeRequestDetail>(`${API_BASE}/change-requests/${id}/approve`, { note }, getAuthHeaders());
    return res.data;
  },

  async rejectChangeRequest(id: number, reason: string): Promise<ChangeRequestDetail> {
    const res = await axios.post<ChangeRequestDetail>(`${API_BASE}/change-requests/${id}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },

  // ─────────────────────────────────────────────
  // Nhật ký hệ thống (/audit-logs) — chỉ đọc
  // ─────────────────────────────────────────────
  async getAuditLogs(params?: AuditLogSearchParams): Promise<PageResponse<AuditLogItem>> {
    const res = await axios.get<PageResponse<AuditLogItem>>(`${API_BASE}/audit-logs`, { ...getAuthHeaders(), params });
    return res.data;
  },

  async getAuditLog(id: number): Promise<AuditLogItem> {
    const res = await axios.get<AuditLogItem>(`${API_BASE}/audit-logs/${id}`, getAuthHeaders());
    return res.data;
  },

  // ─────────────────────────────────────────────
  // Kiểm duyệt đánh giá (/reviews)
  // ─────────────────────────────────────────────
  async getReviews(params?: AdminReviewSearchParams): Promise<PageResponse<AdminReview>> {
    const res = await axios.get<PageResponse<AdminReview>>(`${API_BASE}/reviews`, { ...getAuthHeaders(), params });
    return res.data;
  },

  async moderateReview(id: number, action: ReviewModerationAction, reason?: string): Promise<AdminReview> {
    const res = await axios.post<AdminReview>(`${API_BASE}/reviews/${id}/moderate`, { action, reason }, getAuthHeaders());
    return res.data;
  },

  // ─────────────────────────────────────────────
  // Duyệt hồ sơ đăng ký NCC (/provider-applications)
  // ─────────────────────────────────────────────
  async getProviderApplications(params?: ProviderApplicationSearchParams): Promise<PageResponse<ProviderApplicationSummary>> {
    const res = await axios.get<PageResponse<ProviderApplicationSummary>>(`${API_BASE}/provider-applications`, { ...getAuthHeaders(), params });
    return res.data;
  },

  async getPendingProviderApplicationCount(): Promise<number> {
    const res = await axios.get<PendingApplicationCount>(`${API_BASE}/provider-applications/summary`, getAuthHeaders());
    return res.data.pending;
  },

  async getProviderApplication(id: number): Promise<ProviderApplicationDetail> {
    const res = await axios.get<ProviderApplicationDetail>(`${API_BASE}/provider-applications/${id}`, getAuthHeaders());
    return res.data;
  },

  /** Hình ảnh, tiện nghi, chính sách lưu trú của hồ sơ NCC (có dữ liệu khi hồ sơ đã được duyệt và đối tác đã tạo Homestay). */
  async getProviderApplicationShowcase(id: number): Promise<PlaceShowcase> {
    const res = await axios.get<PlaceShowcase>(`${API_BASE}/provider-applications/${id}/showcase`, getAuthHeaders());
    return res.data;
  },

  async approveProviderApplication(id: number, note?: string): Promise<ProviderApplicationDetail> {
    const res = await axios.post<ProviderApplicationDetail>(`${API_BASE}/provider-applications/${id}/approve`, { note }, getAuthHeaders());
    return res.data;
  },

  async rejectProviderApplication(id: number, reason: string): Promise<ProviderApplicationDetail> {
    const res = await axios.post<ProviderApplicationDetail>(`${API_BASE}/provider-applications/${id}/reject`, { reason }, getAuthHeaders());
    return res.data;
  },

  /** Duyệt nhiều hồ sơ đăng ký cùng lúc; hồ sơ lỗi (đã xử lý, SĐT/email trùng...) không chặn các hồ sơ còn lại. */
  async bulkApproveProviderApplications(ids: number[], note?: string): Promise<ProviderApplicationBulkResult> {
    const res = await axios.post<ProviderApplicationBulkResult>(`${API_BASE}/provider-applications/bulk-approve`, { ids, note }, getAuthHeaders());
    return res.data;
  },

  /** Từ chối nhiều hồ sơ đăng ký cùng lúc với cùng một lý do. */
  async bulkRejectProviderApplications(ids: number[], reason: string): Promise<ProviderApplicationBulkResult> {
    const res = await axios.post<ProviderApplicationBulkResult>(`${API_BASE}/provider-applications/bulk-reject`, { ids, reason }, getAuthHeaders());
    return res.data;
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

  async getProviderAccounts(id: number): Promise<ProviderAccountDto[]> {
    const res = await axios.get<ProviderAccountDto[]>(`${API_BASE}/providers/${id}/accounts`, getAuthHeaders());
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
  async getRecentActivity(limit = 8): Promise<AuditLogEntryDto[]> {
    const res = await axios.get<AuditLogEntryDto[]>(`${API_BASE}/dashboard/activity`, { ...getAuthHeaders(), params: { limit } });
    return res.data;
  },

  async getPlaceById(id: number): Promise<AdminPlaceDetailDto> {
    const res = await axios.get<AdminPlaceDetailDto>(`${API_BASE}/places/${id}`, getAuthHeaders());
    return res.data;
  },

  /** Hình ảnh, tiện nghi, chính sách lưu trú của điểm đến (màn Duyệt điểm đến). */
  async getPlaceShowcase(id: number): Promise<PlaceShowcase> {
    const res = await axios.get<PlaceShowcase>(`${API_BASE}/places/${id}/showcase`, getAuthHeaders());
    return res.data;
  },

  async getPlaces(params?: PlaceSearchParams): Promise<PageResponse<AdminPlaceSummaryDto>> {
    const res = await axios.get<PageResponse<AdminPlaceSummaryDto>>(`${API_BASE}/places`, {
      ...getAuthHeaders(),
      params,
    });
    return res.data;
  },

  async getBookings(params?: BookingSearchParams): Promise<PageResponse<AdminBookingDto>> {
    // Axios mặc định gửi mảng dạng status[]=A; backend nhận danh sách phân tách bằng dấu phẩy.
    const { statuses, ...rest } = params ?? {};
    const res = await axios.get<PageResponse<AdminBookingDto>>(`${API_BASE}/bookings`, {
      ...getAuthHeaders(),
      params: { ...rest, status: statuses && statuses.length > 0 ? statuses.join(',') : rest.status },
    });
    return res.data;
  },

  async getBookingsSummary(): Promise<BookingStatusSummary> {
    const res = await axios.get<BookingStatusSummary>(`${API_BASE}/bookings/summary`, getAuthHeaders());
    return res.data;
  },


  async getBookingDetail(id: number): Promise<AdminBookingDetailDto> {
    const res = await axios.get<AdminBookingDetailDto>(`${API_BASE}/bookings/${id}`, getAuthHeaders());
    return res.data;
  },

  async addBookingNote(id: number, data: AddBookingNoteRequest): Promise<BookingNoteDto> {
    const res = await axios.post<BookingNoteDto>(`${API_BASE}/bookings/${id}/notes`, data, getAuthHeaders());
    return res.data;
  },

  async getReportOverview(params?: ReportSearchParams): Promise<AdminOverviewReport> {
    const res = await axios.get<AdminOverviewReport>(`${API_BASE}/reports/overview`, {
      ...getAuthHeaders(),
      params,
    });
    return res.data;
  },

  async createTraveler(data: CreateTravelerRequest): Promise<AdminTravelerDto> {
    const res = await axios.post<AdminTravelerDto>(`${API_BASE}/travelers`, data, getAuthHeaders());
    return res.data;
  },

  // MON-BR-03/04: cố ý KHÔNG có updateBookingStatus ở đây — Admin chỉ được xem Booking, không được tự đổi trạng thái
  // thay NCC. Đổi trạng thái Booking là việc của NCC (partnerBookingService) hoặc hệ thống thanh toán/hết hạn.

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

  /** Xóa mềm một hoặc nhiều điểm đến (bắt buộc lý do, ghi nhật ký hoạt động). */
  async deletePlaces(data: { ids: number[]; reason: string }): Promise<{ deleted: number }> {
    const res = await axios.post<{ deleted: number }>(`${API_BASE}/places/delete`, data, getAuthHeaders());
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

  /** Dòng tiền theo NCC / Homestay (thu, hoàn, chờ hoàn, ròng) theo kỳ, có lọc, sắp xếp và phân trang. */
  async getCashflow(params?: CashflowSearchParams): Promise<CashflowReport> {
    const res = await axios.get<CashflowReport>(`${API_BASE}/finance/cashflow`, { ...getAuthHeaders(), params });
    return res.data;
  },

  async rejectRefund(id: number, note: string): Promise<void> {
    await axios.post(`${API_BASE}/finance/refunds/${id}/reject`, { note }, getAuthHeaders());
  },
};

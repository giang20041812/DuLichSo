/**
 * Hồ sơ đăng ký NCC chờ Admin thẩm định (FR-AD-16).
 * Khớp com.dulichso.bookingapi.dto.admin.AdminProviderApplicationDtos (backend-api). Không có trường mật khẩu.
 */
export type ProviderApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** ApplicationSummaryDto */
export interface ProviderApplicationSummary {
  id: number;
  businessName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  address: string;
  businessLicenseNo: string | null;
  status: ProviderApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
  providerId: number | null;
}

/** ApplicationDetailDto. phoneTaken/emailTaken = SĐT/email đã thuộc tài khoản khác, hồ sơ không thể duyệt. */
export interface ProviderApplicationDetail {
  summary: ProviderApplicationSummary;
  description: string | null;
  phoneTaken: boolean;
  emailTaken: boolean;
}

export interface ProviderApplicationSearchParams {
  status?: ProviderApplicationStatus;
  keyword?: string;
  from?: string;
  to?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

/** PendingApplicationCountDto */
export interface PendingApplicationCount {
  pending: number;
}

/** BulkFailureDto — lỗi khi xử lý 1 hồ sơ trong yêu cầu duyệt/từ chối hàng loạt. */
export interface ProviderApplicationBulkFailure {
  id: number;
  message: string;
}

/** BulkActionResultDto — mỗi hồ sơ xử lý độc lập, hồ sơ lỗi không chặn các hồ sơ còn lại. */
export interface ProviderApplicationBulkResult {
  succeededIds: number[];
  failed: ProviderApplicationBulkFailure[];
}

/**
 * Yêu cầu thay đổi Homestay/phòng/giá của NCC chờ Admin duyệt.
 * Khớp com.dulichso.bookingapi.dto.ChangeRequestDtos và entity PartnerChangeRequest (backend-api).
 */
export type ChangeTargetType = 'HOMESTAY' | 'ROOM_TYPE' | 'ROOM_PRICE';
export type ChangeOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/** Phản hồi 202 khi thay đổi được gửi chờ duyệt thay vì ghi trực tiếp (SubmittedDto). */
export interface SubmittedChange {
  changeRequestId: number;
  status: ChangeRequestStatus;
  message: string;
}

/** ChangeRequestSummaryDto */
export interface ChangeRequestSummary {
  id: number;
  targetType: ChangeTargetType;
  operation: ChangeOperation;
  status: ChangeRequestStatus;
  placeId: number;
  placeName: string;
  providerId: number;
  providerName: string;
  targetId: number | null;
  roomTypeId: number | null;
  targetName: string;
  changeSummary: string;
  submittedByName: string | null;
  submittedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

/** FieldChangeDto: giá trị cũ/mới đã chuẩn hóa thành chuỗi hiển thị. */
export interface FieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

/** ChangeRequestDetailDto. `stale` = dữ liệu chính thức đã đổi kể từ lúc NCC gửi yêu cầu. */
export interface ChangeRequestDetail {
  summary: ChangeRequestSummary;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changes: FieldChange[];
  stale: boolean;
}

export interface ChangeRequestSearchParams {
  status?: ChangeRequestStatus;
  providerId?: number;
  placeId?: number;
  targetType?: ChangeTargetType;
  keyword?: string;
  from?: string;
  to?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

/** PendingCountDto */
export interface PendingChangeCount {
  pending: number;
}

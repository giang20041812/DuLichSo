import type {
  BookingAttentionReason,
  BookingNoteOutcome,
  BookingStatus,
} from '@/types/admin';
import type { StatusTone } from './StatusBadge';

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ xử lý',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  CHECKED_OUT: 'Đã trả phòng',
  REFUNDED: 'Đã hoàn tiền',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
  COMPLETED: 'Hoàn tất',
  NO_SHOW: 'Khách không đến',
};

/** Màu theo nhóm trạng thái của trang Đặt phòng: Mới = lam · Đã xác nhận = xanh · Hoàn thành / Đã hủy = xám. */
export const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  PENDING: 'info',
  AWAITING_PAYMENT: 'info',
  CONFIRMED: 'success',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'neutral',
  COMPLETED: 'neutral',
  REFUNDED: 'neutral',
  REJECTED: 'neutral',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
  NO_SHOW: 'neutral',
};

/**
 * Nhóm trạng thái của tab lọc trang Đặt phòng (một tab gồm nhiều trạng thái thật trong DB):
 *  Mới = PENDING + AWAITING_PAYMENT · Đã xác nhận = CONFIRMED + CHECKED_IN · Hoàn thành = CHECKED_OUT + COMPLETED ·
 *  Đã hủy = CANCELLED + REJECTED + EXPIRED + NO_SHOW + REFUNDED.
 */
export type BookingGroup = 'NEW' | 'CONFIRMED' | 'DONE' | 'CANCELLED';
export const BOOKING_GROUP_STATUSES: Record<BookingGroup, BookingStatus[]> = {
  NEW: ['PENDING', 'AWAITING_PAYMENT'],
  CONFIRMED: ['CONFIRMED', 'CHECKED_IN'],
  DONE: ['CHECKED_OUT', 'COMPLETED'],
  CANCELLED: ['CANCELLED', 'REJECTED', 'EXPIRED', 'NO_SHOW', 'REFUNDED'],
};

export const isPendingStatus = (s: BookingStatus) => s === 'PENDING' || s === 'AWAITING_PAYMENT';

/** Nền mờ tỉ lệ theo số lượng, dùng cho danh sách phân bố trạng thái trong báo cáo. */
export const STATUS_FILL: Record<BookingStatus, string> = {
  PENDING: 'bg-sun/10',
  AWAITING_PAYMENT: 'bg-secondary/10',
  CONFIRMED: 'bg-accent/10',
  CHECKED_IN: 'bg-secondary/10',
  CHECKED_OUT: 'bg-primary/10',
  REFUNDED: 'bg-sun/10',
  COMPLETED: 'bg-primary/10',
  REJECTED: 'bg-danger/10',
  CANCELLED: 'bg-danger/10',
  EXPIRED: 'bg-muted/10',
  NO_SHOW: 'bg-muted/10',
};

export const ATTENTION_TONE: Record<BookingAttentionReason, StatusTone> = {
  PENDING_STALE: 'warning',
  PAYMENT_OVERDUE: 'danger',
  STAY_UNRESOLVED: 'info',
  FOLLOW_UP: 'brand',
};

export const ATTENTION_LABEL: Record<BookingAttentionReason, string> = {
  PENDING_STALE: 'Chờ NCC xác nhận quá 24 giờ',
  PAYMENT_OVERDUE: 'Quá hạn thanh toán, chưa được đóng',
  STAY_UNRESOLVED: 'Đã qua ngày trả phòng nhưng chưa hoàn tất',
  FOLLOW_UP: 'Admin đánh dấu cần theo dõi',
};

export const OUTCOME_LABEL: Record<BookingNoteOutcome, string> = {
  NO_ISSUE: 'Đã kiểm tra, không có vấn đề',
  SUPPORTED: 'Đã hỗ trợ xong',
  ESCALATED: 'Đã chuyển NCC / bộ phận liên quan',
  FOLLOW_UP: 'Cần tiếp tục theo dõi',
};

export const OUTCOME_TONE: Record<BookingNoteOutcome, StatusTone> = {
  NO_ISSUE: 'success',
  SUPPORTED: 'success',
  ESCALATED: 'info',
  FOLLOW_UP: 'warning',
};

export const vnd = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
export const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

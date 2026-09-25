import type { BookingStatus } from '@/types/booking';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ xử lý',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
  COMPLETED: 'Hoàn tất',
  NO_SHOW: 'Khách không đến',
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  AWAITING_PAYMENT: 'border-secondary-200 bg-secondary-50 text-secondary-700',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-primary/30 bg-primary-50 text-primary',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXPIRED: 'border-border bg-canvas text-muted',
  NO_SHOW: 'border-border bg-canvas text-muted',
};

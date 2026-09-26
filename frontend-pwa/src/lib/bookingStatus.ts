import type { BookingStatus } from '@/types/booking';

/** Nhãn và màu trạng thái đơn cho các màn hình NCC — cùng cách gọi với BookingsPanel của Admin. */
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ xử lý',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  CHECKED_OUT: 'Đã trả phòng',
  COMPLETED: 'Hoàn tất',
  REFUNDED: 'Đã hoàn tiền',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
  NO_SHOW: 'Khách không đến',
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  AWAITING_PAYMENT: 'border-secondary-200 bg-secondary-50 text-secondary-700',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CHECKED_IN: 'border-blue-200 bg-blue-50 text-blue-700',
  CHECKED_OUT: 'border-purple-200 bg-purple-50 text-purple-700',
  COMPLETED: 'border-primary/30 bg-primary-50 text-primary',
  REFUNDED: 'border-orange-200 bg-orange-50 text-orange-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXPIRED: 'border-border bg-canvas text-muted',
  NO_SHOW: 'border-border bg-canvas text-muted',
};

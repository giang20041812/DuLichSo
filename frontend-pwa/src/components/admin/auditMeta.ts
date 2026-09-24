import type { StatusTone } from './StatusBadge';

/** Nhãn tiếng Việt cho các mã hành động ghi trong audit_log (khớp chuỗi action ở các service backend). */
export const AUDIT_ACTION: Record<string, { label: string; tone: StatusTone }> = {
  CREATE_ADMIN_ACCOUNT: { label: 'Tạo tài khoản quản trị', tone: 'brand' },
  UPDATE_ACCOUNT: { label: 'Cập nhật hồ sơ tài khoản', tone: 'info' },
  UPDATE_ACCOUNT_STATUS: { label: 'Đổi trạng thái tài khoản', tone: 'warning' },
  RESET_PASSWORD: { label: 'Đặt lại mật khẩu', tone: 'warning' },
  CREATE_TRAVELER: { label: 'Tạo tài khoản khách', tone: 'brand' },
  UPDATE_TRAVELER_STATUS: { label: 'Đổi trạng thái khách', tone: 'warning' },
  CREATE_PROVIDER: { label: 'Tạo đối tác NCC', tone: 'brand' },
  UPDATE_PROVIDER: { label: 'Cập nhật đối tác NCC', tone: 'info' },
  UPDATE_PROVIDER_STATUS: { label: 'Đổi trạng thái đối tác', tone: 'warning' },
  UPDATE_PLACE_VERIFICATION: { label: 'Kiểm duyệt điểm đến', tone: 'success' },
  UPDATE_PLACE_VISIBILITY: { label: 'Đổi hiển thị điểm đến', tone: 'info' },
  REFUND_APPROVED: { label: 'Duyệt hoàn tiền', tone: 'success' },
  REFUND_REJECTED: { label: 'Từ chối hoàn tiền', tone: 'danger' },
  AFFILIATE_LINK_CREATED: { label: 'Tạo liên kết affiliate', tone: 'brand' },
  AFFILIATE_LINK_DEACTIVATED: { label: 'Vô hiệu liên kết affiliate', tone: 'neutral' },
  SOS_DISPATCHED: { label: 'Điều phối yêu cầu SOS', tone: 'danger' },
  SOS_RESOLVED: { label: 'Hoàn tất yêu cầu SOS', tone: 'success' },
  SOS_CANCELLED: { label: 'Hủy yêu cầu SOS', tone: 'neutral' },
  EMERGENCY_CONTACT_CREATED: { label: 'Thêm đầu mối khẩn cấp', tone: 'info' },
  EMERGENCY_CONTACT_UPDATED: { label: 'Cập nhật đầu mối khẩn cấp', tone: 'info' },
  EMERGENCY_CONTACT_DELETED: { label: 'Xóa đầu mối khẩn cấp', tone: 'neutral' },
  BOOKING_MONITOR_VERIFICATION: { label: 'Ghi nhận xác minh đơn', tone: 'info' },
  BOOKING_MONITOR_OUTCOME: { label: 'Ghi nhận kết quả giám sát', tone: 'brand' },
};

export const AUDIT_ENTITY: Record<string, string> = {
  Account: 'Tài khoản',
  Traveler: 'Khách',
  Provider: 'Đối tác',
  Place: 'Điểm đến',
  Booking: 'Đơn',
  Refund: 'Hoàn tiền',
  AffiliateLink: 'Affiliate',
  SosRequest: 'SOS',
  EmergencyContact: 'Đầu mối',
};

export function timeAgo(iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

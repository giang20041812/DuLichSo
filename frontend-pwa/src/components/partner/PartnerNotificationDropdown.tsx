import { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, Clock, Edit3, XCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { partnerBookingService } from '@/services/partnerBookingService';
import { fetchPartnerChangeRequests } from '@/services/changeRequestService';
import type { PartnerBookingRowDto } from '@/types/booking';
import type { ChangeOperation, ChangeRequestSummary } from '@/types/changeRequest';

type NotificationType = 'NEW_BOOKING' | 'CHANGE_REQUEST' | 'CHANGE_PENDING' | 'CHANGE_APPROVED' | 'CHANGE_REJECTED' | 'CANCELLED';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  detail?: string;
  at: string;
  read: boolean;
  link: string;
};

const READ_KEY = 'partner_read_notifications';
const OPERATION_LABEL: Record<ChangeOperation, string> = {
  CREATE: 'thêm', UPDATE: 'chỉnh sửa', DELETE: 'xóa', PUBLISH: 'xuất bản', TRANSFER: 'chuyển NCC quản lý',
};

/** Thông báo đã đọc chỉ là tiện ích trên trình duyệt này; lỗi lưu trữ thì coi như chưa đọc. */
function readIds(): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]); } catch { return new Set(); }
}
function saveReadIds(ids: Set<string>) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-300))); } catch { /* bỏ qua: chỉ là tiện ích */ }
}

/** Thông báo về yêu cầu chỉnh sửa Homestay/loại phòng/giá của chính NCC gửi quản trị viên duyệt. */
function fromChangeRequest(r: ChangeRequestSummary): Omit<Notification, 'read'> | null {
  const action = `Yêu cầu ${OPERATION_LABEL[r.operation]} “${r.targetName}”`;
  const link = r.targetType === 'HOMESTAY' ? `/partner/homestay/${r.placeId}/edit` : `/partner/homestay/${r.placeId}/rooms`;
  switch (r.status) {
    case 'PENDING':
      return { id: `ncc-change-${r.id}-pending`, type: 'CHANGE_PENDING', title: `${action} đang chờ quản trị viên duyệt`, detail: r.placeName, at: r.submittedAt, link };
    case 'APPROVED':
      return { id: `ncc-change-${r.id}-approved`, type: 'CHANGE_APPROVED', title: `${action} đã được duyệt`, detail: r.placeName, at: r.reviewedAt ?? r.submittedAt, link };
    case 'REJECTED':
      return { id: `ncc-change-${r.id}-rejected`, type: 'CHANGE_REJECTED', title: `${action} bị từ chối`, detail: r.reviewNote ? `Lý do: ${r.reviewNote}` : r.placeName, at: r.reviewedAt ?? r.submittedAt, link };
    default:
      return null;
  }
}

export default function PartnerNotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let active = true;
    const load = async () => {
      // Mỗi nguồn lỗi riêng không làm mất thông báo của các nguồn còn lại.
      const [requests, pendingBookings, changes] = await Promise.allSettled([
        partnerBookingService.getBookingChangeRequests(),
        partnerBookingService.getBookings({ status: 'PENDING', page: 0, size: 100, sortBy: 'createdAt', sortDir: 'desc' }),
        fetchPartnerChangeRequests(undefined, 0, 20),
      ]);
      if (!active) return;
      const items: Omit<Notification, 'read'>[] = [];
      if (pendingBookings.status === 'fulfilled') {
        items.push(...pendingBookings.value.content.map((booking: PartnerBookingRowDto) => ({
          id: `new-booking-${booking.id}`,
          type: 'NEW_BOOKING' as const,
          title: `Có đơn mới cần xử lý #${booking.bookingCode}`,
          detail: booking.responseDueAt ? `Phản hồi trước ${new Date(booking.responseDueAt).toLocaleString('vi-VN')}` : undefined,
          at: booking.createdAt,
          link: `/partner/bookings/${booking.id}`,
        })));
      }
      if (requests.status === 'fulfilled') {
        items.push(...requests.value.filter((request) => request.status === 'PENDING').map((request) => ({
          id: `booking-change-${request.id}`,
          type: 'CHANGE_REQUEST' as const,
          title: `Khách gửi yêu cầu đổi Booking #${request.bookingCode}`,
          at: request.createdAt,
          link: '/partner/bookings',
        })));
      }
      if (changes.status === 'fulfilled') {
        changes.value.content.forEach((r) => { const n = fromChangeRequest(r); if (n) items.push(n); });
      }
      const read = readIds();
      setNotifications(items
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .map((n) => ({ ...n, read: read.has(n.id) })));
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markRead = (ids: string[]) => {
    const read = readIds();
    ids.forEach((id) => read.add(id));
    saveReadIds(read);
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
  };

  const handleNotificationClick = (notif: Notification) => {
    markRead([notif.id]);
    setOpen(false);
    navigate(notif.link);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_BOOKING': return <AlertCircle className="h-5 w-5 text-primary" />;
      case 'CHANGE_REQUEST': return <Edit3 className="h-5 w-5 text-sun" />;
      case 'CHANGE_PENDING': return <Clock className="h-5 w-5 text-secondary-700" />;
      case 'CHANGE_APPROVED': return <CheckCircle2 className="h-5 w-5 text-accent-600" />;
      case 'CHANGE_REJECTED':
      case 'CANCELLED': return <XCircle className="h-5 w-5 text-danger" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} mới)` : 'Thông báo'}
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-coral"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-white py-2 shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-border px-4 pb-2">
            <h3 className="font-bold text-ink-deep">Thông báo</h3>
            {unreadCount > 0 && (
              <button type="button" onClick={() => markRead(notifications.filter(n => !n.read).map(n => n.id))}
                className="rounded-md bg-coral-light px-2 py-0.5 text-[10px] font-bold text-coral-hover hover:underline">
                {unreadCount} mới · Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">Không có thông báo nào</p>
            ) : (
              notifications.map((notif) => (
                <button
                  type="button"
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface ${!notif.read ? 'bg-primary-50/50' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm ${!notif.read ? 'font-bold text-ink-deep' : 'text-ink'}`}>
                      {notif.title}
                    </p>
                    {notif.detail && <p className="mt-0.5 line-clamp-2 text-xs text-ink">{notif.detail}</p>}
                    <p className="mt-1 text-xs text-muted">{new Date(notif.at).toLocaleString('vi-VN')}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

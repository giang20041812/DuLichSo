import type { CustomerNotification } from '@/types/notification';
import { apiOrigin } from '@/lib/apiBase';

const READ_NOTIFICATION_IDS_KEY = 'user_read_notification_ids';

export function getLocalReadNotificationIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_NOTIFICATION_IDS_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveLocalReadNotificationId(id: number): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getLocalReadNotificationIds();
    set.add(id);
    localStorage.setItem(READ_NOTIFICATION_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Lỗi lưu id thông báo đã đọc:', err);
  }
}

export async function fetchCustomerNotifications(params: {
  email?: string;
  phone?: string;
  accountId?: number;
}): Promise<CustomerNotification[]> {
  try {
    const url = new URL('/api/public/notifications', apiOrigin());
    if (params.email) url.searchParams.append('email', params.email);
    if (params.phone) url.searchParams.append('phone', params.phone);
    if (params.accountId) url.searchParams.append('accountId', String(params.accountId));

    const res = await fetch(url.toString());
    if (!res.ok) {
      return [];
    }
    const list = (await res.json()) as CustomerNotification[];
    const readIds = getLocalReadNotificationIds();

    return list.map((item) => ({
      ...item,
      isRead: item.isRead || readIds.has(item.id),
    }));
  } catch (error) {
    console.warn('Không thể nạp thông báo từ server:', error);
    return [];
  }
}

export async function markNotificationAsRead(id: number): Promise<void> {
  saveLocalReadNotificationId(id);
  window.dispatchEvent(new CustomEvent('notification_change', { detail: { id, isRead: true } }));

  try {
    const url = new URL(`/api/public/notifications/${id}/read`, apiOrigin());
    await fetch(url.toString(), { method: 'PUT' });
  } catch (err) {
    console.warn('Lỗi đồng bộ trạng thái đọc lên server:', err);
  }
}

export async function markAllNotificationsAsRead(params: {
  email?: string;
  phone?: string;
  accountId?: number;
  notificationIds?: number[];
}): Promise<void> {
  if (params.notificationIds && params.notificationIds.length > 0) {
    const set = getLocalReadNotificationIds();
    params.notificationIds.forEach((id) => set.add(id));
    if (typeof window !== 'undefined') {
      localStorage.setItem(READ_NOTIFICATION_IDS_KEY, JSON.stringify(Array.from(set)));
    }
  }

  window.dispatchEvent(new CustomEvent('notification_change', { detail: { allRead: true } }));

  try {
    const url = new URL('/api/public/notifications/mark-all-read', apiOrigin());
    await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.email,
        phone: params.phone,
        accountId: params.accountId,
      }),
    });
  } catch (err) {
    console.warn('Lỗi đánh dấu tất cả thông báo là đã đọc:', err);
  }
}

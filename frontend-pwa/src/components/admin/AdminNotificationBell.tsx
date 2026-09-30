import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff, CheckCheck, Inbox, UserPlus } from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { AdminNotificationFeed, AdminNotificationItem } from '@/types/admin';
import { timeAgo } from './auditMeta';

const POLL_MS = 30_000;
const SYNC_EVENT = 'admin-notifications-changed';

interface AdminNotificationBellProps {
  /** Mở mục tương ứng của cổng quản trị khi bấm một thông báo (target do backend gửi kèm). */
  onOpenTarget: (target: string) => void;
  /** Vị trí hộp thư thả xuống: dưới-phải (mặc định), dưới-trái, hoặc bên phải nút (khi nút nằm trong sidebar thu gọn). */
  placement?: 'below-right' | 'below-left' | 'beside';
}

const ICON: Record<string, typeof Inbox> = { applications: Inbox, accounts: UserPlus };
const PANEL_POSITION: Record<NonNullable<AdminNotificationBellProps['placement']>, string> = {
  'below-right': 'right-0 top-10',
  'below-left': 'left-0 top-10',
  beside: 'left-full top-0 ml-3',
};

/** Chuông thông báo: NCC gửi hồ sơ đăng ký, khách đăng ký mới. Tự làm mới định kỳ. */
export default function AdminNotificationBell({ onOpenTarget, placement = 'below-right' }: AdminNotificationBellProps) {
  const [feed, setFeed] = useState<AdminNotificationFeed | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setFeed(await adminService.getNotifications());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    // Có nhiều chuông cùng lúc (sidebar + thanh trên cùng): khi một chuông đánh dấu đã đọc thì các chuông khác tải lại ngay.
    const onSync = () => void load();
    window.addEventListener(SYNC_EVENT, onSync);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(SYNC_EVENT, onSync);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = feed?.unread ?? 0;

  const openItem = async (item: AdminNotificationItem) => {
    setOpen(false);
    if (item.target) onOpenTarget(item.target);
    if (!item.read) {
      try {
        await adminService.markNotificationRead(item.id);
      } finally {
        void load();
        window.dispatchEvent(new Event(SYNC_EVENT));
      }
    }
  };

  const readAll = async () => {
    try {
      await adminService.markAllNotificationsRead();
    } finally {
      void load();
      window.dispatchEvent(new Event(SYNC_EVENT));
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        title="Thông báo"
        className={`relative flex h-8 w-8 items-center justify-center rounded-md border bg-white transition-colors ${
          open ? 'border-primary/50 text-primary' : 'border-border text-muted hover:border-primary/40 hover:text-primary'
        }`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`rise-in absolute ${PANEL_POSITION[placement]} z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-white shadow-xl`}>
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <h3 className="font-display text-sm font-bold text-ink-deep">
              Thông báo {unread > 0 && <span className="ml-1 rounded bg-coral/10 px-1.5 py-px text-[10px] font-bold text-coral">{unread} mới</span>}
            </h3>
            {unread > 0 && (
              <button type="button" onClick={() => void readAll()} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> Đọc tất cả
              </button>
            )}
          </header>
          <div className="max-h-96 overflow-y-auto">
            {failed && !feed ? (
              <p className="px-4 py-8 text-center text-xs text-danger">Không tải được thông báo.</p>
            ) : !feed ? (
              <p className="px-4 py-8 text-center text-xs text-muted">Đang tải...</p>
            ) : feed.items.length === 0 ? (
              <p className="flex flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted">
                <BellOff className="h-5 w-5 text-primary-300" /> Chưa có thông báo nào.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {feed.items.map((n) => {
                  const Icon = (n.target && ICON[n.target]) || Bell;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => void openItem(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas ${n.read ? '' : 'bg-primary-50/50'}`}
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${n.read ? 'bg-canvas text-muted' : 'bg-sun/15 text-amber-700'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs ${n.read ? 'font-semibold text-ink' : 'font-bold text-ink-deep'}`}>{n.title ?? 'Thông báo'}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-muted">{n.message}</span>
                          <span className="mt-1 block text-[10px] text-muted/80">{timeAgo(n.createdAt)}</span>
                        </span>
                        {!n.read && <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { Home, LogOut, X } from 'lucide-react';
import { VietTrackLogoMark } from '@/components/ui/logo';

export type SidebarBadgeTone = 'amber' | 'green';

export interface SidebarItem<K extends string> {
  key: K;
  label: string;
  icon: LucideIcon;
  group: string;
  /** Số đếm cảnh báo cạnh menu; null/0 thì ẩn. */
  badge?: { count: number; tone: SidebarBadgeTone } | null;
}

interface AdminSidebarProps<K extends string> {
  items: SidebarItem<K>[];
  active: K;
  onSelect: (key: K) => void;
  user: { fullName?: string | null; email?: string | null } | null;
  onLogout: () => void;
  onHome: () => void;
  /** Chỉ dùng dưới breakpoint lg: sidebar trượt ra như ngăn kéo. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const BADGE: Record<SidebarBadgeTone, string> = {
  amber: 'bg-sun text-ink-deep',
  green: 'bg-accent text-white',
};
/** Badge trên mục đang chọn (nền teal đặc) chuyển sang nền trắng để vẫn đọc rõ. */
const BADGE_ON_ACTIVE: Record<SidebarBadgeTone, string> = {
  amber: 'bg-white text-amber-700',
  green: 'bg-white text-primary',
};

const initials = (name?: string | null, email?: string | null) => {
  const src = (name || email || 'A').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? src;
  return (parts.length > 1 ? `${parts[0]?.charAt(0) ?? ''}${last.charAt(0)}` : src.slice(0, 2)).toUpperCase();
};

/** Sidebar dọc cố định bên trái — cùng ngôn ngữ với sidebar trang khách: nền trắng mờ, icon teal, mục chọn tô teal đặc. */
export default function AdminSidebar<K extends string>({
  items,
  active,
  onSelect,
  user,
  onLogout,
  onHome,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps<K>) {
  const groups = items.reduce<{ name: string; items: SidebarItem<K>[] }[]>((acc, it) => {
    const g = acc.find((x) => x.name === it.group);
    if (g) g.items.push(it);
    else acc.push({ name: it.group, items: [it] });
    return acc;
  }, []);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-ink-deep/40 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-white/90 text-ink shadow-xl backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Điều hướng quản trị"
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <VietTrackLogoMark size={34} className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col leading-none">
            <span className="truncate font-display text-lg font-black text-ink-deep">VietTrack</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-primary">Quản trị hệ thống</span>
          </div>
          <button type="button" onClick={onCloseMobile} aria-label="Đóng menu" className="rounded-md p-1 text-muted hover:bg-hover hover:text-ink lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.name} className="mb-4 last:mb-0">
              <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-muted">{g.name}</div>
              <ul className="flex flex-col gap-0.5">
                {g.items.map(({ key, label, icon: Icon, badge }) => {
                  const isActive = key === active;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(key);
                          onCloseMobile();
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                          isActive
                            ? 'bg-primary font-bold text-white shadow-[var(--shadow-teal)]'
                            : 'font-semibold text-ink hover:bg-primary-50 hover:text-primary'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-primary'}`} />
                        <span className="flex-1 truncate">{label}</span>
                        {badge && badge.count > 0 && (
                          <span className={`rounded px-1.5 py-px text-[10px] font-bold tabular-nums ${isActive ? BADGE_ON_ACTIVE[badge.tone] : BADGE[badge.tone]}`}>
                            {badge.count > 99 ? '99+' : badge.count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-md border border-border bg-white p-2.5 shadow-xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-xs font-bold text-primary">
              {initials(user?.fullName, user?.email)}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-bold text-ink-deep">{user?.fullName || 'Quản trị viên'}</div>
              <div className="truncate text-[11px] text-muted">{user?.email || '—'}</div>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onHome}
              className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-border transition-colors hover:bg-primary-50 hover:text-primary"
            >
              <Home className="h-3.5 w-3.5" /> Trang chủ
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-border transition-colors hover:bg-danger/10 hover:text-danger hover:ring-danger/40"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

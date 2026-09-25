import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BarChart3, CalendarDays, ChevronRight, Home, Leaf, LogOut, Menu, Star, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { VietTrackLogo } from '@/components/ui/logo';
import { clearPortalSession } from '@/lib/authInterceptor';
import type { PortalLoginResponse } from '@/types/user';

const NAV_ITEMS = [
  { to: '/partner', label: 'Homestay của tôi', icon: Home, end: true, soon: false },
  { to: '/partner/bookings', label: 'Đơn đặt phòng', icon: CalendarDays, end: false, soon: false },
  { to: '/partner/reviews', label: 'Đánh giá của khách', icon: Star, end: false, soon: false },
  { to: '#reports', label: 'Báo cáo & Doanh thu', icon: BarChart3, end: false, soon: true },
];

const readSession = (): PortalLoginResponse | null => {
  try {
    const raw = localStorage.getItem('portal_user');
    return raw ? (JSON.parse(raw) as PortalLoginResponse) : null;
  } catch {
    return null;
  }
};

/**
 * Khung Cổng Nhà cung cấp: sidebar (desktop) / drawer (mobile) + chặn truy cập khi chưa đăng nhập.
 * Các trang con hiển thị qua <Outlet />.
 */
export default function PartnerLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [session] = useState(readSession);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const allowed = session !== null && (session.role === 'PROVIDER' || session.role === 'ADMIN');

  useEffect(() => {
    if (!allowed) navigate('/portal/login', { replace: true });
  }, [allowed, navigate]);

  if (!allowed) return null;

  const logout = () => {
    clearPortalSession();
    navigate('/portal/login', { replace: true });
  };

  const providerName = session.provider?.name ?? session.fullName ?? 'Nhà cung cấp';

  const sidebar = (
    <div className="flex h-full flex-col bg-primary-900 text-white">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="inline-flex rounded-md bg-surface px-3 py-2">
        <VietTrackLogo size={32} />
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-200">Không gian đối tác</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Điều hướng cổng nhà cung cấp">
        <p className="px-3.5 pb-3 pt-5 text-[10px] font-semibold uppercase tracking-widest text-primary-300">Quản lý kinh doanh</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, soon }) =>
          soon ? (
            <span
              key={to}
              aria-disabled="true"
              className="mt-2 flex items-center gap-3 rounded-md px-3.5 py-3 text-sm text-primary-200/70"
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              <span className="rounded-sm border border-white/15 px-1.5 py-0.5 text-[9px]">Sắp có</span>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setDrawerOpen(false)}
              className={() =>
                `flex items-center gap-3 rounded-md px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  (to === '/partner' ? !pathname.startsWith('/partner/bookings') && !pathname.startsWith('/partner/reviews') : pathname.startsWith(to)) ? 'bg-primary text-white shadow-[var(--shadow-teal)]' : 'text-primary-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="mx-5 mb-6 rounded-lg border border-white/15 bg-white/5 p-4">
        <Leaf className="mb-3 h-5 w-5 text-primary-300" />
        <p className="text-sm font-semibold">Chăm chút từng kỳ nghỉ</p>
        <p className="mt-2 text-xs leading-relaxed text-primary-200">Cập nhật thông tin và lịch phòng để luôn sẵn sàng đón khách.</p>
        <Link to="/" className="mt-4 flex items-center gap-2 text-xs font-semibold text-white hover:text-primary-300">Khám phá trang du lịch <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-md bg-canvas p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            {providerName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-ink-deep" title={providerName}>
              {providerName}
            </span>
            <span className="block truncate text-[11px] text-muted">{session.email ?? session.phone}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="partner-workspace min-h-screen bg-canvas font-body text-ink">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] overflow-y-auto lg:block">{sidebar}</aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          ref={menuButtonRef}
          aria-expanded={drawerOpen}
          aria-label="Mở menu"
          className="rounded-md p-1.5 text-ink hover:bg-hover"
        >
          <Menu className="h-5 w-5" />
        </button>
        <VietTrackLogo size={28} />
        <span className="w-8" />
      </header>

      {/* Drawer mobile */}
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-deep/60 lg:hidden" />
          <Dialog.Content aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); menuButtonRef.current?.focus(); }} className="fixed inset-y-0 left-0 z-50 w-[min(300px,90vw)] overflow-y-auto bg-primary-900 shadow-[var(--shadow-teal)] lg:hidden">
            <Dialog.Title className="sr-only">Điều hướng nhà cung cấp</Dialog.Title>
            <Dialog.Close aria-label="Đóng menu" className="absolute right-2 top-2 rounded-md p-2 text-white hover:bg-white/10"><X className="h-4 w-4" /></Dialog.Close>
            {sidebar}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="lg:pl-[260px]">
        <div className="hidden h-[76px] items-center justify-between gap-4 border-b border-primary/10 bg-surface px-8 lg:flex">
          <div className="flex items-center gap-3 text-sm"><span className="text-muted">Không gian đối tác</span><ChevronRight className="h-4 w-4 text-muted" /><span className="font-semibold text-ink-deep">{pathname.startsWith('/partner/bookings') ? 'Đơn đặt phòng' : pathname.startsWith('/partner/reviews') ? 'Đánh giá của khách' : 'Quản lý homestay'}</span></div>
          <span className="max-w-64 truncate rounded-md border border-primary/15 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">{providerName}</span>
        </div>
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

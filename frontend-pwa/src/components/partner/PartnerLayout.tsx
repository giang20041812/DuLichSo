import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Home, LogOut, Menu, Smartphone, X } from 'lucide-react';
import { VietTrackLogo } from '@/components/ui/logo';
import { clearPortalSession } from '@/lib/authInterceptor';
import type { PortalLoginResponse } from '@/types/user';

const NAV_ITEMS = [
  { to: '/partner', label: 'Homestay của tôi', icon: Home, end: true, soon: false },
  { to: '/partner/bookings', label: 'Đơn đặt phòng', icon: Smartphone, end: false, soon: false },
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
  const [session] = useState(readSession);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <VietTrackLogo size={32} />
        <span className="mt-2 inline-block rounded-sm bg-coral-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-coral-hover">
          Cổng nhà cung cấp
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Điều hướng cổng nhà cung cấp">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, soon }) =>
          soon ? (
            <span
              key={to}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold text-muted/70"
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              <span className="rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-muted">Sắp ra mắt</span>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive ? 'bg-primary text-white shadow-[var(--shadow-teal)]' : 'text-ink hover:bg-primary-50 hover:text-primary'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="border-t border-border p-3">
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
    <div className="min-h-screen bg-canvas font-body text-ink">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-border bg-white lg:block">{sidebar}</aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Mở menu"
          className="rounded-md p-1.5 text-ink hover:bg-hover"
        >
          <Menu className="h-5 w-5" />
        </button>
        <VietTrackLogo size={28} />
        <span className="w-8" />
      </header>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Đóng menu"
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-hover"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

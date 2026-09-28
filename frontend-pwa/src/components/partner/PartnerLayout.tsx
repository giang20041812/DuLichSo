import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, Home, LogOut, Menu, Star, X, User, Lock, ChevronDown, BedDouble } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { VietTrackLogo, VietTrackLogoMark } from '@/components/ui/logo';
import PartnerNotificationDropdown from './PartnerNotificationDropdown';
import { clearPortalSession } from '@/lib/authInterceptor';
import type { PortalLoginResponse } from '@/types/user';

const getNavItems = (pathname: string) => {
  const match = pathname.match(/^\/partner\/homestay\/(\d+)/);
  const homestayId = match ? match[1] : '1';
  
  return [
    { to: '/partner', label: 'Tổng quan', icon: BarChart3, end: true, soon: false },
    { to: '/partner/homestays', label: 'Homestay của tôi', icon: Home, end: false, soon: false },
    { to: `/partner/homestay/${homestayId}/rooms`, label: 'Phòng và lịch', icon: BedDouble, end: false, soon: false },
    { to: '/partner/bookings', label: 'Đơn đặt phòng', icon: CalendarDays, end: false, soon: false },
    { to: '/partner/reviews', label: 'Đánh giá của khách', icon: Star, end: false, soon: false },
  ];
};

const readSession = (): PortalLoginResponse | null => {
  try {
    const raw = localStorage.getItem('portal_user');
    return raw ? (JSON.parse(raw) as PortalLoginResponse) : null;
  } catch {
    return null;
  }
};

export default function PartnerLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [session] = useState(readSession);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const allowed = session !== null && session.role === 'PROVIDER' && Boolean(localStorage.getItem('portal_token'));

  useEffect(() => {
    if (!allowed) navigate('/portal/login', { replace: true });
  }, [allowed, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!allowed) return null;

  const logout = () => {
    clearPortalSession();
    navigate('/portal/login', { replace: true });
  };

  const providerName = session.provider?.name ?? session.fullName ?? 'Nhà cung cấp';
  const userInitial = providerName.charAt(0).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col bg-white/90 border-r border-border text-ink backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <VietTrackLogoMark size={34} className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col leading-none">
          <span className="truncate text-lg font-black text-ink-deep">VietTrack</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-primary">Không gian đối tác</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng cổng nhà cung cấp">
        <ul className="flex flex-col gap-0.5">
          {getNavItems(pathname).map(({ to, label, icon: Icon, end, soon }) =>
            soon ? (
              <li key={to}>
                <span
                  aria-disabled="true"
                  className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] text-primary-200/70"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  <span className="rounded px-1.5 py-px text-[10px] border border-white/15">Sắp có</span>
                </span>
              </li>
            ) : (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) => {
                    const isMatched = isActive || (to === '/partner/homestays' && (pathname === '/partner/homestay/create' || /^\/partner\/homestay\/\d+\/edit$/.test(pathname)));
                    return `group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                      isMatched ? 'bg-primary font-bold text-white shadow-[var(--shadow-teal)]' : 'font-semibold text-ink hover:bg-primary-50 hover:text-primary'
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const isMatched = isActive || (to === '/partner/homestays' && (pathname === '/partner/homestay/create' || /^\/partner\/homestay\/\d+\/edit$/.test(pathname)));
                    return (
                      <>
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${isMatched ? 'text-white' : 'text-primary'}`} />
                        <span className="flex-1 truncate">{label}</span>
                      </>
                    );
                  }}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-white p-2.5 shadow-xs">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-xs font-bold text-primary">
            {userInitial}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-bold text-ink-deep" title={providerName}>{providerName}</div>
            <div className="truncate text-[11px] text-muted" title={session.email ?? session.phone ?? ''}>{session.email ?? session.phone}</div>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-border transition-colors hover:bg-primary-50 hover:text-primary"
          >
            <Home className="h-3.5 w-3.5" /> Trang chủ
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-border transition-colors hover:bg-danger/10 hover:text-danger hover:ring-danger/40"
          >
            <LogOut className="h-3.5 w-3.5" /> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="partner-workspace min-h-screen bg-canvas font-body text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

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
        <div className="flex items-center gap-2">
          <PartnerNotificationDropdown />
        </div>
      </header>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-deep/60 lg:hidden" />
          <Dialog.Content aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); menuButtonRef.current?.focus(); }} className="fixed inset-y-0 left-0 z-50 w-[min(300px,90vw)] overflow-y-auto bg-white lg:hidden">
            <Dialog.Title className="sr-only">Điều hướng nhà cung cấp</Dialog.Title>
            <Dialog.Close aria-label="Đóng menu" className="absolute right-2 top-2 rounded-md p-2 text-ink hover:bg-canvas"><X className="h-4 w-4" /></Dialog.Close>
            {sidebar}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="lg:pl-64">
        <div className="hidden lg:flex justify-end gap-4 px-8 pt-6 pb-2">
          <div className="flex items-center gap-4 relative" ref={profileRef}>
            <PartnerNotificationDropdown />
            
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 p-1.5 rounded-md border border-border bg-white hover:border-primary transition-all shadow-xs"
            >
              <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                {userInitial}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 mt-2 w-56 rounded-lg bg-white border border-border shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-border">
                  <div className="text-xs font-bold text-ink-deep truncate">{providerName}</div>
                  <div className="text-[11px] text-muted truncate">{session.email ?? session.phone}</div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/partner/profile'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink hover:bg-canvas hover:text-primary transition-colors text-left"
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <span>Thông tin cá nhân</span>
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/partner/profile?tab=password'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink hover:bg-canvas hover:text-primary transition-colors text-left"
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Đổi mật khẩu</span>
                  </button>
                </div>
                <div className="pt-1 mt-1 border-t border-border">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

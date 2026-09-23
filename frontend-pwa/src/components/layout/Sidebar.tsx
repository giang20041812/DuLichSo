import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  MapPin, 
  Utensils, 
  BedDouble, 
  Sparkles, 
  Bus, 
  Layers, 
  ShieldCheck, 
  HelpCircle, 
  X, 
  LogIn,
  UserPlus,
  LogOut
} from 'lucide-react';
import { VietTrackLogoMark } from '../ui/logo';

export interface SidebarProps {
  isDesktopOpen: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { id: 'home', path: '/', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
  { id: 'culture', path: '/culture', label: 'Văn hóa & Lễ hội', icon: <Compass className="w-5 h-5" /> },
  { id: 'homestays', path: '/homestays', label: 'Lưu trú / Homestay', icon: <BedDouble className="w-5 h-5" /> },
  { id: 'destinations', path: '/destinations', label: 'Địa điểm du lịch', icon: <MapPin className="w-5 h-5" /> },
  { id: 'restaurants', path: '/restaurants', label: 'Ẩm thực địa phương', icon: <Utensils className="w-5 h-5" /> },
  { id: 'tours', path: '/tours', label: 'Trải nghiệm du lịch', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'transport', path: '/transport', label: 'Vận chuyển', icon: <Bus className="w-5 h-5" /> },
  { id: 'services', path: '/services', label: 'Dịch vụ & Tiện ích', icon: <Layers className="w-5 h-5" /> },
];

export default function Sidebar({ isDesktopOpen, isMobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const rawUser = typeof window !== 'undefined' ? localStorage.getItem('portal_user') : null;
  const rawTraveler = typeof window !== 'undefined' ? localStorage.getItem('traveler_user') : null;
  const currentUser = rawUser
    ? JSON.parse(rawUser)
    : rawTraveler
      ? { ...JSON.parse(rawTraveler), role: 'TRAVELER' }
      : null;

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    localStorage.removeItem('traveler_token');
    localStorage.removeItem('traveler_user');
    navigate('/login');
  };

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavLinks = (isMobile = false) => (
    <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
        Khám phá & Đặt dịch vụ
      </div>
      {navItems.map((item) => {
        const active = isPathActive(item.path);
        return (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={() => {
              if (isMobile) onCloseMobile();
            }}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
              active 
                ? 'bg-[#048c73] text-white shadow-xs' 
                : 'text-[var(--color-ink)] hover:bg-[#edfbf7] hover:text-[#048c73]'
            }`}
          >
            <div className={`${active ? 'text-white' : 'text-[#048c73]'}`}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );

  const renderFooterActions = (isMobile = false) => (
    <div className="p-3 border-t border-gray-100 bg-gray-50/50">
      <div className="flex flex-col gap-1.5">
        <button 
          onClick={() => {
            if (isMobile) onCloseMobile();
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-[var(--color-ink-deep)] hover:bg-white rounded-md transition-colors text-left"
        >
          <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <span>Trung tâm hỗ trợ</span>
        </button>
        <button 
          onClick={() => {
            if (isMobile) onCloseMobile();
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-[var(--color-ink-deep)] hover:bg-white rounded-md transition-colors text-left"
        >
          <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
          <span>Chính sách & Bảo mật</span>
        </button>
        <div className="mt-2 pt-2 border-t border-gray-200/60 flex flex-col gap-1.5">
          {currentUser ? (
            <div className="p-2 rounded-md bg-white border border-gray-200/80 shadow-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[var(--color-primary-subtle,#E6F4F1)] text-[var(--color-primary,#048C73)] flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.role === 'ADMIN' ? 'AD' : currentUser.role === 'TRAVELER' ? (currentUser.fullName || 'K').charAt(0).toUpperCase() : 'NCC'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate" title={currentUser.fullName || currentUser.email}>
                    {currentUser.fullName || currentUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              {currentUser.role !== 'TRAVELER' && <button
                type="button"
                onClick={() => {
                  navigate(currentUser.role === 'ADMIN' ? '/admin' : '/partner');
                  if (isMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[var(--color-primary,#048C73)] text-white text-xs font-semibold rounded-md hover:bg-[#03705C] transition-colors shadow-xs"
              >
                <span>Vào Cổng {currentUser.role === 'ADMIN' ? 'Quản trị' : 'Đối tác'}</span>
              </button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                type="button"
                onClick={() => { 
                  navigate('/login'); 
                  if (isMobile) onCloseMobile(); 
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-[var(--color-primary,#048C73)] text-white text-xs font-bold rounded-md hover:bg-[#03705C] transition-colors shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  navigate('/register');
                  if (isMobile) onCloseMobile();
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white border border-gray-300 text-[var(--color-ink-deep,#0f2d3c)] text-xs font-bold rounded-md hover:border-[var(--color-primary,#048C73)] hover:text-[var(--color-primary,#048C73)] transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ============================================================ */}
      {/* 1. DESKTOP SIDEBAR: Hiện sẵn mặc định, fixed stick theo màn hình */}
      {/* ============================================================ */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-white border-r border-gray-200/80 transition-all duration-300 ease-in-out shrink-0 z-30 ${
          isDesktopOpen 
            ? 'w-[260px] opacity-100 translate-x-0' 
            : 'w-0 opacity-0 -translate-x-full pointer-events-none border-r-0'
        } overflow-hidden shadow-xs`}
      >
        <div className="w-[260px] flex flex-col h-full">
          {renderNavLinks(false)}
          {renderFooterActions(false)}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE SIDEBAR: Ẩn mặc định, chỉ hiện khi bật chế độ responsive */}
      {/* ============================================================ */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-[9999] w-[280px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header trên Mobile */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#edfbf7]/50">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { navigate('/'); onCloseMobile(); }}
          >
            <VietTrackLogoMark size={34} className="transition-transform group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black font-display text-[var(--color-ink-deep)]">VietTrack</span>
              <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-wider mt-1">Du Lịch Di Sản</span>
            </div>
          </div>
          <button 
            onClick={onCloseMobile}
            aria-label="Đóng menu"
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-white rounded-md transition-colors shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavLinks(true)}
        {renderFooterActions(true)}
      </aside>

    </>
  );
}

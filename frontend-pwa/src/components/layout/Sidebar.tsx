import { useState, useEffect } from 'react';
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
  Calendar,
  ShieldCheck, 
  HelpCircle, 
  X, 
  LogIn, 
  UserPlus, 
  LogOut 
} from 'lucide-react';
import { VietTrackLogoMark } from '../ui/logo';
import { clearAllAuthSession } from '@/services/authService';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  // Tương thích ngược với các lời gọi cũ nếu có
  isDesktopOpen?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onCloseDesktop?: () => void;
}

const navItems = [
  { id: 'home', path: '/', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
  { id: 'homestays', path: '/homestays', label: 'Lưu trú / Homestay', icon: <BedDouble className="w-5 h-5" /> },
  { id: 'bookings', path: '/bookings', label: 'Chuyến đi của tôi', icon: <Calendar className="w-5 h-5" /> },
  { id: 'culture', path: '/culture', label: 'Văn hóa & Lễ hội', icon: <Compass className="w-5 h-5" /> },
  { id: 'destinations', path: '/destinations', label: 'Địa điểm du lịch', icon: <MapPin className="w-5 h-5" /> },
  { id: 'restaurants', path: '/restaurants', label: 'Ẩm thực địa phương', icon: <Utensils className="w-5 h-5" /> },
  { id: 'tours', path: '/tours', label: 'Trải nghiệm du lịch', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'transport', path: '/transport', label: 'Vận chuyển', icon: <Bus className="w-5 h-5" /> },
  { id: 'services', path: '/services', label: 'Dịch vụ & Tiện ích', icon: <Layers className="w-5 h-5" /> },
];

export default function Sidebar({ 
  isOpen, 
  onClose,
  isDesktopOpen, 
  isMobileOpen, 
  onCloseMobile, 
  onCloseDesktop 
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định trạng thái mở/đóng và hàm đóng hợp nhất
  const activeOpen = isOpen !== undefined 
    ? isOpen 
    : Boolean(isDesktopOpen || isMobileOpen);

  const handleClose = () => {
    if (onClose) onClose();
    if (onCloseMobile) onCloseMobile();
    if (onCloseDesktop) onCloseDesktop();
  };

  const [, setAuthTick] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((t) => t + 1);
    window.addEventListener('auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const rawUser = typeof window !== 'undefined' ? localStorage.getItem('portal_user') : null;
  const rawTraveler = typeof window !== 'undefined' ? localStorage.getItem('traveler_user') : null;
  const currentUser = rawUser
    ? JSON.parse(rawUser)
    : rawTraveler
      ? { ...JSON.parse(rawTraveler), role: 'TRAVELER' }
      : null;

  const handleLogout = () => {
    clearAllAuthSession();
    navigate('/login');
  };

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* 1. Lớp phủ Backdrop mờ phía sau - Layer z-[9998] */}
      {activeOpen && (
        <div 
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[9998] transition-opacity duration-300"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar dạng Drawer với background trong suốt (frosted glass) - Layer cao nhất z-[9999] */}
      <aside
        className={`fixed inset-y-0 left-0 z-[9999] w-[300px] sm:w-[320px] bg-white/85 backdrop-blur-2xl border-r border-white/60 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          activeOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu điều hướng"
      >
        {/* Header trên cùng của Sidebar: Logo bên trái và DẤU X BÊN PHẢI TRÊN CÙNG ĐỂ TẮT */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 bg-white/40 backdrop-blur-md">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { 
              navigate('/'); 
              handleClose(); 
            }}
          >
            <VietTrackLogoMark size={34} className="transition-transform group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black font-display text-[var(--color-ink-deep)]">VietTrack</span>
              <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-wider mt-1">Du Lịch Di Sản</span>
            </div>
          </div>

          {/* Dấu X là 1 phần của sidebar (nằm ở góc phải trên cùng) để người dùng tắt */}
          <button 
            type="button"
            onClick={handleClose}
            aria-label="Đóng sidebar"
            title="Đóng sidebar"
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white/80 rounded-md transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách các danh mục điều hướng */}
        <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Khám phá & Đặt dịch vụ
          </div>
          {navItems.map((item) => {
            const active = isPathActive(item.path);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleClose}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-[#048c73] text-white shadow-xs font-bold' 
                    : 'text-[var(--color-ink)] hover:bg-white/70 hover:text-[#048c73]'
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

        {/* Phần chân trang bên dưới Sidebar: Hỗ trợ & Khối Đăng nhập / Đăng ký */}
        <div className="p-3.5 border-t border-gray-200/50 bg-white/40 backdrop-blur-md">
          <div className="flex flex-col gap-1.5">
            <button 
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-[var(--color-ink-deep)] hover:bg-white/80 rounded-md transition-colors text-left cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Trung tâm hỗ trợ</span>
            </button>
            <button 
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-[var(--color-ink-deep)] hover:bg-white/80 rounded-md transition-colors text-left cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Chính sách & Bảo mật</span>
            </button>

            {/* Khu vực Auth: Profile / Nút Đăng nhập, Đăng ký */}
            <div className="mt-2 pt-2 border-t border-gray-200/50 flex flex-col gap-1.5">
              {currentUser ? (
                <div className="p-2.5 rounded-md bg-white/90 border border-gray-200/80 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-[var(--color-primary-subtle,#E6F4F1)] text-[var(--color-primary,#048C73)] flex items-center justify-center text-xs font-bold shrink-0">
                        {currentUser.role === 'ADMIN' ? 'AD' : currentUser.role === 'TRAVELER' ? (currentUser.fullName || 'K').charAt(0).toUpperCase() : 'NCC'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate" title={currentUser.fullName || currentUser.email}>
                          {currentUser.fullName || currentUser.email}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {currentUser.role === 'ADMIN' ? 'Quản trị viên' : currentUser.role === 'TRAVELER' ? 'Khách du lịch' : 'Đối tác'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                  {currentUser.role !== 'TRAVELER' && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(currentUser.role === 'ADMIN' ? '/admin' : '/partner');
                        handleClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[var(--color-primary,#048C73)] text-white text-xs font-semibold rounded-md hover:bg-[#03705C] transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Vào Cổng {currentUser.role === 'ADMIN' ? 'Quản trị' : 'Đối tác'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    type="button"
                    onClick={() => { 
                      navigate('/login'); 
                      handleClose(); 
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
                      handleClose();
                    }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white/90 border border-gray-300 text-[var(--color-ink-deep,#0f2d3c)] text-xs font-bold rounded-md hover:border-[var(--color-primary,#048C73)] hover:text-[var(--color-primary,#048C73)] transition-colors shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Đăng ký</span>
                  </button>
                </div>
              )}

              {/* Nút dành cho Đối tác */}
              <div className="mt-1 pt-1.5 border-t border-gray-200/40">
                <button 
                  type="button"
                  onClick={() => { 
                    navigate('/partner'); 
                    handleClose(); 
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/90 border border-gray-200/80 text-[var(--color-ink-deep)] text-xs font-bold rounded-md hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Dành cho Đối tác</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

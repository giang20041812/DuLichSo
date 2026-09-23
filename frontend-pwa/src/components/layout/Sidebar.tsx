import { useEffect } from 'react';
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
  ExternalLink 
} from 'lucide-react';
import { VietTrackLogoMark } from '../ui/logo';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'home', path: '/', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
  { id: 'homestays', path: '/homestays', label: 'Lưu trú / Homestay', icon: <BedDouble className="w-5 h-5" /> },
  { id: 'culture', path: '/culture', label: 'Văn hóa & Lễ hội', icon: <Compass className="w-5 h-5" /> },
  { id: 'destinations', path: '/destinations', label: 'Địa điểm du lịch', icon: <MapPin className="w-5 h-5" /> },
  { id: 'restaurants', path: '/restaurants', label: 'Ẩm thực địa phương', icon: <Utensils className="w-5 h-5" /> },
  { id: 'tours', path: '/tours', label: 'Trải nghiệm du lịch', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'transport', path: '/transport', label: 'Di chuyển', icon: <Bus className="w-5 h-5" /> },
  { id: 'services', path: '/services', label: 'Dịch vụ & Tiện ích', icon: <Layers className="w-5 h-5" /> },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/culture') return location.pathname.startsWith('/culture') || location.pathname.startsWith('/explore');
    if (path === '/restaurants') return location.pathname.startsWith('/restaurants') || location.pathname.startsWith('/food');
    if (path === '/tours') return location.pathname.startsWith('/tours') || location.pathname.startsWith('/experiences');
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Lớp phủ Backdrop mờ phía sau */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9998] transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar dạng Drawer với background màu trong suốt (frosted glass) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[9999] w-[290px] sm:w-[320px] bg-white/80 backdrop-blur-2xl border-r border-white/50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Menu"
      >
        {/* Header trên cùng của Sidebar: Chứa Logo bên trái và DẤU X BÊN PHẢI TRÊN CÙNG ĐỂ TẮT */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 bg-white/40 backdrop-blur-md">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { 
              navigate('/'); 
              onClose(); 
            }}
          >
            <VietTrackLogoMark size={34} className="transition-transform group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black font-display text-[var(--color-ink-deep)]">VietTrack</span>
              <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-wider mt-1">Du Lịch Di Sản</span>
            </div>
          </div>

          {/* Dấu X bên phải trên cùng của sidebar để tắt */}
          <button 
            onClick={onClose}
            aria-label="Đóng menu"
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
                onClick={onClose}
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

        {/* Phần chân trang bên dưới Sidebar */}
        <div className="p-3 border-t border-gray-200/50 bg-white/40 backdrop-blur-md">
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-[var(--color-ink-deep)] hover:bg-white/80 rounded-md transition-colors text-left cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Trung tâm hỗ trợ</span>
            </button>
            <button 
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-[var(--color-ink-deep)] hover:bg-white/80 rounded-md transition-colors text-left cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Chính sách & Bảo mật</span>
            </button>
            <div className="mt-2 pt-2 border-t border-gray-200/40">
              <button 
                onClick={() => { 
                  navigate('/partner'); 
                  onClose(); 
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/90 border border-gray-200/80 text-[var(--color-ink-deep)] text-xs font-bold rounded-md hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-white transition-all shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Dành cho Đối tác
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

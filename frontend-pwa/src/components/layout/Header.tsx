import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Menu, 
  Home, 
  Compass, 
  BedDouble, 
  MapPin, 
  Utensils, 
  Sparkles, 
  Bus, 
  Layers 
} from "lucide-react";
import { VietTrackLogoMark } from "../ui/logo";

interface HeaderProps {
  toggleSidebar?: () => void;
}

const navLinks = [
  { id: 'home', path: '/', label: 'Trang chủ', icon: <Home className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'homestays', path: '/homestays', label: 'Lưu trú', icon: <BedDouble className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'culture', path: '/culture', label: 'Văn hóa', icon: <Compass className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'destinations', path: '/destinations', label: 'Điểm đến', icon: <MapPin className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'restaurants', path: '/restaurants', label: 'Ẩm thực', icon: <Utensils className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'tours', path: '/tours', label: 'Trải nghiệm', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'transport', path: '/transport', label: 'Di chuyển', icon: <Bus className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'services', path: '/services', label: 'Dịch vụ & Tiện ích', icon: <Layers className="w-3.5 h-3.5 shrink-0" /> },
];

export default function Header({ toggleSidebar }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Scroll listener for sticky navigation state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpen = () => {
    if (toggleSidebar) toggleSidebar();
  };

  // Các trang có hero image dùng header transparent khi ở đỉnh trang
  const hasHeroImage = location.pathname === '/' || 
    location.pathname.startsWith('/culture') || 
    location.pathname.startsWith('/explore') || 
    location.pathname.startsWith('/homestays') || 
    location.pathname.startsWith('/restaurants') || 
    location.pathname.startsWith('/food') || 
    location.pathname.startsWith('/destinations') || 
    location.pathname.startsWith('/transport') || 
    location.pathname.startsWith('/services') || 
    location.pathname.startsWith('/photo') || 
    location.pathname.startsWith('/rental') || 
    location.pathname.startsWith('/tours');

  const isSolid = !hasHeroImage || isScrolled;

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/culture') return location.pathname.startsWith('/culture') || location.pathname.startsWith('/explore');
    if (path === '/restaurants') return location.pathname.startsWith('/restaurants') || location.pathname.startsWith('/food');
    if (path === '/tours') return location.pathname.startsWith('/tours') || location.pathname.startsWith('/experiences');
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 flex flex-col w-full transition-all duration-300 ${
        isSolid
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/80'
          : 'bg-gradient-to-b from-black/75 via-black/40 to-transparent'
      }`}
    >
      {/* Row 1: 3 sọc bên trái, Logo căn giữa */}
      <div
        className={`relative w-full px-4 md:px-6 flex items-center justify-center transition-all duration-300 ${
          isScrolled ? 'py-1.5' : 'py-2.5'
        }`}
      >
        {/* Nút Menu 3 sọc: CHỈ DÙNG ĐỂ BẬT SIDEBAR */}
        <button
          onClick={handleOpen}
          aria-label="Mở menu điều hướng"
          title="Mở menu điều hướng"
          className={`absolute left-3 md:left-6 p-2 rounded-md transition-all cursor-pointer flex items-center justify-center z-10 ${
            isSolid
              ? 'text-[var(--color-ink-deep)] hover:bg-[#edfbf7] hover:text-[#048c73] active:scale-95'
              : 'text-white drop-shadow-md hover:bg-white/20 active:scale-95'
          }`}
        >
          <Menu className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.2} />
        </button>

        {/* Logo & Tên nền tảng - Căn giữa hoàn toàn */}
        <Link to="/" className="flex items-center gap-2 md:gap-2.5 shrink-0 group py-0.5">
          <VietTrackLogoMark
            size={isScrolled ? 32 : 38}
            className="transition-all duration-300 group-hover:scale-105 drop-shadow-sm"
          />
          <div className="flex flex-col items-start leading-none">
            <span
              className={`font-black font-display tracking-tight transition-all duration-300 ${
                isScrolled ? 'text-[17px] md:text-[20px]' : 'text-[20px] md:text-[23px]'
              } ${isSolid ? 'text-[var(--color-ink-deep)]' : 'text-white drop-shadow-md'}`}
            >
              VietTrack
            </span>
            <span
              className={`font-semibold tracking-wider uppercase mt-0.5 transition-all duration-300 ${
                isScrolled ? 'text-[8.5px] md:text-[9.5px]' : 'text-[9.5px] md:text-[10.5px]'
              } ${isSolid ? 'text-[#66716c]' : 'text-white/90 drop-shadow'}`}
            >
              Du Lịch Di Sản & Sinh Thái
            </span>
          </div>
        </Link>
      </div>

      {/* Row 2: Thanh Navigation kéo ngang khi responsive */}
      <div 
        className={`w-full overflow-x-auto scrollbar-hide scroll-smooth px-3 sm:px-6 py-1.5 border-t transition-colors duration-300 flex justify-start md:justify-center ${
          isSolid 
            ? 'border-gray-200/60 bg-gray-50/40' 
            : 'border-white/15 bg-black/10 backdrop-blur-xs'
        }`}
      >
        <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-max mx-auto justify-start md:justify-center">
          {navLinks.map((item) => {
            const active = isPathActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  active
                    ? 'bg-[#048c73] text-white shadow-xs font-bold'
                    : isSolid
                      ? 'text-[var(--color-ink)] hover:bg-[#edfbf7] hover:text-[#048c73]'
                      : 'text-white/95 hover:bg-white/20 hover:text-white drop-shadow-xs'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

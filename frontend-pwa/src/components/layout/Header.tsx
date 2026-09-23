import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { VietTrackLogoMark } from "../ui/logo"

interface HeaderProps {
  toggleSidebar?: () => void;
}

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

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 flex flex-col w-full transition-all duration-300 ${
        isSolid
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/80'
          : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
      }`}
    >
      <div
        className={`relative w-full px-4 md:px-6 flex items-center justify-center transition-all duration-300 ${
          isScrolled ? 'py-2' : 'py-3'
        }`}
      >
        {/* Nút Menu Hamburger BÊN TRÁI - Hoàn toàn sát mép trái của toàn bộ trang web */}
        <button
          onClick={toggleSidebar}
          aria-label="Mở menu điều hướng"
          title="Menu điều hướng"
          className={`absolute left-4 md:left-6 p-2 rounded-md transition-all cursor-pointer flex items-center justify-center z-10 ${
            isSolid
              ? 'text-[var(--color-ink-deep)] hover:bg-[#edfbf7] hover:text-[#048c73] active:scale-95'
              : 'text-white drop-shadow-md hover:bg-white/20 active:scale-95'
          }`}
        >
          <Menu className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.2} />
        </button>

        {/* Logo & Tên nền tảng - Căn giữa hoàn toàn */}
        <Link to="/" className="flex items-center gap-2.5 md:gap-3 shrink-0 group">
          <VietTrackLogoMark
            size={isScrolled ? 36 : 46}
            className="transition-all duration-300 group-hover:scale-105 drop-shadow-sm"
          />
          <div className="flex flex-col items-start leading-none">
            <span
              className={`font-black font-display tracking-tight transition-all duration-300 ${
                isScrolled ? 'text-[19px] md:text-[22px]' : 'text-[22px] md:text-[26px]'
              } ${isSolid ? 'text-[var(--color-ink-deep)]' : 'text-white drop-shadow-md'}`}
            >
              VietTrack
            </span>
            <span
              className={`font-semibold tracking-wider uppercase mt-1 transition-all duration-300 ${
                isScrolled ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-[11px]'
              } ${isSolid ? 'text-[#66716c]' : 'text-white/90 drop-shadow'}`}
            >
              Du Lịch Di Sản & Sinh Thái
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}

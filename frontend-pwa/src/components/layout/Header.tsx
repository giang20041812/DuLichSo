import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { 
  Compass, Menu, X, Download, HelpCircle, ShieldCheck, BadgeInfo, Building,
  Home, BedDouble, MapPin, Utensils, Sparkles, Bus, Layers 
} from "lucide-react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const location = useLocation();

  // Tất cả các trang có hero banner đều dùng header transparent
  const hasHeroImage = location.pathname === '/' || location.pathname.startsWith('/homestays') || location.pathname.startsWith('/destinations') || location.pathname.startsWith('/tours');

  const openMobileMenu = () => {
    setDrawerMounted(true);
    setMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      setDrawerMounted(false);
    }, 300);
  };

  // Close drawer on route change
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      closeMobileMenu();
    }
  }, [location.pathname]);

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    if (hasHeroImage) {
      return isActive
        ? "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-md font-bold text-sm bg-white text-[#048c73] shadow-md transition-all border border-white"
        : "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-md border border-white/25 backdrop-blur-md font-medium text-sm text-white hover:border-white hover:bg-white/15 transition-all shadow-xs";
    }
    return isActive
      ? "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-md font-bold text-sm bg-[#048c73] text-white shadow-sm transition-all border border-[#048c73]"
      : "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-md border border-transparent font-medium text-sm text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] hover:bg-[#edfbf7] transition-all";
  };

  return (
    <>
      <header className={`absolute top-0 z-50 flex flex-col w-full transition-all duration-300 ${hasHeroImage ? 'bg-transparent' : 'bg-white shadow-sm border-b border-gray-200'}`}>

        {/* Row 1: Logo căn giữa */}
        <div className="relative max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-4 pb-2 flex items-center justify-center">
          {/* Logo & Tên nền tảng - Căn giữa hoàn toàn */}
          <Link to="/" className="flex items-center gap-2.5 md:gap-3 shrink-0 group">
            <div className={`backdrop-blur-sm p-2 rounded-md shadow-sm transition-transform group-hover:scale-105 ${hasHeroImage ? 'bg-white/20 text-white border border-white/30' : 'bg-[var(--color-primary)] text-white'}`}>
              <Compass className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className={`text-[22px] md:text-[26px] font-bold font-display leading-none tracking-tight ${hasHeroImage ? 'text-white drop-shadow-md' : 'text-[var(--color-ink-deep)]'}`}>
                VietJourney
              </span>
            </div>
          </Link>

          {/* Nút Menu Hamburger trên mobile (đặt góc phải) */}
          <button
            onClick={openMobileMenu}
            aria-label="Mở menu"
            className="lg:hidden absolute right-4 p-1.5 text-white drop-shadow-md hover:bg-white/10 rounded-md transition-colors"
          >
            <Menu className={`w-6 h-6 ${hasHeroImage ? 'text-white' : 'text-[var(--color-ink-deep)]'}`} strokeWidth={1.5} />
          </button>
        </div>

        {/* Row 2: Navigation - Đặt ở dưới, hỗ trợ lướt ngang theo responsive với icon sống động */}
        <div className="w-full flex justify-start md:justify-center overflow-x-auto scrollbar-hide px-4 md:px-8 py-2 scroll-smooth">
          <nav className="flex items-center gap-1.5 md:gap-2 shrink-0 mx-auto md:mx-auto">
            <Link to="/" className={getNavLinkClass('/')}>
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <Link to="/explore" className={getNavLinkClass('/explore')}>
              <Compass className="w-3.5 h-3.5" />
              <span>Khám phá</span>
            </Link>
            <Link to="/homestays" className={getNavLinkClass('/homestays')}>
              <BedDouble className="w-3.5 h-3.5" />
              <span>Lưu trú</span>
            </Link>
            <Link to="/destinations" className={getNavLinkClass('/destinations')}>
              <MapPin className="w-3.5 h-3.5" />
              <span>Điểm đến</span>
            </Link>
            <Link to="/food" className={getNavLinkClass('/food')}>
              <Utensils className="w-3.5 h-3.5" />
              <span>Ăn uống</span>
            </Link>
            <Link to="/tours" className={getNavLinkClass('/tours')}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trải nghiệm</span>
            </Link>
            <Link to="/transport" className={getNavLinkClass('/transport')}>
              <Bus className="w-3.5 h-3.5" />
              <span>Vận chuyển</span>
            </Link>
            <Link to="/services" className={getNavLinkClass('/services')}>
              <Layers className="w-3.5 h-3.5" />
              <span>Dịch vụ & Tiện ích</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer (Hamburger Menu) */}
      {drawerMounted && (
        <div className={`lg:hidden fixed inset-0 z-[99999] flex justify-start ${mobileMenuOpen ? 'fade-in-overlay' : 'fade-out-overlay'}`}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileMenu}
          ></div>

          {/* Drawer Content */}
          <div className={`relative w-full max-w-[300px] bg-white h-full flex flex-col shadow-2xl ${mobileMenuOpen ? 'drawer-slide-in' : 'drawer-slide-out'}`}>
            <div className="flex justify-between items-center p-4 border-b border-[#66716c]/10">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="text-lg font-bold font-display text-[#0f2d3c]">VietJourney</span>
              </div>
              <button onClick={closeMobileMenu} className="p-2 text-[#66716c] hover:text-[#0f2d3c]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="flex flex-col py-2 border-b border-[#66716c]/10">
                <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <Home className="w-4 h-4 text-[#048c73]" />
                  <span>Trang chủ</span>
                </Link>
                <Link to="/explore" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <Compass className="w-4 h-4 text-[#048c73]" />
                  <span>Khám phá</span>
                </Link>
                <Link to="/homestays" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <BedDouble className="w-4 h-4 text-[#048c73]" />
                  <span>Lưu trú</span>
                </Link>
                <Link to="/destinations" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <MapPin className="w-4 h-4 text-[#048c73]" />
                  <span>Điểm đến</span>
                </Link>
                <Link to="/food" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <Utensils className="w-4 h-4 text-[#048c73]" />
                  <span>Ăn uống</span>
                </Link>
                <Link to="/tours" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <Sparkles className="w-4 h-4 text-[#048c73]" />
                  <span>Trải nghiệm</span>
                </Link>
                <Link to="/transport" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <Bus className="w-4 h-4 text-[#048c73]" />
                  <span>Vận chuyển</span>
                </Link>
                <Link to="/services" onClick={closeMobileMenu} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-[#0f2d3c] hover:bg-[#edfbf7] hover:text-[#048c73] transition-colors">
                  <Layers className="w-4 h-4 text-[#048c73]" />
                  <span>Dịch vụ & Tiện ích</span>
                </Link>
              </div>

              <div className="flex flex-col py-2">
                <button className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f9fa] text-left text-sm text-[#4a5568]">
                  <Download className="w-5 h-5" strokeWidth={1.5} />
                  <span>Tải ứng dụng</span>
                </button>
                <button className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f9fa] text-left text-sm text-[#4a5568]">
                  <Building className="w-5 h-5" strokeWidth={1.5} />
                  <span>Hợp tác cùng chúng tôi</span>
                </button>
                <button className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f9fa] text-left text-sm text-[#4a5568]">
                  <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
                  <span>Liên hệ hỗ trợ</span>
                </button>
                <button className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f9fa] text-left text-sm text-[#4a5568]">
                  <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
                  <span>Chính sách bảo mật</span>
                </button>
                <button className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f9fa] text-left text-sm text-[#4a5568]">
                  <BadgeInfo className="w-5 h-5" strokeWidth={1.5} />
                  <span>Về VietJourney</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ShieldCheck, Globe, Compass, Menu, X, Download, HelpCircle, BadgeInfo, Building } from "lucide-react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);

  // Handle drawer animation delay
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (mobileMenuOpen) {
      setDrawerMounted(true);
    } else {
      timer = setTimeout(() => setDrawerMounted(false), 300);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="absolute top-0 z-50 flex flex-col w-full transition-all duration-300 bg-transparent">


        {/* Main Header - Desktop */}
        <div className="hidden lg:flex flex-col items-center px-8 pt-4 pb-2 gap-4">
          <div className="max-w-[1280px] mx-auto w-full flex justify-center items-center">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="bg-white/20 backdrop-blur-sm text-white p-2.5 rounded-2xl shadow-sm">
                <Compass className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-[26px] font-bold font-display text-white leading-none tracking-tight drop-shadow-md">
                  VietJourney
                </span>
                <span className="text-[11px] font-bold text-white/90 tracking-widest uppercase mt-1.5 drop-shadow-md">
                  Khám Phá Việt Nam
                </span>
              </div>
            </Link>
            
          </div>

          {/* Center/Right: Responsive-style Navigation */}
          <div className="flex justify-center w-full mt-2">
            <div className="flex items-center gap-3">
              <Link to="/destinations" className="whitespace-nowrap px-5 py-2 rounded-full border border-white/40 text-white hover:border-white hover:bg-white/10 backdrop-blur-md font-medium text-sm transition-colors shadow-sm">Điểm đến</Link>
              <Link to="/tours" className="whitespace-nowrap px-5 py-2 rounded-full border border-white/40 text-white hover:border-white hover:bg-white/10 backdrop-blur-md font-medium text-sm transition-colors shadow-sm">Tour & Trải nghiệm</Link>
              <Link to="/homestays" className="whitespace-nowrap px-5 py-2 rounded-full border border-white/40 text-white hover:border-white hover:bg-white/10 backdrop-blur-md font-medium text-sm transition-colors shadow-sm">Homestay & Khách sạn</Link>
              <Link to="/food" className="whitespace-nowrap px-5 py-2 rounded-full border border-white/40 text-white hover:border-white hover:bg-white/10 backdrop-blur-md font-medium text-sm transition-colors shadow-sm">Ẩm thực & Đặc sản</Link>
              <Link to="/transport" className="whitespace-nowrap px-5 py-2 rounded-full border border-white/40 text-white hover:border-white hover:bg-white/10 backdrop-blur-md font-medium text-sm transition-colors shadow-sm">Vận chuyển</Link>
              <Link to="/services" className="whitespace-nowrap px-5 py-2 rounded-full border border-white/40 text-white hover:border-white hover:bg-white/10 backdrop-blur-md font-medium text-sm transition-colors shadow-sm">Dịch vụ/Tiện ích</Link>
              <Link to="/portal/login" className="whitespace-nowrap px-4 py-2 rounded-full bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/40 font-medium text-sm transition-colors shadow-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
                Cổng Quản Trị
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header - Mobile */}
        <div className="flex lg:hidden flex-col w-full">
          {/* Row 1: Logo + Icons */}
          <div className="flex justify-between items-center px-4 h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-xl shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[20px] font-bold font-display text-white leading-none tracking-tight drop-shadow-md">
                VietJourney
              </span>
            </Link>
            <div className="flex items-center gap-5 text-white">
              <button onClick={() => setMobileMenuOpen(true)}><Menu className="w-7 h-7 drop-shadow-md" strokeWidth={1.5} /></button>
            </div>
          </div>
          
          {/* Row 2: Scrollable Nav */}
          <div className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide items-center">
            <Link to="/destinations" className="whitespace-nowrap px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 backdrop-blur-md font-medium text-sm shadow-sm">Điểm đến</Link>
            <Link to="/tours" className="whitespace-nowrap px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 backdrop-blur-md font-medium text-sm shadow-sm">Tour & Trải nghiệm</Link>
            <Link to="/homestays" className="whitespace-nowrap px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 backdrop-blur-md font-medium text-sm shadow-sm">Homestay & Khách sạn</Link>
            <Link to="/food" className="whitespace-nowrap px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 backdrop-blur-md font-medium text-sm shadow-sm">Ẩm thực & Đặc sản</Link>
            <Link to="/transport" className="whitespace-nowrap px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 backdrop-blur-md font-medium text-sm shadow-sm">Vận chuyển</Link>
            <Link to="/services" className="whitespace-nowrap px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 backdrop-blur-md font-medium text-sm shadow-sm">Dịch vụ/Tiện ích</Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Hamburger Menu) */}
      {drawerMounted && (
        <div className={`lg:hidden fixed inset-0 z-[99999] flex justify-start ${mobileMenuOpen ? 'fade-in-overlay' : 'fade-out-overlay'}`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className={`relative w-full max-w-[320px] bg-white h-full flex flex-col shadow-2xl ${mobileMenuOpen ? 'drawer-slide-in' : 'drawer-slide-out'}`}>
            <div className="flex justify-between items-center p-4 border-b border-[#66716c]/10">
              <h2 className="text-xl font-bold font-display text-[#0f2d3c]">More</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#66716c] hover:text-[#0f2d3c]">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2">
              <div className="flex flex-col">
                <button className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left">
                  <span className="font-medium text-[#4a5568] w-8">VND</span>
                  <span className="text-[#0f2d3c] font-medium">Vietnamese Đồng</span>
                </button>
                <button className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left">
                  <Globe className="w-6 h-6 text-[#4a5568]" strokeWidth={1.5} />
                  <span className="text-[#0f2d3c] font-medium">Tiếng Việt</span>
                </button>
                <button className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left">
                  <Download className="w-6 h-6 text-[#4a5568]" strokeWidth={1.5} />
                  <span className="text-[#0f2d3c] font-medium">Tải ứng dụng</span>
                </button>
                <Link
                  to="/portal/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left"
                >
                  <Building className="w-6 h-6 text-[#4a5568]" strokeWidth={1.5} />
                  <span className="text-[#0f2d3c] font-medium">Cổng Quản Trị & Đối Tác</span>
                </Link>
              </div>

              <hr className="border-[#66716c]/10 my-2" />
              
              <div className="px-6 py-4 pb-2">
                <h3 className="font-bold text-[#0f2d3c] mb-2">Trợ giúp và hỗ trợ</h3>
              </div>
              <div className="flex flex-col">
                <button className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left">
                  <HelpCircle className="w-6 h-6 text-[#4a5568]" strokeWidth={1.5} />
                  <span className="text-[#0f2d3c] font-medium">Liên hệ hỗ trợ</span>
                </button>
                <button className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left">
                  <ShieldCheck className="w-6 h-6 text-[#4a5568]" strokeWidth={1.5} />
                  <span className="text-[#0f2d3c] font-medium">Chính sách bảo mật</span>
                </button>
              </div>

              <hr className="border-[#66716c]/10 my-2" />
              
              <div className="px-6 py-4 pb-2">
                <h3 className="font-bold text-[#0f2d3c] mb-2">Thông tin khác</h3>
              </div>
              <div className="flex flex-col">
                <button className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left">
                  <BadgeInfo className="w-6 h-6 text-[#4a5568]" strokeWidth={1.5} />
                  <span className="text-[#0f2d3c] font-medium">Về VietJourney</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

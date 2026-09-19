import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { Phone, ShieldCheck, Globe, Heart, Zap, User, Compass, Menu, UserCircle, X, Download, HelpCircle, BadgeInfo, Building } from "lucide-react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerAnimating, setDrawerAnimating] = useState(false);

  // Handle drawer animation delay
  useEffect(() => {
    if (mobileMenuOpen) {
      setDrawerMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDrawerAnimating(true);
        });
      });
    } else {
      setDrawerAnimating(false);
      const timer = setTimeout(() => setDrawerMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-[#66716c]/10 text-[#0f2d3c] flex flex-col w-full shadow-sm">
        {/* Top Bar (Desktop only) */}
        <div className="bg-[#f8f9fa] border-b border-[#66716c]/10 h-10 hidden lg:flex items-center">
          <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 flex justify-between items-center text-[11px] font-medium text-[#66716c]">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 hover:text-[#16709a] transition-colors cursor-pointer">
                <Phone className="w-3 h-3" />
                <span>Hotline 24/7: <span className="font-bold text-[#16709a]">1900 6868</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3f7656]" />
                <span>Cam kết 100% trải nghiệm bản địa đích thực</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 hover:text-[#0f2d3c] transition-colors cursor-pointer">
                <Globe className="w-3.5 h-3.5" />
                <span>VN | EN</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-[#d04648] transition-colors cursor-pointer">
                <Heart className="w-3.5 h-3.5" />
                <span>Yêu thích</span>
                <span className="bg-[#d04648]/10 text-[#d04648] rounded-full px-1.5 py-0.5 text-[9px] font-bold">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header - Desktop */}
        <div className="hidden lg:flex h-24 items-center px-8">
          <div className="max-w-[1280px] mx-auto w-full flex justify-between items-center gap-4">
            
            {/* Left Side: Logo + Navigation */}
            <div className="flex items-center gap-10 xl:gap-14">
              <Link to="/" className="flex items-center gap-3">
                <div className="bg-[#0f5a70] text-white p-2.5 rounded-2xl shadow-sm">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[22px] font-bold font-display text-[#16709a] leading-none tracking-tight">
                    VietJourney
                  </span>
                  <span className="text-[10px] font-bold text-[#3f7656] tracking-widest uppercase mt-1.5">
                    Khám Phá Việt Nam
                  </span>
                </div>
              </Link>
              
              <nav className="flex gap-8 items-start text-[14px] font-semibold text-[#4a5568] leading-snug">
                <Link to="/destinations" className="hover:text-[#16709a] transition-colors">Điểm<br/>đến</Link>
                <Link to="/tours" className="hover:text-[#16709a] transition-colors">Tour & Trải<br/>nghiệm</Link>
                <Link to="/homestays" className="hover:text-[#16709a] transition-colors">Homestay &<br/>Khách sạn</Link>
                <Link to="/food" className="hover:text-[#16709a] transition-colors">Ẩm thực &<br/>Đặc sản</Link>
                <Link to="/guide" className="hover:text-[#16709a] transition-colors">Cẩm nang<br/>du lịch</Link>
              </nav>
            </div>

            {/* Right Side: Auth + CTA */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <Link to="/register" className="text-[14px] font-bold text-[#16709a] hover:underline transition-all">
                  Đăng nhập
                </Link>
                <span className="text-[#16709a] font-bold">/</span>
                <Link to="/login" className="text-[14px] font-bold text-[#16709a] hover:underline transition-all">
                  Đăng ký
                </Link>
              </div>
              
              <Button className="bg-[#9e6d23] hover:bg-[#7a5316] text-white font-bold rounded-xl px-5 h-10 flex items-center gap-1.5 shadow-sm ml-2">
                <Zap className="w-4 h-4" fill="currentColor" />
                Đặt tour nhanh
              </Button>
              
              <Button size="icon" className="rounded-full bg-[#0f5a70] hover:bg-[#0b4353] text-white h-10 w-10 shadow-sm shrink-0">
                <User className="w-4 h-4" />
              </Button>
            </div>
            
          </div>
        </div>

        {/* Main Header - Mobile */}
        <div className="flex lg:hidden flex-col w-full">
          {/* Row 1: Logo + Icons */}
          <div className="flex justify-between items-center px-4 h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-[#0f5a70] text-white p-2 rounded-xl shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[20px] font-bold font-display text-[#16709a] leading-none tracking-tight">
                VietJourney
              </span>
            </Link>
            <div className="flex items-center gap-5 text-[#0f2d3c]">
              <Link to="/login"><UserCircle className="w-7 h-7" strokeWidth={1.5} /></Link>
              <button onClick={() => setMobileMenuOpen(true)}><Menu className="w-7 h-7" strokeWidth={1.5} /></button>
            </div>
          </div>
          
          {/* Row 2: Scrollable Nav */}
          <div className="flex overflow-x-auto gap-3 px-4 pb-3 scrollbar-hide items-center">
            <Link to="/destinations" className="whitespace-nowrap px-4 py-2 rounded-full border-2 border-[#16709a] text-[#16709a] font-bold text-sm bg-[#ebf6fa]">Điểm đến</Link>
            <Link to="/tours" className="whitespace-nowrap px-4 py-2 rounded-full border border-[#66716c]/30 text-[#4a5568] font-medium text-sm">Tour & Trải nghiệm</Link>
            <Link to="/homestays" className="whitespace-nowrap px-4 py-2 rounded-full border border-[#66716c]/30 text-[#4a5568] font-medium text-sm">Homestay & Khách sạn</Link>
            <Link to="/food" className="whitespace-nowrap px-4 py-2 rounded-full border border-[#66716c]/30 text-[#4a5568] font-medium text-sm">Ẩm thực & Đặc sản</Link>
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
                <button className="flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] text-left">
                  <Building className="w-6 h-6 text-[#4a5568]" strokeWidth={1.5} />
                  <span className="text-[#0f2d3c] font-medium">Hợp tác cùng chúng tôi</span>
                </button>
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

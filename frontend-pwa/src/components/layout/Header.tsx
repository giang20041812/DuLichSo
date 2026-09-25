import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, 
  Home, 
  Compass, 
  BedDouble, 
  MapPin, 
  Utensils, 
  Sparkles, 
  Bus, 
  Layers,
  LogIn,
  UserPlus,
  User,
  LogOut,
  ChevronDown,
  Calendar,
  X,
  ShieldCheck
} from "lucide-react";
import { VietTrackLogoMark } from "../ui/logo";
import { getCurrentCustomer, clearAllAuthSession, type CurrentCustomer } from "@/services/authService";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
  isSidebarOpen?: boolean;
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

export default function Header({ isSidebarOpen = false, toggleSidebar }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<CurrentCustomer | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Đồng bộ phiên người dùng và lắng nghe sự thay đổi
  useEffect(() => {
    const syncUser = () => {
      setUser(getCurrentCustomer());
    };
    syncUser();
    window.addEventListener('auth_change', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('auth_change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLogout = () => {
    setIsDropdownOpen(false);
    clearAllAuthSession();
    navigate('/login');
  };

  const handleOpenProfile = () => {
    setIsDropdownOpen(false);
    setIsProfileModalOpen(true);
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

  const userInitial = user?.fullName
    ? user.fullName.trim().charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 flex flex-col w-full transition-all duration-300 ${
          isSolid
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/80'
            : 'bg-gradient-to-b from-black/75 via-black/40 to-transparent'
        }`}
      >
        {/* Row 1: Menu bên trái, Logo căn giữa, Auth/User bên phải */}
        <div
          className={`relative w-full px-4 md:px-6 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'py-1.5' : 'py-2.5'
          }`}
        >
          {/* Cụm bên trái: Nút Menu 3 sọc */}
          <div className="flex items-center min-w-[40px]">
            {toggleSidebar && (
              <button
                type="button"
                onClick={handleOpen}
                aria-label="Mở menu điều hướng"
                title="Mở menu điều hướng"
                className={`p-2 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                  isSidebarOpen 
                    ? 'opacity-0 pointer-events-none invisible' 
                    : 'opacity-100'
                } ${
                  isSolid
                    ? 'text-[var(--color-ink-deep)] hover:bg-[#edfbf7] hover:text-[#048c73] active:scale-95'
                    : 'text-white drop-shadow-md hover:bg-white/20 active:scale-95'
                }`}
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.2} />
              </button>
            )}
          </div>

          {/* Logo & Tên nền tảng - Căn giữa tuyệt đối trên màn lớn */}
          <Link to="/" className="flex items-center gap-2 md:gap-2.5 shrink-0 group py-0.5 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
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
                Đi Du Lịch
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

          {/* Cụm bên phải: Nút Đăng nhập/Đăng ký HOẶC Icon người dùng kèm Tên & Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" ref={dropdownRef}>
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Icon hình thông báo ở bên cạnh icon ava */}
                <NotificationBell isSolid={isSolid} />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((v) => !v)}
                    className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-md transition-all cursor-pointer border ${
                      isSolid
                        ? 'bg-white/90 border-gray-200 hover:border-[var(--color-primary)] hover:bg-[#edfbf7]/50 shadow-xs'
                        : 'bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 shadow-xs'
                    }`}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.fullName || user.email}
                      className="w-7 h-7 rounded-md object-cover border border-white/50 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                      {userInitial}
                    </div>
                  )}
                  <span
                    className={`hidden sm:inline text-xs font-bold max-w-[110px] md:max-w-[140px] truncate ${
                      isSolid ? 'text-gray-900' : 'text-white drop-shadow-sm'
                    }`}
                    title={user.fullName || user.email}
                  >
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                  <ChevronDown
                    className={`hidden sm:inline-block w-3.5 h-3.5 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    } ${isSolid ? 'text-gray-500' : 'text-white/90'}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white border border-gray-200/90 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Header tóm tắt tài khoản */}
                    <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center gap-2.5">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.fullName}
                          className="w-9 h-9 rounded-md object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {userInitial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {user.fullName || 'Khách hàng'}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded-sm">
                          {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'PROVIDER' ? 'Đối tác Homestay' : 'Khách du lịch'}
                        </span>
                      </div>
                    </div>

                    {/* Danh sách hành động: List booking & Thông tin cá nhân */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/bookings');
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-[#edfbf7] hover:text-[var(--color-primary)] transition-colors text-left cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                        <span>Chuyến đi & Đơn đặt phòng</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenProfile}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-[#edfbf7] hover:text-[var(--color-primary)] transition-colors text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                        <span>Thông tin cá nhân</span>
                      </button>

                      {user.role !== 'TRAVELER' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate(user.role === 'ADMIN' ? '/admin' : '/partner');
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-[#edfbf7] hover:text-[var(--color-primary)] transition-colors text-left cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-[var(--color-coral)] shrink-0" />
                          <span>Cổng {user.role === 'ADMIN' ? 'Quản trị hệ thống' : 'Nhà cung cấp đối tác'}</span>
                        </button>
                      )}
                    </div>

                    {/* Đăng xuất */}
                    <div className="pt-1 mt-1 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            ) : (
              /* Nút Đăng nhập / Đăng ký trên Header */
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <NotificationBell isSolid={isSolid} />
                <Link
                  to="/login"
                  title="Đăng nhập"
                  className={`inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-bold transition-all shadow-xs ${
                    isSolid
                      ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark,#03705C)]'
                      : 'bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white/30'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">Đăng nhập</span>
                </Link>
                <Link
                  to="/register"
                  title="Đăng ký tài khoản"
                  className={`inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-bold transition-all shadow-xs ${
                    isSolid
                      ? 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[#edfbf7]'
                      : 'border border-white/70 text-white hover:bg-white/20'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Đăng ký</span>
                </Link>
              </div>
            )}
          </div>
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

      {/* Modal: Thông tin cá nhân */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 bg-slate-50/70">
              <div className="flex items-center gap-2 text-ink-deep font-bold text-base">
                <User className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Thông tin cá nhân</span>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#edfbf7]/50 border border-[var(--color-primary)]/20">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-md object-cover border border-white shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-[var(--color-primary)] text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {userInitial}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{user.fullName || 'Chưa cập nhật'}</h4>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Họ và tên</span>
                  <span className="font-semibold text-gray-800">{user.fullName || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Email</span>
                  <span className="font-semibold text-gray-800">{user.email || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Số điện thoại</span>
                  <span className="font-semibold text-gray-800">{user.phone || 'Chưa liên kết'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Vai trò tài khoản</span>
                  <span className="font-semibold text-[var(--color-primary)]">
                    {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'PROVIDER' ? 'Đối tác Homestay' : 'Khách du lịch'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[#03705C] transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

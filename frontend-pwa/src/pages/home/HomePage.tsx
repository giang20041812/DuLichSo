import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import SearchHub from "@/components/layout/SearchHub"
import HeroPwaDownloadBanner from "@/components/pwa/HeroPwaDownloadBanner"
import { MapPin, Star, Handshake, Tag, Headphones, ShieldCheck, Mountain, Tent } from "lucide-react"
import { fetchHomeData } from "@/services/homeService"
import { HomeResponseDto, PlaceSummaryDto } from "@/types/home"
import { getCurrentCustomer, googleLogin, saveTravelerSession } from "@/services/authService"
import { initGoogleOneTap } from "@/lib/firebase"
import FramerSwipeCardStack from "@/components/ui/FramerSwipeCardStack"
import heroBg from "@/assets/1790440239069_4720231300519975082_g6756248586457253608_eaaa778d132481589c48214bdd4f2894.jpg"

const PROVINCE_TAGS = [
  'Tất cả',
  'Mù Cang Chải',
  'La Pán Tẩn',
  'Chế Cu Nha',
  'Tú Lệ',
  'Ngọc Chiến'
];

const getDestinationImage = (dest: PlaceSummaryDto): string => {
  return dest.coverImageUrl || '';
};

const getHomestayImage = (hs: PlaceSummaryDto): string => {
  return hs.coverImageUrl || '';
};



const SakuraBlossomIcon = ({ className = "w-4 h-4 shrink-0" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sakuraPetalGrad" x1="50%" y1="100%" x2="50%" y2="0%">
        <stop offset="0%" stopColor="#fff5f7" />
        <stop offset="40%" stopColor="#fce7f3" />
        <stop offset="80%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <path
        id="sakuraPetalShape"
        d="M 50 50 C 40 38, 24 26, 35 12 C 40 5, 46 8, 50 14 C 54 8, 60 5, 65 12 C 76 26, 60 38, 50 50 Z"
      />
    </defs>

    {/* 5 cánh hoa anh đào thật xếp lớp xoay 72 độ quanh tâm */}
    <g>
      <use href="#sakuraPetalShape" fill="url(#sakuraPetalGrad)" stroke="#f472b6" strokeWidth="0.8" />
      <use href="#sakuraPetalShape" transform="rotate(72 50 50)" fill="url(#sakuraPetalGrad)" stroke="#f472b6" strokeWidth="0.8" />
      <use href="#sakuraPetalShape" transform="rotate(144 50 50)" fill="url(#sakuraPetalGrad)" stroke="#f472b6" strokeWidth="0.8" />
      <use href="#sakuraPetalShape" transform="rotate(216 50 50)" fill="url(#sakuraPetalGrad)" stroke="#f472b6" strokeWidth="0.8" />
      <use href="#sakuraPetalShape" transform="rotate(288 50 50)" fill="url(#sakuraPetalGrad)" stroke="#f472b6" strokeWidth="0.8" />
    </g>

    {/* Quầng nhụy đỏ tía tự nhiên ở tâm hoa */}
    <circle cx="50" cy="50" r="14" fill="#e11d48" opacity="0.35" />
    <circle cx="50" cy="50" r="8" fill="#be123c" opacity="0.65" />
    <circle cx="50" cy="50" r="4.5" fill="#881337" />

    {/* Chùm chỉ nhụy hoa anh đào mảnh mai */}
    <g stroke="#be123c" strokeWidth="1.3" strokeLinecap="round">
      <line x1="50" y1="50" x2="42" y2="34" />
      <line x1="50" y1="50" x2="50" y2="30" />
      <line x1="50" y1="50" x2="58" y2="34" />
      <line x1="50" y1="50" x2="66" y2="42" />
      <line x1="50" y1="50" x2="68" y2="52" />
      <line x1="50" y1="50" x2="63" y2="62" />
      <line x1="50" y1="50" x2="54" y2="68" />
      <line x1="50" y1="50" x2="45" y2="68" />
      <line x1="50" y1="50" x2="36" y2="60" />
      <line x1="50" y1="50" x2="33" y2="49" />
      <line x1="50" y1="50" x2="36" y2="40" />
    </g>

    {/* Bao phấn hoa vàng óng ánh ở đầu sợi nhụy */}
    <g fill="#fbbf24" stroke="#d97706" strokeWidth="0.6">
      <circle cx="42" cy="34" r="2.2" />
      <circle cx="50" cy="30" r="2.2" />
      <circle cx="58" cy="34" r="2.2" />
      <circle cx="66" cy="42" r="2.2" />
      <circle cx="68" cy="52" r="2.2" />
      <circle cx="63" cy="62" r="2.2" />
      <circle cx="54" cy="68" r="2.2" />
      <circle cx="45" cy="68" r="2.2" />
      <circle cx="36" cy="60" r="2.2" />
      <circle cx="33" cy="49" r="2.2" />
      <circle cx="36" cy="40" r="2.2" />
      <circle cx="50" cy="50" r="2.5" fill="#f59e0b" stroke="#b45309" />
    </g>
  </svg>
);

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>('Tất cả');

  useEffect(() => {
    fetchHomeData().then(data => {
      setHomeData(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error in HomePage fetch:', err);
      setLoading(false);
    });
  }, []);

  // Tự động gọi Sign In Google One Tap trên trang chủ khi chưa đăng nhập
  useEffect(() => {
    const customer = getCurrentCustomer();
    if (customer) return; // Đã đăng nhập thì không gọi

    let cleanupFn: (() => void) | undefined;

    const handleGoogleCredential = async (idToken: string) => {
      try {
        const session = await googleLogin(idToken);
        saveTravelerSession(session);
      } catch (err) {
        console.warn('Auto Google login failed:', err);
      }
    };

    initGoogleOneTap(handleGoogleCredential).then((cancel) => {
      cleanupFn = cancel;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, []);

  // Merge API destinations with curated destinations (avoid duplicates by slug or id)
  const allDestinations = useMemo(() => {
    const list: PlaceSummaryDto[] = [];
    const seen = new Set<string>();

    if (homeData?.featuredDestinations) {
      homeData.featuredDestinations.forEach(item => {
        const key = item.slug || String(item.id);
        if (!seen.has(key)) {
          seen.add(key);
          list.push(item);
        }
      });
    }

    return list;
  }, [homeData]);

  // Filter destinations based on selectedProvince: ưu tiên điểm đến thích hợp theo mùa, max 6 items
  const filteredDestinations = useMemo(() => {
    let list = allDestinations;
    if (selectedProvince !== 'Tất cả') {
      list = allDestinations.filter(d => {
        const reg = (d.regionName || '').toLowerCase();
        const prov = selectedProvince.toLowerCase();
        const name = (d.name || '').toLowerCase();
        const desc = (d.description || '').toLowerCase();
        return reg.includes(prov) || name.includes(prov) || desc.includes(prov);
      });
    }
    // Sắp xếp ưu tiên các điểm đến có isSuitableByTime = true
    const sorted = [...list].sort((a, b) => {
      const aVal = a.isSuitableByTime ? 1 : 0;
      const bVal = b.isSuitableByTime ? 1 : 0;
      return bVal - aVal;
    });
    return sorted.slice(0, 6);
  }, [allDestinations, selectedProvince]);

  // Homestays: max 8 items
  const displayedHomestays = useMemo(() => {
    const list = homeData?.homestays ? [...homeData.homestays] : [];
    return list.slice(0, 8);
  }, [homeData]);

  // Đặc sản: max 8 items
  const displayedSpecialties = useMemo(() => {
    const list = homeData?.specialties ? [...homeData.specialties] : [];
    return list.slice(0, 8);
  }, [homeData]);

  if (loading) {
    return (
      <div className="w-full flex flex-col min-h-screen bg-[var(--color-canvas)]">
        {/* Hero Section Skeleton */}
        <section className="relative z-30 w-full min-h-[460px] md:min-h-[500px] flex items-center justify-center pt-[100px] pb-16 bg-[#07362c]/90">
          <div className="relative z-30 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto w-full animate-pulse">
            <div className="h-14 md:h-20 bg-emerald-800/60 rounded-md w-3/4 max-w-xl mb-4" />
            <div className="h-5 bg-emerald-800/40 rounded-sm w-1/2 max-w-md mb-8" />
            <div className="w-full h-32 md:h-36 bg-white/95 rounded-xl border border-white/20 shadow-md p-4" />
          </div>
        </section>

        {/* Content Section Skeleton */}
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-10 space-y-12">
          <div>
            <div className="h-7 bg-gray-200 rounded-sm w-48 mb-6 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs animate-pulse flex flex-col">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded-sm w-3/4 mb-2.5" />
                  <div className="h-3 bg-gray-100 rounded-sm w-1/2 mb-4" />
                  <div className="h-8 bg-gray-200 rounded-md w-full mt-auto" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="h-7 bg-gray-200 rounded-sm w-56 mb-6 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs animate-pulse flex flex-col">
                  <div className="w-full h-40 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded-sm w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded-sm w-1/2 mb-3" />
                  <div className="h-8 bg-gray-200 rounded-md w-full mt-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center text-red-500 font-medium">
        <p>Không thể kết nối đến hệ thống. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative z-30 w-full min-h-[600px] md:min-h-[700px] flex items-center justify-center pt-[100px] pb-16 md:pb-20">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-[#07362c]"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          {/* Overlay gradient nhẹ hơn để ảnh lúa chín hiện rõ */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0f2d3c]/80"></div>
        </div>

        <div className="relative z-30 flex flex-col items-start justify-center px-4 md:px-8 max-w-[1280px] mx-auto w-full mt-6 md:mt-14">
          <div className="max-w-4xl text-left mb-8 md:mb-12">
            <h1 className="italic font-bold text-4xl sm:text-6xl md:text-[90px] lg:text-[115px] text-[var(--color-sun)] leading-[0.95] mb-3 md:mb-4 drop-shadow-lg text-left" style={{ fontFamily: 'var(--font-brush)' }}>
              Đi Du Lịch
            </h1>
            <p className="text-base sm:text-xl md:text-2xl lg:text-[32px] font-bold text-white leading-snug md:leading-relaxed mb-0 drop-shadow-md text-left" style={{ fontFamily: 'var(--font-brush)' }}>
              Nền tảng đặt phòng Homestay & khám phá trải nghiệm du lịch di sản, sinh thái Việt Nam.
            </p>
          </div>

          <div className="w-full flex flex-col items-center">
            {/* Banner Tải App đồng bộ logo web ngay trên SearchHub */}
            <HeroPwaDownloadBanner />

            {/* SearchHub */}
            <div className="w-full max-w-5xl mx-auto">
              <SearchHub />
            </div>
          </div>
        </div>

        {/* Slogan nghệ thuật bẻ cong vút lên dịch hẳn sang mép phải theo sườn đồi ruộng bậc thang - Layer ở dưới SearchHub (z-10) */}
        <div className="absolute bottom-2 right-0 sm:bottom-3 sm:right-1 md:bottom-4 md:right-2 lg:right-4 z-10 select-none pointer-events-auto">
          <svg
            viewBox="0 0 320 190"
            className="w-[210px] sm:w-[260px] md:w-[310px] lg:w-[350px] h-auto overflow-visible select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            aria-label="Mỗi chuyến đi đẹp là một kỷ niệm"
          >
            <defs>
              {/* Đường cong bắt đầu từ dưới rồi cong vút lên cao sang phải theo sườn ruộng bậc thang */}
              <path
                id="curve-travel-slogan-up"
                d="M 12 165 C 115 165, 205 130, 285 22"
                fill="none"
              />
            </defs>
            <text
              fill="#ffffff"
              className="font-bold tracking-wide"
              style={{
                fontFamily: 'var(--font-brush)',
                fontSize: '23px',
              }}
            >
              <textPath href="#curve-travel-slogan-up" startOffset="0%" textAnchor="start">
                Mỗi chuyến đi đẹp là một kỷ niệm
              </textPath>
            </text>
            {/* Calligraphy flourish gạch chân uốn lượn cong vút đồng điệu bên dưới */}
            <path
              d="M 14 175 C 118 175, 208 139, 290 28"
              fill="none"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Trái tim nhỏ xinh ở đỉnh vút cong */}
            <path
              d="M 296 20 C 293 15 285 16 285 22 C 285 28 296 33 296 35 C 296 33 307 28 307 22 C 307 16 299 15 296 20 Z"
              fill="rgba(255, 255, 255, 0.9)"
              transform="scale(0.65) translate(150, -6)"
            />
          </svg>
        </div>
      </section>



      {/* 3. Điểm Đến Thích Hợp Theo Mùa */}
      <section className="bg-[#f8f9fa] py-14">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          {/* Header row: Tiêu đề bên trái, Nút khám phá thêm ở góc phải trên */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold text-[#0f2d3c] tracking-tight">
                Hôm nay đi đâu
              </h2>
            </div>

            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-2 border-teal-600/30 text-[#10b981] hover:text-white hover:bg-[#10b981] hover:border-[#059669] text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
            >
              Khám phá thêm điểm đến <span>&rarr;</span>
            </Link>
          </div>

          {/* Filter theo tỉnh thành đặt xuống dưới tiêu đề */}
          <div className="flex overflow-x-auto scrollbar-hide w-full items-center gap-2 pb-2 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
            {PROVINCE_TAGS.map(prov => (
              <button
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 border-2 cursor-pointer active:scale-95 ${selectedProvince === prov
                  ? 'bg-[#10b981] text-white shadow-xs border-[#059669]'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#10b981] hover:text-[#10b981]'
                  }`}
              >
                {prov}
              </button>
            ))}
          </div>

          {/* Danh sách điểm đến: Max 6 cái, hiển thị 3 cột trên desktop, FramerSwipeCardStack trên mobile */}
          {filteredDestinations.length > 0 ? (
            <FramerSwipeCardStack gridClassName="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {filteredDestinations.map(dest => {
                const formatDate = (dStr?: string) => {
                  if (!dStr) return '';
                  const parts = dStr.split('-');
                  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                  return dStr;
                };

                const isSuitable = Boolean(dest.isSuitableByTime);
                const startFormatted = formatDate(dest.suitableDateStart);
                const endFormatted = formatDate(dest.suitableDateEnd);

                return (
                  <div
                    key={dest.id}
                    className={`bg-white rounded-xl overflow-hidden border-2 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col w-full h-full ${isSuitable ? 'border-teal-500/40 ring-1 ring-teal-500/20' : 'border-slate-100 hover:border-teal-500/30'
                      }`}
                  >
                    <Link to={`/destinations/${dest.id}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
                      <img
                        src={getDestinationImage(dest)}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      {/* Huy hiệu thời gian mùa vụ thích hợp từ dữ liệu */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
                        <div
                          className={`px-2.5 py-1.5 rounded-lg shadow-sm font-bold text-xs flex items-center gap-1.5 backdrop-blur-md border transition-transform group-hover:scale-105 ${isSuitable
                            ? 'bg-gradient-to-r from-[#fef08a] via-[#fde047] to-[#facc15] text-[#713f12] border-[#fde047] shadow-[0_2px_8px_rgba(234,179,8,0.25)]'
                            : 'bg-[#0f2d3c]/95 text-white border-white/20'
                            }`}
                        >
                          {/* Bông hoa anh đào tả thực như hoa thật */}
                          <SakuraBlossomIcon className="w-4 h-4 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
                          <span className={`font-extrabold text-xs sm:text-[13px] tracking-tight ${isSuitable ? 'text-[#713f12]' : 'text-white'}`}>
                            {startFormatted && endFormatted
                              ? `Mùa đẹp: ${startFormatted} – ${endFormatted}`
                              : (endFormatted
                                ? `Mùa đẹp đến: ${endFormatted}`
                                : (isSuitable ? 'Mùa đẹp trong năm' : 'Quanh năm'))}
                          </span>
                        </div>
                        {dest.tagBadge && (
                          <span className="bg-[#10b981] text-white text-xs sm:text-[13px] font-extrabold px-2.5 py-1 rounded-md tracking-tight shadow-xs border border-white/20">
                            {dest.tagBadge}
                          </span>
                        )}
                      </div>

                      {dest.statsText && (
                        <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                          {dest.statsText}
                        </div>
                      )}
                    </Link>

                    <div className="p-4 flex flex-col flex-1">
                      {/* Đánh giá và Địa điểm cho Điểm đến */}
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                          <span className="truncate text-xs sm:text-[13px]">{dest.regionName || "Việt Nam"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-[13px] font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-slate-700">{dest.ratingAvg ? dest.ratingAvg : "—"}</span>
                          {dest.ratingCount != null && dest.ratingCount > 0 && (
                            <span className="text-slate-400 text-xs font-normal">({dest.ratingCount})</span>
                          )}
                        </div>
                      </div>

                      <Link to={`/destinations/${dest.id}`}>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-800 mb-1.5 group-hover:text-[#10b981] transition-colors line-clamp-1">{dest.name}</h3>
                      </Link>

                      <p className="text-slate-600 text-xs sm:text-[13px] font-medium line-clamp-4 mb-3 flex-1 leading-relaxed">
                        {dest.description}
                      </p>



                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
                        <div>
                          <div className="text-[10px] text-slate-400 leading-none mb-1">Từ</div>
                          <div className="text-[#10b981] font-medium text-sm leading-none">
                            {dest.priceRefMin != null && dest.priceRefMin > 0 ? `${dest.priceRefMin.toLocaleString()}đ` : 'Tham khảo'}
                          </div>
                        </div>
                        <Link to={`/destinations/${dest.id}`}>
                          <button className="bg-[#10b981]/8 hover:bg-[#10b981] text-[#10b981] hover:text-white text-xs px-3.5 py-1.5 rounded-lg border-2 border-teal-600/25 hover:border-[#059669] transition-all duration-200 hover:shadow-xs active:scale-95 cursor-pointer">
                            Xem chi tiết
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </FramerSwipeCardStack>
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-[#66716c] bg-white rounded-md border-2 border-dashed border-slate-200">
              <Mountain className="w-10 h-10 text-slate-300 mb-3" />
              <p className="font-medium text-sm text-slate-600">Chưa có dữ liệu điểm đến cho tỉnh {selectedProvince}</p>
              <button
                onClick={() => setSelectedProvince('Tất cả')}
                className="mt-3 text-xs font-semibold text-[#10b981] hover:underline cursor-pointer"
              >
                Xem tất cả điểm đến &rarr;
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Homestay Bản Địa & Chốn Nghỉ Bình Yên */}
      <section className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-14">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold text-slate-800 tracking-tight">
              Homestay & Nhà Nghỉ
            </h2>
          </div>
          <Link
            to="/homestays"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-2 border-teal-600/30 text-[#10b981] hover:text-white hover:bg-[#10b981] hover:border-[#059669] text-xs transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
          >
            Xem tất cả Homestay bản địa <span>&rarr;</span>
          </Link>
        </div>

        {/* Lưới Homestay: Max 8 cái, hiển thị 4 cột mỗi dòng trên desktop, FramerSwipeCardStack trên mobile */}
        {displayedHomestays.length > 0 ? (
          <FramerSwipeCardStack gridClassName="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {displayedHomestays.map((hs) => (
              <div
                key={hs.id}
                className="bg-white rounded-xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-slate-100 hover:border-teal-500/40 flex flex-col group w-full h-full"
              >
                <Link to={`/homestays/${hs.id}`} className="relative aspect-[4/3] bg-slate-100 overflow-hidden block">
                  {getHomestayImage(hs) ? (
                    <img
                      src={getHomestayImage(hs)}
                      alt={hs.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                      <Mountain className="w-8 h-8 opacity-40 mb-1" />
                    </div>
                  )}
                  {hs.tagBadge && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-[#10b981]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-tight flex items-center gap-1 shadow-xs border border-white/20">
                        {hs.tagBadge}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <MapPin className="w-3 h-3 text-[#10b981]" /> {hs.regionName}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-slate-600">{hs.ratingAvg ? hs.ratingAvg : "—"}</span>
                      {hs.ratingCount != null && hs.ratingCount > 0 && (
                        <span className="text-slate-400 text-[10px]">({hs.ratingCount})</span>
                      )}
                    </div>
                  </div>

                  <Link to={`/homestays/${hs.id}`}>
                    <h3 className="font-bold text-slate-800 text-base leading-snug mb-1 group-hover:text-[#10b981] transition-colors line-clamp-1">{hs.name}</h3>
                  </Link>
                  <p className="text-slate-600 text-xs sm:text-[13px] font-medium line-clamp-4 mb-4 flex-1 leading-relaxed">
                    {hs.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div>
                      <div className="text-[10px] text-slate-400 leading-none mb-1">Mỗi đêm</div>
                      {hs.priceRefMin != null && hs.priceRefMin > 0 ? (
                        <div className="text-[#10b981] font-medium text-sm leading-none">
                          {hs.priceRefMin.toLocaleString()}đ<span className="text-[10px] text-slate-400">/đêm</span>
                        </div>
                      ) : (
                        <div className="text-[#10b981] text-sm leading-none">Tham khảo</div>
                      )}
                    </div>
                    <Link to={`/homestays/${hs.id}`}>
                      <button className="bg-[#10b981] hover:bg-[#059669] text-white rounded-lg px-4 py-1.5 text-xs border-2 border-[#059669] transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer">
                        Xem phòng
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </FramerSwipeCardStack>
        ) : (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <Tent className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-medium text-sm">Chưa có homestay bản địa nào</p>
          </div>
        )}
      </section>

      {/* 5. Đặc Sản Nổi Tiếng */}
      <section className="bg-slate-50 py-14 border-t border-slate-200/80">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold text-slate-800 tracking-tight">
                Đặc Sản Nổi Tiếng
              </h2>
            </div>

            <Link
              to="/food"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-2 border-teal-600/30 text-[#10b981] hover:text-white hover:bg-[#10b981] hover:border-[#059669] text-xs transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
            >
              Khám phá thêm thức quà <span>&rarr;</span>
            </Link>
          </div>

          <FramerSwipeCardStack gridClassName="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {displayedSpecialties.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden border-2 border-slate-100 hover:border-teal-500/40 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col w-full h-full"
              >
                <Link to={`/food/${item.id}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                      <Tag className="w-8 h-8 opacity-40 mb-1" />
                    </div>
                  )}
                  {item.tagBadge && (
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-white/20">
                      {item.tagBadge}
                    </span>
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <MapPin className="w-3 h-3 text-[#10b981]" /> {item.regionName}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-slate-600">{item.ratingAvg ? item.ratingAvg : "—"}</span>
                      {item.ratingCount != null && item.ratingCount > 0 && (
                        <span className="text-slate-400 text-[10px]">({item.ratingCount})</span>
                      )}
                    </div>
                  </div>

                  <Link to={`/food/${item.id}`}>
                    <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-[#10b981] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-slate-600 text-xs sm:text-[13px] font-medium line-clamp-4 mb-3 flex-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div>
                      <div className="text-[10px] text-slate-400 leading-none mb-1">Tham khảo</div>
                      <div className="text-[#10b981] font-medium text-sm leading-none">
                        {item.priceRefMin != null && item.priceRefMin > 0
                          ? `${item.priceRefMin.toLocaleString()}đ${item.priceUnitNote ? ` ${item.priceUnitNote}` : ''}`
                          : 'Tham khảo'}
                      </div>
                    </div>
                    <Link to={`/food/${item.id}`}>
                      <button className="bg-[#10b981]/8 hover:bg-[#10b981] text-[#10b981] hover:text-white text-xs px-3.5 py-1.5 rounded-lg border-2 border-teal-600/25 hover:border-[#059669] transition-all duration-200 hover:shadow-xs active:scale-95 cursor-pointer">
                        Chi tiết
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </FramerSwipeCardStack>
        </div>
      </section>

      {/* 6. Cam Kết Giá Trị Từ Đi Du Lịch */}
      <section className="bg-white py-14 border-t border-[#10b981]/10">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a2e26] tracking-tight">
              Cam Kết Giá Trị Từ Đi Du Lịch
            </h2>
          </div>

          {/* LƯỚI CỐ ĐỊNH: 2 DÒNG MỖI DÒNG 2 Ô */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            {/* Value 1: Trải Nghiệm Bản Địa */}
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#f8faf9] rounded-xl border-2 border-slate-200/80 shadow-2xs hover:border-[#10b981]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#10b981] border-2 border-[#059669] flex items-center justify-center mb-3 text-white shadow-xs">
                <Handshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Trải Nghiệm Bản Địa</h3>
            </div>

            {/* Value 2: Giá Niêm Yết Minh Bạch */}
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#f8faf9] rounded-xl border-2 border-slate-200/80 shadow-2xs hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-amber-500 border-2 border-amber-600 flex items-center justify-center mb-3 text-white shadow-xs">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Giá Niêm Yết Minh Bạch</h3>
            </div>

            {/* Value 3: Đồng Hành 24/7 */}
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#f8faf9] rounded-xl border-2 border-slate-200/80 shadow-2xs hover:border-red-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#dc2626] border-2 border-red-700 flex items-center justify-center mb-3 text-white shadow-xs">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Đồng Hành 24/7</h3>
            </div>

            {/* Value 4: Linh Hoạt & Bảo Hiểm */}
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#f8faf9] rounded-xl border-2 border-slate-200/80 shadow-2xs hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-emerald-600 border-2 border-emerald-700 flex items-center justify-center mb-3 text-white shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Linh Hoạt & Bảo Hiểm</h3>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

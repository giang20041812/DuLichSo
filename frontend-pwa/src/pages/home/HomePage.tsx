import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import SearchHub from "@/components/layout/SearchHub"
import HeroPwaDownloadBanner from "@/components/pwa/HeroPwaDownloadBanner"
import { MapPin, Star, Handshake, Tag, Headphones, ShieldCheck, Mountain, Tent, Calendar, Check } from "lucide-react"
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



export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>('Tất cả');
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Đi Du Lịch - Mù Cang Chải',
          text: 'Mỗi chuyến đi là một kỷ niệm đẹp. Cùng khám phá trải nghiệm du lịch di sản, sinh thái Việt Nam!',
          url: window.location.href,
        });
      } catch {
        // Người dùng hủy chia sẻ
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2200);
      } catch (err) {
        console.error('Không thể sao chép liên kết:', err);
      }
    }
  };

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
      <div className="w-full h-screen flex flex-col items-center justify-center gap-3 text-[var(--color-primary)] font-semibold">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-light tracking-wide">Đang tải dữ liệu Đi Du Lịch...</p>
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

        <div className="relative z-30 flex flex-col items-start justify-center px-4 md:px-8 max-w-[1280px] mx-auto w-full mt-10 md:mt-16">
          <div className="max-w-4xl text-left mb-10 md:mb-16">
            <h1 className="italic font-bold text-[70px] md:text-[100px] lg:text-[120px] text-[var(--color-sun)] leading-[0.9] mb-4 drop-shadow-lg" style={{ fontFamily: 'var(--font-brush)' }}>
              Đi Du Lịch
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold md:font-extrabold text-white leading-relaxed mb-0 drop-shadow-md">
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

        {/* Góc truyền cảm hứng nhẹ nhàng & nút chia sẻ */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-10 lg:right-14 z-30 flex items-center gap-3 select-none pointer-events-auto">
          <div className="flex flex-col items-end text-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            <div
              className="text-white text-lg sm:text-xl md:text-2xl lg:text-[26px] leading-tight tracking-wide font-bold"
              style={{ fontFamily: 'var(--font-brush)' }}
            >
              Mỗi chuyến đi
            </div>
            <div
              className="text-white text-lg sm:text-xl md:text-2xl lg:text-[26px] leading-tight tracking-wide font-bold flex items-center justify-end gap-1.5"
              style={{ fontFamily: 'var(--font-brush)' }}
            >
              <span>là một kỷ niệm đẹp</span>
              {/* Trái tim nét vẽ tay nhỏ xinh */}
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-white/90 inline-block -mt-1 rotate-12 transition-transform hover:scale-125"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            {/* Calligraphy underline flourish */}
            <svg
              className="w-28 sm:w-36 md:w-44 h-3.5 text-white/80 mt-0.5 overflow-visible"
              viewBox="0 0 160 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M4 8 Q 40 1 80 7 T 148 6 C 153 6 156 4 154 2 C 152 0.5 147 3 151 8" />
            </svg>
          </div>

          {/* Nút chia sẻ trang */}
          <button
            type="button"
            onClick={handleShare}
            className="w-10 h-10 md:w-11 md:h-11 rounded-[6px] border border-white/40 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)] group cursor-pointer"
            title={copiedShare ? "Đã sao chép liên kết!" : "Chia sẻ hành trình"}
            aria-label="Chia sẻ"
          >
            {copiedShare ? (
              <Check className="w-5 h-5 text-emerald-300 animate-in fade-in zoom-in-75 duration-200" />
            ) : (
              <svg
                className="w-5 h-5 transition-transform group-hover:-translate-y-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </section>



      {/* 3. Điểm Đến Thích Hợp Theo Mùa */}
      <section className="bg-[#f8f9fa] py-14">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          {/* Header row: Tiêu đề bên trái, Nút khám phá thêm ở góc phải trên */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-[34px] font-extrabold text-[#0f2d3c] tracking-tight">
                Điểm Đến Thích Hợp Theo Mùa
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
                          className={`px-2.5 py-1.5 rounded-lg shadow-sm font-bold text-xs flex items-center gap-1.5 backdrop-blur-md border-2 transition-transform group-hover:scale-105 ${isSuitable
                            ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-amber-300/50 shadow-orange-950/20'
                            : 'bg-[#0f2d3c]/95 text-white border-white/20'
                            }`}
                        >
                          <Calendar className={`w-3.5 h-3.5 shrink-0 ${isSuitable ? 'text-amber-200' : 'text-emerald-400'}`} />
                          <span className="font-bold text-white text-xs sm:text-[13px] tracking-tight">
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
              Homestay Bản Địa & Chốn Nghỉ Bình Yên
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

import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import SearchHub from "@/components/layout/SearchHub"
import HeroPwaDownloadBanner from "@/components/pwa/HeroPwaDownloadBanner"
import { MapPin, Star, Handshake, Tag, Headphones, ShieldCheck, Mountain, Tent, Calendar, Sparkles } from "lucide-react"
import { fetchHomeData } from "@/services/homeService"
import { HomeResponseDto, PlaceSummaryDto } from "@/types/home"
import { getCurrentCustomer, googleLogin, saveTravelerSession } from "@/services/authService"
import { initGoogleOneTap } from "@/lib/firebase"
import FramerSwipeCardStack from "@/components/ui/FramerSwipeCardStack"

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
      <section className="relative z-30 w-full min-h-[600px] md:min-h-[660px] flex items-start justify-center pt-[130px] md:pt-[150px] pb-16 md:pb-20">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-[#07362c]"
          style={{
            backgroundImage: `url('${allDestinations[0]?.coverImageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=85&w=2560&auto=format&fit=crop'}')`
          }}
        >
          {/* Overlay gradient sâu lắng, không có vệt trắng đục che khuất ảnh */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/80 via-[#0f2d3c]/45 to-[#0f2d3c]/70"></div>
        </div>

        <div className="relative z-30 flex flex-col items-center text-center px-4 max-w-5xl w-full">
          <h1 className="text-4xl md:text-5xl lg:text-[52px] font-light font-['Outfit'] text-white leading-tight mb-7 tracking-tight flex flex-col items-center drop-shadow-md">
            <span className="font-normal">Khám Phá Việt Nam</span>
            <span className="text-xl md:text-2xl lg:text-3xl font-light text-teal-100/85 mt-2 tracking-wide">
              Từ Những Đỉnh Núi Đến Bờ Biển Xanh
            </span>
          </h1>
          
          {/* Banner Tải App đồng bộ logo web ngay trên SearchHub */}
          <HeroPwaDownloadBanner />

          {/* SearchHub */}
          <div className="w-full max-w-5xl mx-auto">
            <SearchHub />
          </div>
        </div>
      </section>



      {/* 3. Điểm Đến Thích Hợp Theo Mùa */}
      <section className="bg-[#f8f9fa] py-14">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          {/* Header row: Tiêu đề bên trái, Nút khám phá thêm ở góc phải trên */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-[34px] font-normal text-[#0f2d3c] tracking-tight">
                Điểm Đến Thích Hợp Theo Mùa
              </h2>
            </div>
            
            <Link 
              to="/destinations" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-2 border-teal-600/30 text-[#048c73] hover:text-white hover:bg-[#048c73] hover:border-[#025a4a] text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
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
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg font-normal text-xs transition-all duration-200 border-2 cursor-pointer active:scale-95 ${
                  selectedProvince === prov
                    ? 'bg-[#048c73] text-white shadow-xs border-[#025a4a]'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-[#048c73] hover:text-[#048c73]'
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
                    className={`bg-white rounded-xl overflow-hidden border-2 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col w-full h-full ${
                      isSuitable ? 'border-teal-500/40 ring-1 ring-teal-500/20' : 'border-slate-100 hover:border-teal-500/30'
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
                          className={`px-2.5 py-1.5 rounded-lg shadow-sm font-bold text-xs flex items-center gap-1.5 backdrop-blur-md border-2 transition-transform group-hover:scale-105 ${
                            isSuitable 
                              ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-amber-300/50 shadow-orange-950/20' 
                              : 'bg-[#0f2d3c]/95 text-white border-white/20'
                          }`}
                        >
                          <Calendar className={`w-3 h-3 shrink-0 ${isSuitable ? 'text-amber-200' : 'text-emerald-400'}`} />
                          <span className="font-normal text-white text-[11px] sm:text-xs tracking-tight">
                            {startFormatted && endFormatted
                              ? `Mùa đẹp: ${startFormatted} – ${endFormatted}`
                              : (endFormatted 
                                  ? `Mùa đẹp đến: ${endFormatted}` 
                                  : (isSuitable ? 'Mùa đẹp trong năm' : 'Quanh năm'))}
                          </span>
                        </div>
                        {dest.tagBadge && (
                          <span className="bg-[#048c73]/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-tight shadow-xs border border-white/20">
                            {dest.tagBadge}
                          </span>
                        )}
                      </div>

                      {dest.statsText && (
                        <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                          {dest.statsText}
                        </div>
                      )}
                    </Link>
                    
                    <div className="p-4 flex flex-col flex-1">
                      {/* Đánh giá và Địa điểm cho Điểm đến */}
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <div className="flex items-center gap-1 text-slate-400 truncate">
                          <MapPin className="w-3 h-3 text-[#048c73] shrink-0" /> 
                          <span className="truncate text-[11px]">{dest.regionName || "Việt Nam"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs shrink-0">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-slate-600">{dest.ratingAvg ? dest.ratingAvg : "—"}</span>
                          {dest.ratingCount != null && dest.ratingCount > 0 && (
                            <span className="text-slate-400 text-[10px]">({dest.ratingCount})</span>
                          )}
                        </div>
                      </div>

                      <Link to={`/destinations/${dest.id}`}>
                        <h3 className="text-sm font-medium text-slate-800 mb-1.5 group-hover:text-[#048c73] transition-colors line-clamp-1">{dest.name}</h3>
                      </Link>
                      
                      <p className="text-slate-400 text-[11px] line-clamp-2 mb-3 flex-1 leading-relaxed">
                        {dest.description}
                      </p>

                      {/* Thẻ trạng thái mùa vụ */}
                      <div className="mb-3 py-1.5 px-2.5 rounded-md bg-[#f4f7f6] border border-[#e1e9e6] flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-[#048c73]" />
                          {isSuitable ? 'Mùa đẹp' : 'Mùa trải nghiệm'}
                        </span>
                        <span className="font-medium text-[#048c73] text-[11px]">
                          {startFormatted && endFormatted
                            ? `${startFormatted} – ${endFormatted}`
                            : (endFormatted 
                                ? `Đến ${endFormatted}` 
                                : (isSuitable ? 'Mùa đẹp trong năm' : 'Quanh năm'))}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
                        <div>
                          <div className="text-[10px] text-slate-400 leading-none mb-1">Từ</div>
                          <div className="text-[#048c73] font-medium text-sm leading-none">
                            {dest.priceRefMin != null && dest.priceRefMin > 0 ? `${dest.priceRefMin.toLocaleString()}đ` : 'Tham khảo'}
                          </div>
                        </div>
                        <Link to={`/destinations/${dest.id}`}>
                          <button className="bg-[#048C73]/8 hover:bg-[#048C73] text-[#048C73] hover:text-white text-xs px-3.5 py-1.5 rounded-lg border-2 border-teal-600/25 hover:border-[#025a4a] transition-all duration-200 hover:shadow-xs active:scale-95 cursor-pointer">
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
                className="mt-3 text-xs font-semibold text-[#048c73] hover:underline cursor-pointer"
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
            <h2 className="text-2xl md:text-3xl lg:text-[34px] font-normal text-slate-800 tracking-tight">
              Homestay Bản Địa & Chốn Nghỉ Bình Yên
            </h2>
          </div>
          <Link 
            to="/homestays" 
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-2 border-teal-600/30 text-[#048c73] hover:text-white hover:bg-[#048c73] hover:border-[#025a4a] text-xs transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
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
                      <span className="bg-[#048c73]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-tight flex items-center gap-1 shadow-xs border border-white/20">
                        {hs.tagBadge}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <MapPin className="w-3 h-3 text-[#048c73]" /> {hs.regionName}
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
                    <h3 className="font-medium text-slate-800 text-sm leading-snug mb-1 group-hover:text-[#048c73] transition-colors line-clamp-1">{hs.name}</h3>
                  </Link>
                  <p className="text-slate-400 text-[11px] line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {hs.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div>
                      <div className="text-[10px] text-slate-400 leading-none mb-1">Mỗi đêm</div>
                      {hs.priceRefMin != null && hs.priceRefMin > 0 ? (
                        <div className="text-[#048c73] font-medium text-sm leading-none">
                          {hs.priceRefMin.toLocaleString()}đ<span className="text-[10px] text-slate-400">/đêm</span>
                        </div>
                      ) : (
                        <div className="text-[#048c73] text-sm leading-none">Tham khảo</div>
                      )}
                    </div>
                    <Link to={`/homestays/${hs.id}`}>
                      <button className="bg-[#048c73] hover:bg-[#03705c] text-white rounded-lg px-4 py-1.5 text-xs border-2 border-[#025a4a] transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer">
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
              <h2 className="text-2xl md:text-3xl lg:text-[34px] font-normal text-slate-800 tracking-tight">
                Đặc Sản Nổi Tiếng
              </h2>
            </div>
            
            <Link 
              to="/food" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border-2 border-teal-600/30 text-[#048c73] hover:text-white hover:bg-[#048c73] hover:border-[#025a4a] text-xs transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
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
                      <MapPin className="w-3 h-3 text-[#048c73]" /> {item.regionName}
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
                    <h3 className="text-sm font-medium text-slate-800 mb-1 group-hover:text-[#048c73] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-slate-400 text-[11px] line-clamp-2 mb-3 flex-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div>
                      <div className="text-[10px] text-slate-400 leading-none mb-1">Tham khảo</div>
                      <div className="text-[#048c73] font-medium text-sm leading-none">
                        {item.priceRefMin != null && item.priceRefMin > 0 
                          ? `${item.priceRefMin.toLocaleString()}đ${item.priceUnitNote ? ` ${item.priceUnitNote}` : ''}`
                            : 'Tham khảo'}
                      </div>
                    </div>
                    <Link to={`/food/${item.id}`}>
                      <button className="bg-[#048C73]/8 hover:bg-[#048C73] text-[#048C73] hover:text-white text-xs px-3.5 py-1.5 rounded-lg border-2 border-teal-600/25 hover:border-[#025a4a] transition-all duration-200 hover:shadow-xs active:scale-95 cursor-pointer">
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
      <section className="bg-white py-14 border-t border-[#048c73]/10">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-normal text-[#0a2e26] tracking-tight">
              Cam Kết Giá Trị Từ Đi Du Lịch
            </h2>
          </div>
          
          {/* LƯỚI CỐ ĐỊNH: 2 DÒNG MỖI DÒNG 2 Ô */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            {/* Value 1: Trải Nghiệm Bản Địa */}
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#f8faf9] rounded-xl border-2 border-slate-200/80 shadow-2xs hover:border-[#048c73]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#048c73] border-2 border-[#025a4a] flex items-center justify-center mb-3 text-white shadow-xs">
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

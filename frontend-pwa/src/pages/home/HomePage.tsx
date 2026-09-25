import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import SearchHub from "@/components/layout/SearchHub"
import { MapPin, Heart, Star, Handshake, Tag, Headphones, ShieldCheck, Mountain, Tent, Calendar, Sparkles } from "lucide-react"
import { fetchHomeData } from "@/services/homeService"
import { HomeResponseDto, PlaceSummaryDto } from "@/types/home"
import { getCurrentCustomer, googleLogin, saveTravelerSession } from "@/services/authService"
import { initGoogleOneTap } from "@/lib/firebase"





const PROVINCE_TAGS = [
  'Tất cả',
  'Mù Cang Chải',
  'La Pán Tẩn',
  'Chế Cu Nha',
  'Tú Lệ',
  'Ngọc Chiến'
];



const getDestinationImage = (dest: PlaceSummaryDto): string => {
  if (dest.coverImageUrl && dest.coverImageUrl.trim().length > 0) {
    return dest.coverImageUrl;
  }
  const name = dest.name.toLowerCase();
  if (name.includes('thác')) return 'https://images.unsplash.com/photo-1546587348-d12660c30c50?q=80&w=800&auto=format&fit=crop';
  if (name.includes('đèo') || name.includes('sống lưng')) return 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop';
  if (name.includes('thung lũng') || name.includes('chế cu nha')) return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop';
  if (name.includes('trúc') || name.includes('rừng')) return 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=800&auto=format&fit=crop';
  return 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800&auto=format&fit=crop';
};

const SAMPLE_HOMESTAY_IMAGES = [
  'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop'
];

const getHomestayImage = (hs: PlaceSummaryDto, index: number): string => {
  if (hs.coverImageUrl && hs.coverImageUrl.trim().length > 0) {
    return hs.coverImageUrl;
  }
  return SAMPLE_HOMESTAY_IMAGES[index % SAMPLE_HOMESTAY_IMAGES.length] || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=800';
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
        <p>Đang tải dữ liệu Đi Du Lịch...</p>
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
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/85 via-[#0f2d3c]/45 to-transparent"></div>
          {/* Bottom white glow & fade matching other pages */}
          <div className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-gradient-to-t from-[var(--color-canvas)] via-[var(--color-canvas)]/60 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-30 flex flex-col items-center text-center px-4 max-w-5xl w-full">
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold font-display text-white leading-tight mb-5 tracking-tight flex flex-col items-center">
            <span>Khám Phá Việt Nam</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-white/95 mt-2 tracking-normal">
              Từ Những Đỉnh Núi Đến Bờ Biển Xanh
            </span>
          </h1>
          <p className="text-white/90 text-base md:text-lg font-body max-w-2xl mx-auto mb-9">
            Hành trình trải nghiệm văn hóa bản địa, ẩm thực truyền thống và cảnh sắc thiên nhiên nguyên sơ trên khắp dải đất hình chữ S.
          </p>
          
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#edfbf7] text-[#048c73] font-bold text-xs mb-2 border border-[#048c73]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#048c73]" />
                Thời Điểm Vàng Du Lịch Khám Phá
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-[#0f2d3c]">
                Điểm Đến Thích Hợp Theo Mùa
              </h2>
              <p className="text-[#66716c] text-sm md:text-base mt-1.5">
                Tuyển chọn những tọa độ đang trong mùa đẹp nhất, cập nhật thời gian mùa vụ bản địa thực tế
              </p>
            </div>
            
            <Link 
              to="/homestays" 
              className="text-[#048c73] font-bold text-sm hover:text-[#ea580c] transition-colors flex items-center gap-1 shrink-0"
            >
              Khám phá thêm điểm đến <span className="text-base">&rarr;</span>
            </Link>
          </div>

          {/* Filter theo tỉnh thành đặt xuống dưới tiêu đề */}
          <div className="flex overflow-x-auto scrollbar-hide w-full items-center gap-2 pb-2 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
            {PROVINCE_TAGS.map(prov => (
              <button
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  selectedProvince === prov
                    ? 'bg-[#048c73] text-white shadow-sm border border-[#048c73]'
                    : 'bg-white border border-[#59766e]/20 text-[#213630] hover:border-[#048c73] hover:text-[#048c73]'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>

          {/* Danh sách điểm đến: Max 6 cái, hiển thị 3 cột trên desktop (2 dòng x 3 cột) */}
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
            {filteredDestinations.length > 0 ? (
              <>
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
                      className={`bg-white rounded-md overflow-hidden border shadow-2xs hover:shadow-xs transition-all duration-200 group flex flex-col w-[calc(100vw-32px)] shrink-0 snap-center md:w-auto md:max-w-none ${
                        isSuitable ? 'border-[#048c73]/40 ring-1 ring-[#048c73]/20' : 'border-slate-200/90'
                      }`}
                    >
                      <Link to={`/homestays?destination=${encodeURIComponent(dest.name)}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
                        <img 
                          src={getDestinationImage(dest)} 
                          alt={dest.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        {/* Huy hiệu thời gian mùa vụ thích hợp: Đặt góc trái trên cùng, làm nổi bật hẳn lên */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
                          <div 
                            className={`px-2.5 py-1.5 rounded-sm shadow-md font-bold text-xs flex items-center gap-1.5 backdrop-blur-md border transition-transform group-hover:scale-105 ${
                              isSuitable 
                                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-amber-300/50 shadow-orange-950/25 ring-1 ring-white/30' 
                                : 'bg-[#0f2d3c]/95 text-white border-white/20 shadow-black/20'
                            }`}
                          >
                            <Calendar className={`w-3.5 h-3.5 shrink-0 ${isSuitable ? 'text-amber-200' : 'text-emerald-400'}`} />
                            <span className="font-extrabold text-white text-[11px] sm:text-xs tracking-tight">
                              {startFormatted && endFormatted
                                ? `Mùa đẹp: ${startFormatted} – ${endFormatted}`
                                : (endFormatted 
                                    ? `Mùa đẹp đến: ${endFormatted}` 
                                    : (isSuitable ? 'Mùa đẹp nhất năm' : 'Quanh năm'))}
                            </span>
                            {isSuitable && (
                              <span className="bg-amber-400 text-stone-900 text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider ml-0.5 shadow-2xs">
                                VÀNG
                              </span>
                            )}
                          </div>
                          {dest.tagBadge && (
                            <span className="bg-[#048c73]/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-tight shadow-xs border border-white/20">
                              {dest.tagBadge}
                            </span>
                          )}
                        </div>

                        {dest.statsText && (
                          <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 text-white text-[10px] font-medium px-2 py-0.5 rounded-xs">
                            {dest.statsText}
                          </div>
                        )}
                      </Link>
                      
                      <div className="p-4 flex flex-col flex-1">
                        {/* Đánh giá và Địa điểm cho Điểm đến */}
                        <div className="flex justify-between items-center mb-1.5 text-xs">
                          <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#048c73] shrink-0" /> 
                            <span className="truncate">{dest.regionName || "Việt Nam"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs shrink-0">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-slate-800">{dest.ratingAvg || "4.9"}</span>
                            <span className="text-slate-400 text-[10px]">({dest.ratingCount || "128"})</span>
                          </div>
                        </div>

                        <Link to={`/homestays?destination=${encodeURIComponent(dest.name)}`}>
                          <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-[#048c73] transition-colors line-clamp-1">{dest.name}</h3>
                        </Link>
                        
                        <p className="text-slate-500 text-xs line-clamp-2 mb-2.5 flex-1 leading-relaxed">
                          {dest.description}
                        </p>

                        {/* Thẻ trạng thái mùa vụ */}
                        <div className="mb-3 py-1.5 px-2.5 rounded-xs bg-[#f4f7f6] border border-[#e1e9e6] flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#048c73]" />
                            {isSuitable ? 'Đang trong mùa đẹp nhất' : 'Thời gian trải nghiệm'}
                          </span>
                          <span className="font-bold text-[#048c73]">
                            {startFormatted && endFormatted
                              ? `${startFormatted} – ${endFormatted}`
                              : (endFormatted 
                                  ? `Đến ${endFormatted}` 
                                  : (isSuitable ? 'Mùa vàng du lịch' : 'Quanh năm'))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium leading-none mb-1">Giá chỉ từ</div>
                            <div className="text-[#048c73] font-bold text-base leading-none">
                              {dest.priceRefMin != null && dest.priceRefMin > 0 ? `${dest.priceRefMin.toLocaleString()}đ` : 'Tham khảo'}
                            </div>
                          </div>
                          <Link to={`/homestays?destination=${encodeURIComponent(dest.name)}`}>
                            <button className="bg-slate-50 hover:bg-[#048c73] text-slate-700 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-sm transition-colors border border-slate-200">
                              Xem chi tiết
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="shrink-0 w-1 md:hidden" aria-hidden="true" />
              </>
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-[#66716c] bg-white rounded-md border border-dashed border-slate-200">
                <Mountain className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-medium text-sm text-slate-600">Chưa có dữ liệu điểm đến cho tỉnh {selectedProvince}</p>
                <button 
                  onClick={() => setSelectedProvince('Tất cả')}
                  className="mt-3 text-xs font-semibold text-[#048c73] hover:underline"
                >
                  Xem tất cả điểm đến &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Homestay Bản Địa & Chốn Nghỉ Bình Yên */}
      <section className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-14">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-slate-900">
              Homestay Bản Địa & Chốn Nghỉ Bình Yên
            </h2>
            <p className="text-slate-500 text-sm md:text-base mt-1 max-w-2xl">
              Trải nghiệm không gian sống mộc mạc cùng người dân địa phương, tôn trọng tự nhiên và tìm lại sự cân bằng
            </p>
          </div>
          <Link to="/homestays" className="text-[#048c73] font-semibold text-sm hover:underline flex items-center gap-1 shrink-0">
            Xem tất cả Homestay bản địa <span className="text-base">&rarr;</span>
          </Link>
        </div>

        {/* Lưới Homestay: Max 8 cái, hiển thị 4 cột mỗi dòng trên desktop (2 dòng x 4 cột) */}
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
          {displayedHomestays.length > 0 ? (
            <>
              {displayedHomestays.map((hs, idx) => (
                <div 
                  key={hs.id} 
                  className="bg-white rounded-md overflow-hidden shadow-2xs hover:shadow-xs hover:border-[#048c73]/40 transition-all duration-200 border border-slate-200/90 flex flex-col group w-[calc(100vw-32px)] shrink-0 snap-center md:w-auto md:max-w-none"
                >
                  <Link to={`/homestays/${hs.id}`} className="relative aspect-[4/3] bg-slate-100 overflow-hidden block">
                    <img 
                      src={getHomestayImage(hs, idx)} 
                      alt={hs.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    {hs.tagBadge && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-[#048c73] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-tight flex items-center gap-1">
                          {hs.tagBadge}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="w-7 h-7 rounded-sm bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white text-slate-500 hover:text-rose-500 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Link>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-1 text-slate-600 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#048c73]" /> {hs.regionName}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-slate-800">{hs.ratingAvg || "4.8"}</span>
                        <span className="text-slate-400 text-[10px]">({hs.ratingCount || "0"})</span>
                      </div>
                    </div>

                    <Link to={`/homestays/${hs.id}`}>
                      <h3 className="font-bold text-slate-900 text-base leading-snug mb-1 group-hover:text-[#048c73] transition-colors line-clamp-1">{hs.name}</h3>
                    </Link>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-3 flex-1 leading-relaxed">
                      {hs.description}
                    </p>
                    
                    {/* Compact solid tags for amenities */}
                    <div className="flex flex-wrap gap-1 mb-3.5">
                      {hs.amenities?.slice(0, 3).map((amenity, aIdx) => (
                        <span key={aIdx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none mb-1">Giá mỗi đêm</div>
                        {hs.priceRefMin != null && hs.priceRefMin > 0 ? (
                          <div className="text-[#048c73] font-bold text-base leading-none">
                            {hs.priceRefMin.toLocaleString()}đ<span className="text-xs text-slate-400 font-normal">/đêm</span>
                          </div>
                        ) : (
                          <div className="text-[#048c73] font-semibold text-sm leading-none">Tham khảo</div>
                        )}
                      </div>
                      <Link to={`/homestays/${hs.id}`}>
                        <button className="bg-[#048c73] hover:bg-[#03705c] text-white rounded-sm px-3 py-1.5 font-semibold text-xs transition-colors">
                          Xem phòng
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              <div className="shrink-0 w-1 md:hidden" aria-hidden="true" />
            </>
          ) : (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 bg-white rounded-md border border-dashed border-slate-200">
              <Tent className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-medium text-sm">Chưa có homestay bản địa nào</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. MỚI: Đặc Sản Nổi Tiếng */}
      <section className="bg-slate-50 py-14 border-t border-slate-200/80">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-slate-900">
                Đặc Sản Nổi Tiếng
              </h2>
              <p className="text-slate-500 text-sm md:text-base mt-1">
                Thức quà ẩm thực trứ danh và tinh hoa làng nghề truyền thống ba miền đất nước
              </p>
            </div>
            
            <Link to="/food" className="text-[#048c73] font-semibold text-sm hover:underline flex items-center gap-1 shrink-0">
              Khám phá thêm thức quà <span className="text-base">&rarr;</span>
            </Link>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
            {displayedSpecialties.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-md overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-[#048c73]/40 transition-all duration-200 group flex flex-col w-[calc(100vw-32px)] shrink-0 snap-center md:w-auto md:max-w-none"
              >
                <Link to="/food" className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
                  <img 
                    src={item.coverImageUrl || 'https://images.unsplash.com/photo-1542159040-3b03f0b2f059?q=80'} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  {item.tagBadge && (
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-xs">
                      {item.tagBadge}
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-xs">
                    Đặc sản
                  </span>
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <div className="flex items-center gap-1 font-medium text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#048c73]" /> {item.regionName}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-slate-800">{item.ratingAvg}</span>
                      <span className="text-slate-400 text-[10px]">({item.ratingCount})</span>
                    </div>
                  </div>

                  <Link to="/food">
                    <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-[#048c73] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-3 flex-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium leading-none mb-1">Giá tham khảo</div>
                      <div className="text-[#048c73] font-bold text-base leading-none">
                        {item.priceRefMin != null && item.priceRefMin > 0 
                          ? `${item.priceRefMin.toLocaleString()}đ${item.priceUnitNote ? ` ${item.priceUnitNote}` : ''}`
                            : 'Tham khảo'}
                      </div>
                    </div>
                    <Link to="/food">
                      <button className="bg-slate-50 hover:bg-[#048c73] hover:text-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-sm transition-colors border border-slate-200">
                        Chi tiết
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            <div className="shrink-0 w-1 md:hidden" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 6. Cam Kết Giá Trị Từ Đi Du Lịch: 4 ô với 4 sắc thái Eco Tropical Glow sống động */}
      <section className="bg-white py-14 border-t border-[#048c73]/10">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-[#0a2e26]">
              Cam Kết Giá Trị Từ Đi Du Lịch
            </h2>
            <p className="text-[#59766e] text-sm md:text-base mt-1.5">
              Đồng hành trọn vẹn vì một hành trình du lịch bền vững và đáng tin cậy
            </p>
          </div>
          
          {/* LƯỚI CỐ ĐỊNH: 2 DÒNG MỖI DÒNG 2 Ô */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            {/* Value 1: Trải Nghiệm Bản Địa */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-white rounded-md border border-slate-200/90 shadow-2xs hover:border-[#048c73]/40 transition-all">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-sm bg-[#048c73] flex items-center justify-center mb-3 text-white">
                <Handshake className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Trải Nghiệm Bản Địa</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Hợp tác trực tiếp cùng người dân địa phương, đảm bảo tính chân thực và phát triển kinh tế vùng bền vững.
              </p>
            </div>
            
            {/* Value 2: Giá Niêm Yết Minh Bạch */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-white rounded-md border border-slate-200/90 shadow-2xs hover:border-amber-400 transition-all">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-sm bg-amber-500 flex items-center justify-center mb-3 text-white">
                <Tag className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Giá Niêm Yết Minh Bạch</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Không phụ phí ẩn, cam kết đúng giá trị thực cho từng dịch vụ lưu trú và trải nghiệm văn hóa.
              </p>
            </div>

            {/* Value 3: Đồng Hành 24/7 */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-white rounded-md border border-slate-200/90 shadow-2xs hover:border-red-400 transition-all">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-sm bg-[#dc2626] flex items-center justify-center mb-3 text-white">
                <Headphones className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Đồng Hành 24/7</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Đội ngũ hỗ trợ địa phương luôn sẵn sàng giải đáp thắc mắc và hỗ trợ kịp thời xuyên suốt chuyến đi.
              </p>
            </div>

            {/* Value 4: Linh Hoạt & Bảo Hiểm */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-white rounded-md border border-slate-200/90 shadow-2xs hover:border-emerald-400 transition-all">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-sm bg-emerald-600 flex items-center justify-center mb-3 text-white">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Linh Hoạt & Bảo Hiểm</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Chính sách hoàn hủy linh hoạt, tích hợp bảo hiểm du lịch mang đến sự an tâm tuyệt đối cho bạn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

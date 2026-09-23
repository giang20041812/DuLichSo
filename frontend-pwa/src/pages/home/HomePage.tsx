import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import SearchHub from "../components/layout/SearchHub"
import { MapPin, Heart, Star, Check, Handshake, Tag, Headphones, ShieldCheck, Mountain, Tent, Ticket, CheckCircle2, Lock, Sparkles } from "lucide-react"
import { fetchHomeData } from "../services/homeService"
import { HomeResponseDto, PlaceSummaryDto } from "../types/home"





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

  // Filter destinations based on selectedProvince: max 6 items
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
    return list.slice(0, 6);
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
        <p>Đang tải dữ liệu VietJourney...</p>
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
      <section className="relative z-30 w-full min-h-[640px] md:min-h-[720px] flex items-start justify-center pt-[150px] md:pt-[170px] pb-16 md:pb-24">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/85 via-[#0f2d3c]/45 to-transparent"></div>
          {/* Bottom glow */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/30 via-white/10 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-30 flex flex-col items-center text-center px-4 max-w-5xl w-full">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white backdrop-blur-md mb-6 px-4 py-1.5 rounded-md text-xs font-semibold shadow-sm border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#52d967]" />
            <span>Nền tảng du lịch sinh thái & trải nghiệm bản địa hàng đầu</span>
          </div>

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

      {/* 2. Offer / Voucher Section (Màu nền Đỏ Ruby & Cam Hoàng Hôn nổi bật, phông chữ & màu chữ vàng kim độc đáo) */}
      <section className="relative z-10 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8 md:py-10">
        <div className="bg-gradient-to-br from-[#881337] via-[#991b1b] to-[#c2410c] rounded-lg p-6 md:p-8 text-white shadow-[0_15px_35px_rgba(153,27,27,0.35)] border-2 border-[#fde047] ring-4 ring-[#fde047]/20 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Background ambient glowing rays & lights */}
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-[#fbbf24]/25 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-[#f97316]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>

          <div className="flex-1 text-center lg:text-left relative z-10">
            {/* Badge ưu đãi nổi bật */}
            <div className="inline-flex items-center gap-2 bg-[#fef08a] text-[#881337] border-2 border-white/80 px-3.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wider shadow-md mb-3.5">
              <Ticket className="w-4 h-4 text-[#991b1b]" />
              <span>SIÊU ƯU ĐÃI THÀNH VIÊN MỚI</span>
              <Sparkles className="w-3.5 h-3.5 text-[#b45309]" />
            </div>
            
            {/* Tiêu đề kết hợp phông chữ & màu chữ vàng hoàng kim nổi bật */}
            <h2 className="text-2xl md:text-3xl lg:text-[36px] font-black tracking-tight text-white leading-tight">
              GIẢM NGAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fde047] to-[#fb923c] font-black text-3xl md:text-5xl lg:text-6xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">25%</span> CHO CHUYẾN ĐI ĐẦU TIÊN
            </h2>

            {/* Mô tả & Khung mã Coupon */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <p className="text-[#fef2f2] text-sm md:text-base leading-relaxed font-normal">
                Nhập mã ưu đãi độc quyền khi thanh toán:
              </p>
              <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-1 rounded-md border-2 border-dashed border-[#fde047] shadow-inner">
                <span className="text-[#fde047] font-mono font-black text-sm md:text-base tracking-widest">VIETJOURNEY25</span>
              </div>
            </div>

            <p className="text-[#fed7aa] text-xs md:text-sm mt-2 font-medium">
              * Áp dụng ngay cho mọi homestay sinh thái, tour khám phá và ẩm thực bản địa.
            </p>
          </div>

          <div className="w-full lg:w-[440px] shrink-0 relative z-10 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center p-1.5 bg-white rounded-md shadow-2xl gap-2 sm:gap-0 border-2 border-[#fde047]">
              <input 
                type="email" 
                placeholder="Nhập email để nhận mã giảm giá..." 
                className="w-full flex-1 px-4 py-3 outline-none text-[#0f172a] font-semibold text-sm rounded-md placeholder:text-gray-400 bg-transparent"
              />
              <button className="w-full sm:w-auto bg-[#048c73] hover:bg-[#03725e] text-white px-6 py-3 rounded-md font-black text-sm tracking-wide uppercase shadow-md transition-all active:scale-95 whitespace-nowrap">
                LẤY MÃ NGAY
              </button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-4 text-[#fef08a] text-xs font-bold drop-shadow-sm">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#fde047]" /> Áp dụng tự động</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#fde047]"></span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[#fde047]" /> Bảo mật thông tin 100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Destinations (Điểm Đến Tiêu Biểu Theo Mùa) */}
      <section className="bg-[#f8f9fa] py-14">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          {/* Header row: Tiêu đề bên trái, Nút khám phá thêm ở góc phải trên */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-[#0f2d3c]">
                Điểm Đến Tiêu Biểu Theo Mùa
              </h2>
              <p className="text-[#66716c] text-sm md:text-base mt-1.5">
                Danh sách biên tập những vùng đất rực rỡ và giàu bản sắc nhất trong tháng này
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
                {filteredDestinations.map(dest => (
                  <div 
                    key={dest.id} 
                    className="bg-white rounded-lg overflow-hidden border border-[#048c73]/15 shadow-[0_4px_16px_rgba(4,140,115,0.07)] hover:shadow-[0_12px_28px_rgba(4,140,115,0.15)] hover:-translate-y-1 transition-all duration-300 group flex flex-col w-[calc(100vw-32px)] shrink-0 snap-center md:w-auto md:max-w-none"
                  >
                    <Link to={`/homestays?destination=${encodeURIComponent(dest.name)}`} className="relative aspect-[4/3] overflow-hidden bg-gray-100 block">
                      <img 
                        src={getDestinationImage(dest)} 
                        alt={dest.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      {dest.tagBadge && (
                        <span className="absolute top-3 left-3 bg-[#048c73] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md">
                          {dest.tagBadge}
                        </span>
                      )}
                      {dest.statsText && (
                        <div className="absolute bottom-3 right-3 bg-[#0a2e26]/90 backdrop-blur text-[#fef08a] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                          {dest.statsText}
                        </div>
                      )}
                    </Link>
                    
                    <div className="p-4 md:p-5 flex flex-col flex-1">
                      {/* Đánh giá và Địa điểm cho Điểm đến */}
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[#048c73] font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" /> {dest.regionName || "Việt Nam"}
                        </div>
                        <div className="flex items-center gap-1 bg-[#fefce8] px-2 py-0.5 rounded border border-[#f59e0b]/30">
                          <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                          <span className="font-extrabold text-[#78350f]">{dest.ratingAvg || "4.9"}</span>
                          <span className="text-[#a16207] text-[10px]">({dest.ratingCount || "128"})</span>
                        </div>
                      </div>

                      <Link to={`/homestays?destination=${encodeURIComponent(dest.name)}`}>
                        <h3 className="text-lg font-bold text-[#0a2e26] mb-1.5 group-hover:text-[#048c73] transition-colors line-clamp-1">{dest.name}</h3>
                      </Link>
                      <p className="text-[#59766e] text-xs md:text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
                        {dest.description}
                      </p>
                      <div className="flex items-end justify-between pt-3 border-t border-[#048c73]/10 mt-auto">
                        <div>
                          <div className="text-[10px] text-[#59766e] font-medium mb-0.5">Giá tham khảo chỉ từ</div>
                          <div className="text-[#048c73] font-black text-base md:text-lg leading-none">
                            {dest.priceRefMin != null && dest.priceRefMin > 0 ? `${dest.priceRefMin.toLocaleString()}đ` : 'Tham khảo'}
                          </div>
                        </div>
                        <Link to={`/homestays?destination=${encodeURIComponent(dest.name)}`}>
                          <button className="bg-[#edfbf7] hover:bg-[#048c73] text-[#048c73] hover:text-white text-xs font-bold px-3.5 py-1.5 rounded-md transition-all border border-[#048c73]/30 shadow-xs">
                            Xem chi tiết
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="shrink-0 w-1 md:hidden" aria-hidden="true" />
              </>
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-[#66716c] bg-white rounded-lg border border-dashed border-[#66716c]/20">
                <Mountain className="w-10 h-10 text-[#66716c]/30 mb-3" />
                <p className="font-semibold text-sm">Chưa có dữ liệu điểm đến cho tỉnh {selectedProvince}</p>
                <button 
                  onClick={() => setSelectedProvince('Tất cả')}
                  className="mt-3 text-xs font-bold text-[#048c73] hover:underline"
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
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-[#0a2e26]">
              Homestay Bản Địa & Chốn Nghỉ Bình Yên
            </h2>
            <p className="text-[#59766e] text-sm md:text-base mt-1.5 max-w-2xl">
              Trải nghiệm không gian sống mộc mạc cùng người dân địa phương, tôn trọng tự nhiên và tìm lại sự cân bằng
            </p>
          </div>
          <Link to="/homestays" className="text-[#048c73] font-bold text-sm hover:text-[#ea580c] transition-colors flex items-center gap-1 shrink-0">
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
                  className="bg-white rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(4,140,115,0.07)] hover:shadow-[0_12px_28px_rgba(4,140,115,0.15)] hover:-translate-y-1 transition-all duration-300 border border-[#048c73]/15 flex flex-col group w-[calc(100vw-32px)] shrink-0 snap-center md:w-auto md:max-w-none"
                >
                  <Link to={`/homestays/${hs.id}`} className="relative aspect-[4/3] bg-[#f8f9fa] overflow-hidden block">
                    <img 
                      src={getHomestayImage(hs, idx)} 
                      alt={hs.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {hs.tagBadge && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#048c73]/95 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#7ef2dd]" />
                          {hs.tagBadge}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="w-8 h-8 rounded-md bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white text-[#59766e] hover:text-[#e05252] transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </Link>

                  <div className="p-4 md:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1 text-[#048c73] text-[11px] font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" /> {hs.regionName}
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-[#fefce8] px-2 py-0.5 rounded border border-[#f59e0b]/30">
                        <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                        <span className="font-extrabold text-[#78350f]">{hs.ratingAvg || "4.8"}</span>
                        <span className="text-[#a16207] text-[10px]">({hs.ratingCount || "0"})</span>
                      </div>
                    </div>

                    <Link to={`/homestays/${hs.id}`}>
                      <h3 className="font-bold text-[#0a2e26] text-lg leading-snug mb-1.5 group-hover:text-[#048c73] transition-colors line-clamp-1">{hs.name}</h3>
                    </Link>
                    <p className="text-[#59766e] text-xs md:text-sm line-clamp-2 mb-3.5 flex-1 leading-relaxed">
                      {hs.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {hs.amenities?.slice(0, 3).map((amenity, aIdx) => (
                        <span key={aIdx} className="bg-[#edfbf7] text-[#048c73] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-[#048c73]/15">
                          <Check className="w-2.5 h-2.5 text-[#10b981]" />
                          {amenity}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-end justify-between pt-3 border-t border-[#048c73]/10 mt-auto">
                      <div>
                        <div className="text-[10px] text-[#59766e] font-medium mb-0.5">Giá mỗi đêm</div>
                        {hs.priceRefMin != null && hs.priceRefMin > 0 ? (
                          <div className="text-[#048c73] font-black text-lg leading-none">
                            {hs.priceRefMin.toLocaleString()}đ<span className="text-xs text-[#59766e] font-normal"> / phòng</span>
                          </div>
                        ) : (
                          <div className="text-[#048c73] font-bold text-base leading-none">Tham khảo</div>
                        )}
                      </div>
                      {/* Nút CTA Cam San Hô rực rỡ nhiệt đới có link tới Homestay Detail */}
                      <Link to={`/homestays/${hs.id}`}>
                        <button className="bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white rounded-md px-4 py-2 font-black text-xs shadow-sm shadow-orange-500/25 transition-all active:scale-95">
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
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-[#59766e] bg-white rounded-lg border border-dashed border-[#59766e]/20">
              <Tent className="w-10 h-10 text-[#59766e]/30 mb-3" />
              <p className="font-medium">Chưa có homestay bản địa nào</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. MỚI: Đặc Sản Nổi Tiếng */}
      <section className="bg-gradient-to-b from-[#edfbf7]/80 via-[#f6faf8] to-[#edfbf7]/50 py-14 border-t border-[#048c73]/10">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display text-[#0a2e26]">
                Đặc Sản Nổi Tiếng
              </h2>
              <p className="text-[#59766e] text-sm md:text-base mt-1.5">
                Thức quà ẩm thực trứ danh và tinh hoa làng nghề truyền thống ba miền đất nước
              </p>
            </div>
            
            <Link to="/food" className="text-[#048c73] font-bold text-sm hover:text-[#ea580c] transition-colors flex items-center gap-1 shrink-0">
              Khám phá thêm thức quà <span className="text-base">&rarr;</span>
            </Link>
          </div>

          {/* Phần lướt: Tự động căn trái phải vừa khít 1 thẻ thông tin trên responsive, desktop hiển thị lưới cố định */}
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
            {displayedSpecialties.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg overflow-hidden border border-[#048c73]/15 shadow-[0_4px_16px_rgba(4,140,115,0.07)] hover:shadow-[0_12px_28px_rgba(4,140,115,0.15)] hover:-translate-y-1 transition-all duration-300 group flex flex-col w-[calc(100vw-32px)] shrink-0 snap-center md:w-auto md:max-w-none"
              >
                <Link to="/food" className="relative aspect-[4/3] overflow-hidden bg-gray-100 block">
                  <img 
                    src={item.coverImageUrl || 'https://images.unsplash.com/photo-1542159040-3b03f0b2f059?q=80'} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {item.tagBadge && (
                    <span className="absolute top-3 left-3 bg-[#048c73] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md">
                      {item.tagBadge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 bg-[#0a2e26]/90 backdrop-blur text-[#fef08a] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                    {'Đặc sản địa phương'}
                  </span>
                </Link>

                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-[#048c73]">
                      <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" /> {item.regionName}
                    </div>
                    <div className="flex items-center gap-1 bg-[#fefce8] px-2 py-0.5 rounded border border-[#f59e0b]/30">
                      <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                      <span className="font-extrabold text-[#78350f]">{item.ratingAvg}</span>
                      <span className="text-[#a16207] text-[10px]">({item.ratingCount})</span>
                    </div>
                  </div>

                  <Link to="/food">
                    <h3 className="text-lg font-bold text-[#0a2e26] mb-1.5 group-hover:text-[#048c73] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-[#59766e] text-xs md:text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-end justify-between pt-3 border-t border-[#048c73]/10 mt-auto">
                    <div>
                      <div className="text-[10px] text-[#59766e] font-medium mb-0.5">Giá tham khảo</div>
                      <div className="text-[#048c73] font-black text-base md:text-lg leading-none">
                        {item.priceRefMin != null && item.priceRefMin > 0 
                          ? `${item.priceRefMin.toLocaleString()}đ${item.priceUnitNote ? ` ${item.priceUnitNote}` : ''}`
                            : 'Tham khảo'}
                        </div>
                    </div>
                    <Link to="/food">
                      <button className="bg-[#edfbf7] hover:bg-[#048c73] hover:text-white text-[#048c73] text-xs font-bold px-3.5 py-1.5 rounded-md transition-all border border-[#048c73]/30 shadow-xs">
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

      {/* 6. Cam Kết Giá Trị Từ VietJourney: 4 ô với 4 sắc thái Eco Tropical Glow sống động */}
      <section className="bg-white py-14 border-t border-[#048c73]/10">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-[#0a2e26]">
              Cam Kết Giá Trị Từ VietJourney
            </h2>
            <p className="text-[#59766e] text-sm md:text-base mt-1.5">
              Đồng hành trọn vẹn vì một hành trình du lịch bền vững và đáng tin cậy
            </p>
          </div>
          
          {/* LƯỚI CỐ ĐỊNH: 2 DÒNG MỖI DÒNG 2 Ô - 4 SẮC THÁI ECO TROPICAL GLOW */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
            {/* Value 1: Biển Trời Xanh Ngọc (Teal) */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-gradient-to-br from-[#edfbf7] to-white rounded-lg border border-[#048c73]/25 shadow-sm hover:border-[#048c73]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-[#048c73] flex items-center justify-center mb-3.5 text-white shadow-md shadow-teal-700/20">
                <Handshake className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="font-bold text-[#0a2e26] text-sm md:text-base mb-1.5">Trải Nghiệm Bản Địa</h3>
              <p className="text-[#59766e] text-xs md:text-sm leading-relaxed">
                Hợp tác trực tiếp cùng người dân địa phương, đảm bảo tính chân thực và phát triển kinh tế vùng bền vững.
              </p>
            </div>
            
            {/* Value 2: Nắng Vàng Nhiệt Đới (Golden Amber) */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-gradient-to-br from-[#fefce8] to-white rounded-lg border border-[#f59e0b]/30 shadow-sm hover:border-[#f59e0b]/60 hover:shadow-md transition-all">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-[#f59e0b] flex items-center justify-center mb-3.5 text-white shadow-md shadow-amber-600/25">
                <Tag className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="font-bold text-[#78350f] text-sm md:text-base mb-1.5">Giá Niêm Yết Minh Bạch</h3>
              <p className="text-[#78350f]/80 text-xs md:text-sm leading-relaxed">
                Không phụ phí ẩn, cam kết đúng giá trị thực cho từng dịch vụ lưu trú và trải nghiệm văn hóa.
              </p>
            </div>

            {/* Value 3: Cam San Hô Ấm Áp (Tropical Coral) */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-gradient-to-br from-[#fff7ed] to-white rounded-lg border border-[#f97316]/30 shadow-sm hover:border-[#f97316]/60 hover:shadow-md transition-all">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-[#ea580c] flex items-center justify-center mb-3.5 text-white shadow-md shadow-orange-600/25">
                <Headphones className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="font-bold text-[#7c2d12] text-sm md:text-base mb-1.5">Đồng Hành 24/7</h3>
              <p className="text-[#7c2d12]/80 text-xs md:text-sm leading-relaxed">
                Đội ngũ hỗ trợ địa phương luôn sẵn sàng giải đáp thắc mắc và hỗ trợ kịp thời xuyên suốt chuyến đi.
              </p>
            </div>

            {/* Value 4: Rừng Ngọc Bích Sinh Thái (Emerald Green) */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-gradient-to-br from-[#f0fdf4] to-white rounded-lg border border-[#10b981]/30 shadow-sm hover:border-[#10b981]/60 hover:shadow-md transition-all">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-[#10b981] flex items-center justify-center mb-3.5 text-white shadow-md shadow-emerald-600/25">
                <ShieldCheck className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="font-bold text-[#064e3b] text-sm md:text-base mb-1.5">Linh Hoạt & Bảo Hiểm</h3>
              <p className="text-[#064e3b]/80 text-xs md:text-sm leading-relaxed">
                Chính sách hoàn hủy linh hoạt, tích hợp bảo hiểm du lịch mang đến sự an tâm tuyệt đối cho bạn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

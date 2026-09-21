import { useState, useEffect } from "react"
import { Badge } from "../components/ui/badge"
import SearchHub from "../components/layout/SearchHub"
import { MapPin, Heart, Star, Check, Mountain, Sailboat, Landmark, Tent, Utensils, Building2 } from "lucide-react"
import { fetchHomeData } from "../services/homeService"
import { HomeResponseDto, CategoryKind } from "../types/home"

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData().then(data => {
      console.log('Home data fetched:', data);
      setHomeData(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error in HomePage fetch:', err);
      setLoading(false);
    });
  }, []);

  const getCategoryIcon = (kind: CategoryKind) => {
    switch (kind) {
      case 'ATTRACTION': return <Mountain className="w-8 h-8 text-[#d04648]" strokeWidth={1.5} />;
      case 'EXPERIENCE': return <Sailboat className="w-8 h-8 text-[#16709a]" strokeWidth={1.5} />;
      case 'CULTURE': return <Landmark className="w-8 h-8 text-[#c28a33]" strokeWidth={1.5} />;
      case 'HOMESTAY': return <Tent className="w-8 h-8 text-[#2e7d5b]" strokeWidth={1.5} />;
      case 'LOCAL_SPECIALTY': return <Utensils className="w-8 h-8 text-[#d04648]" strokeWidth={1.5} />;
      default: return <Building2 className="w-8 h-8 text-[#5c6bc0]" strokeWidth={1.5} />;
    }
  };

  const getCategoryColorClass = (kind: CategoryKind) => {
    switch (kind) {
      case 'ATTRACTION': return "bg-[#fce5e6]";
      case 'EXPERIENCE': return "bg-[#dceff0]";
      case 'CULTURE': return "bg-[#f8ebd0]";
      case 'HOMESTAY': return "bg-[#daf0e2]";
      case 'LOCAL_SPECIALTY': return "bg-[#fce5e6]";
      default: return "bg-[#e8eaf6]";
    }
  };

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center text-[#16709a] font-bold">Đang tải dữ liệu...</div>;
  }

  if (!homeData) {
    return <div className="w-full h-screen flex items-center justify-center text-red-500 font-bold">Không thể tải dữ liệu. Vui lòng thử lại sau.</div>;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[700px] flex items-center justify-center -mt-[80px]">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/70 via-[#0f2d3c]/40 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl -mt-20">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md mb-6 rounded-full px-4 py-1.5 text-xs font-medium">
            Nền tảng 12 hành trình sinh thái & trải nghiệm bản địa cao cấp hàng đầu
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold font-display text-white leading-tight mb-6 tracking-tight">
            Khám Phá Việt Nam — Từ Những Đỉnh Núi Đến Bờ Biển Xanh
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-body max-w-2xl mx-auto">
            Hành trình trải nghiệm văn hóa bản địa, ẩm thực truyền thống và cảnh sắc thiên nhiên hùng vĩ trên khắp dải đất hình chữ S.
          </p>
        </div>

        {/* SearchHub Overlapping Bottom */}
        <div className="absolute -bottom-16 left-0 right-0 w-full z-20 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <SearchHub />
          </div>
        </div>
      </section>

      {/* Spacer to account for overlapping SearchHub */}
      <div className="h-24 w-full"></div>

      {/* Categories Section */}
      <section className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div className="flex flex-col items-start gap-3">
            <Badge className="bg-[#daf0e2] text-[#2e7d5b] hover:bg-[#c1e6cf] font-medium px-3 py-1 text-xs">
              Phân loại danh mục du lịch
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-[#0f2d3c]">
              Khám Phá Theo Danh Mục Trải Nghiệm
            </h2>
            <p className="text-[#66716c] text-base">
              Lựa chọn phong cách hành trình phù hợp với sở thích và tinh thần khám phá của bạn
            </p>
          </div>
          <a href="#" className="text-[#16709a] font-semibold text-sm hover:underline flex items-center gap-1">
            Tất cả dịch vụ <span className="text-lg leading-none">&rarr;</span>
          </a>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-3 lg:grid-cols-6 -mx-4 px-4 md:mx-0 md:px-0">
          {homeData.categories.map(cat => (
            <div key={cat.id} className="bg-white border border-[#66716c]/10 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer group min-w-[140px] shrink-0 snap-start md:min-w-0">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${getCategoryColorClass(cat.kind)}`}>
                {getCategoryIcon(cat.kind)}
              </div>
              <h3 className="font-bold text-[#0f2d3c] mb-1">{cat.name}</h3>
              <p className="text-xs text-[#66716c]">{cat.description || "Khám phá ngay"}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="bg-[#f8f9fa] py-16">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div className="flex flex-col items-start gap-3">
              <Badge className="bg-[#dceff0] text-[#16709a] hover:bg-[#cbe7e8] font-medium px-3 py-1 text-xs uppercase tracking-wider">
                Hành trình 3 miền đất nước
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold font-display text-[#0f2d3c]">
                Điểm Đến Tiêu Biểu Theo Mùa
              </h2>
              <p className="text-[#66716c] text-base">
                Danh sách biên tập những vùng đất rực rỡ nhất trong tháng này
              </p>
            </div>
            
            <div className="flex overflow-x-auto scrollbar-hide bg-white p-1 rounded-xl border border-[#66716c]/10 shadow-sm w-full md:w-auto">
              <button className="shrink-0 whitespace-nowrap px-4 py-2 bg-[#16709a] text-white rounded-lg text-sm font-semibold shadow-sm">Tất cả (12)</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-2 text-[#66716c] hover:text-[#0f2d3c] rounded-lg text-sm font-medium transition-colors">Bắc Bộ</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-2 text-[#66716c] hover:text-[#0f2d3c] rounded-lg text-sm font-medium transition-colors">Trung Bộ</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-2 text-[#66716c] hover:text-[#0f2d3c] rounded-lg text-sm font-medium transition-colors">Nam Bộ & Đảo</button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
            {homeData.featuredDestinations.length > 0 ? (
              homeData.featuredDestinations.map(dest => (
              <div key={dest.id} className="bg-white rounded-2xl overflow-hidden border border-[#66716c]/10 shadow-sm hover:shadow-md transition-shadow group flex flex-col w-[85vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img src={dest.coverImageUrl || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800"} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {dest.tagBadge && <Badge className="absolute top-3 left-3 bg-[#3f7656] text-white border-none font-semibold shadow-sm">{dest.tagBadge}</Badge>}
                  <div className="absolute bottom-3 right-3 bg-[#0f2d3c]/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">{dest.statsText}</div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-1 text-[#66716c] text-xs font-medium mb-2">
                    <MapPin className="w-3.5 h-3.5" /> {dest.regionName || "Việt Nam"}
                  </div>
                  <h3 className="text-xl font-bold text-[#0f2d3c] mb-2 group-hover:text-[#16709a] transition-colors">{dest.name}</h3>
                  <p className="text-[#66716c] text-sm line-clamp-2 mb-4 flex-1">
                    {dest.description}
                  </p>
                  <div className="flex items-end justify-between pt-4 border-t border-[#66716c]/10 mt-auto">
                    <div>
                      <div className="text-[10px] text-[#66716c] mb-0.5">Giá tham khảo chỉ từ</div>
                      <div className="text-[#16709a] font-bold text-lg leading-none">{dest.priceRefMin?.toLocaleString()}đ</div>
                    </div>
                    <button className="bg-[#f8f9fa] hover:bg-[#e6e8eb] text-[#0f2d3c] text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="col-span-full py-10 flex flex-col items-center justify-center text-[#66716c] bg-white rounded-2xl border border-dashed border-[#66716c]/20">
                <Mountain className="w-10 h-10 text-[#66716c]/30 mb-3" />
                <p>Chưa có dữ liệu điểm đến nổi bật</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Homestay Section */}
      <section className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div className="flex flex-col items-start gap-3">
            <Badge className="bg-[#daf0e2] text-[#2e7d5b] hover:bg-[#c1e6cf] font-medium px-3 py-1 text-xs uppercase tracking-wider">
              Không gian sống xanh & bảo tồn văn hóa
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-[#0f2d3c]">
              Homestay Bản Địa & Chốn Nghỉ Bình Yên
            </h2>
            <p className="text-[#66716c] text-base max-w-2xl">
              Trải nghiệm sống cùng người dân địa phương, tôn trọng tự nhiên và tìm lại sự cân bằng trong tâm hồn
            </p>
          </div>
          <a href="#" className="text-[#16709a] font-semibold text-sm hover:underline flex items-center gap-1">
            Xem tất cả Homestay bản địa <span className="text-lg leading-none">&rarr;</span>
          </a>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 -mx-4 px-4 md:mx-0 md:px-0">
          {homeData.homestays.length > 0 ? (
            homeData.homestays.map(hs => (
            <div key={hs.id} className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#66716c]/10 flex flex-col group w-[85vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none">
              <div className="relative aspect-[4/3] bg-[#f8f9fa] overflow-hidden">
                <img src={hs.coverImageUrl || "https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80"} alt={hs.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                  {hs.tagBadge && (
                    <Badge className="bg-[#2e7d5b]/90 backdrop-blur text-white hover:bg-[#2e7d5b] border-none shadow-sm flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {hs.tagBadge}
                    </Badge>
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  <button className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white text-[#66716c] hover:text-[#d04648] transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 text-[#66716c] text-[11px] font-medium">
                    <MapPin className="w-3.5 h-3.5" /> {hs.regionName}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#66716c]">
                    <Star className="w-3.5 h-3.5 text-[#e5a33d] fill-[#e5a33d]" />
                    <span className="font-bold text-[#0f2d3c]">{hs.ratingAvg || "4.5"}</span> ({hs.ratingCount || "0"})
                  </div>
                </div>
                <h3 className="font-bold text-[#0f2d3c] text-[19px] leading-tight mb-2 group-hover:text-[#16709a] transition-colors">{hs.name}</h3>
                <p className="text-[#66716c] text-[13px] line-clamp-2 mb-4 flex-1">
                  {hs.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-5">
                  {hs.amenities?.map((amenity, idx) => (
                    <span key={idx} className="bg-[#f8f9fa] text-[#66716c] text-[10px] px-2 py-1 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {amenity}
                    </span>
                  ))}
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-[#66716c]/10">
                  <div>
                    <div className="text-[10px] text-[#66716c] mb-0.5">Giá mỗi đêm</div>
                    <div className="text-[#16709a] font-bold text-[19px] leading-none">{hs.priceRefMin?.toLocaleString()}đ<span className="text-xs text-[#66716c] font-normal"> / phòng</span></div>
                  </div>
                  <button className="bg-[#16709a] text-white rounded-lg hover:bg-[#125a7a] px-5 py-2 font-bold text-xs shadow-sm transition-colors">Xem phòng</button>
                </div>
              </div>
            </div>
          ))) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-[#66716c] bg-white rounded-2xl border border-dashed border-[#66716c]/20">
              <Tent className="w-12 h-12 text-[#66716c]/30 mb-4" />
              <p className="font-medium">Chưa có homestay bản địa nào</p>
            </div>
          )}
        </div>
      </section>

      {/* Tours Section */}
      <section className="bg-[#f8f9fa] py-16 border-t border-[#66716c]/10">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div className="flex flex-col items-start gap-3">
              <Badge className="bg-[#f8ebd0] text-[#c28a33] hover:bg-[#f3e1ba] font-medium px-3 py-1 text-xs uppercase tracking-wider">
                Trải nghiệm độc quyền
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold font-display text-[#0f2d3c]">
                Dịch Vụ & Tour Nổi Bật
              </h2>
              <p className="text-[#66716c] text-base">
                Các gói hành trình được thiết kế tỉ mỉ, trọn gói tiện ích và đảm bảo trải nghiệm cao cấp
              </p>
            </div>
            
            <div className="flex overflow-x-auto scrollbar-hide bg-white p-1 rounded-xl border border-[#66716c]/10 shadow-sm w-full md:w-auto">
              <button className="shrink-0 whitespace-nowrap px-4 py-2 bg-[#16709a] text-white rounded-lg text-sm font-semibold shadow-sm">Tour trọn gói</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-2 text-[#66716c] hover:text-[#0f2d3c] rounded-lg text-sm font-medium transition-colors">Bán chạy nhất</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-2 text-[#66716c] hover:text-[#0f2d3c] rounded-lg text-sm font-medium transition-colors">Ưu đãi mùa thu</button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
            {homeData.featuredTours.length > 0 ? (
              homeData.featuredTours.map(tour => (
              <div key={tour.id} className="bg-white rounded-2xl overflow-hidden border border-[#66716c]/10 shadow-sm hover:shadow-md transition-shadow group flex flex-col w-[85vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={tour.coverImageUrl || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80"} alt={tour.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {tour.tagBadge && <Badge className="absolute top-3 left-3 bg-[#d04648] text-white border-none font-semibold shadow-sm">{tour.tagBadge}</Badge>}
                  <div className="absolute bottom-3 right-3 bg-[#0f2d3c]/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">{tour.durationText}</div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1 text-[11px] text-[#66716c]">
                      <Star className="w-3.5 h-3.5 text-[#e5a33d] fill-[#e5a33d]" />
                      <span className="font-bold text-[#0f2d3c]">{tour.ratingAvg || "4.8"}</span> ({tour.ratingCount || "0"})
                    </div>
                    <div className="flex items-center gap-1.5 text-[#66716c] text-[11px] font-medium">
                      {tour.regionName} <MapPin className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-[17px] font-bold text-[#0f2d3c] leading-tight mb-3 group-hover:text-[#16709a] transition-colors">{tour.name}</h3>
                  
                  <div className="flex flex-col gap-1.5 mb-5 text-[12px] text-[#66716c] font-medium flex-1">
                    {tour.highlights?.map((hl, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3f7656]" /> {hl}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-end justify-between pt-4 border-t border-[#66716c]/10 mb-4">
                    <div>
                      {tour.tagBadge === "Khuyến mãi" && <div className="text-[11px] text-[#66716c] line-through decoration-[#d04648]/50 mb-0.5">{(tour.priceRefMin * 1.2).toLocaleString()}đ</div>}
                      <div className="text-[#16709a] font-bold text-xl leading-none">{tour.priceRefMin?.toLocaleString()}đ</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-white border border-[#16709a] text-[#16709a] hover:bg-[#dceff0] rounded-lg px-4 py-2 font-bold text-xs shadow-sm transition-colors text-center">Lịch trình</button>
                    <button className="flex-1 bg-[#16709a] text-white rounded-lg hover:bg-[#125a7a] px-4 py-2 font-bold text-xs shadow-sm transition-colors text-center">Đặt ngay</button>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="col-span-full py-10 flex flex-col items-center justify-center text-[#66716c] bg-white rounded-2xl border border-dashed border-[#66716c]/20">
                <Sailboat className="w-10 h-10 text-[#66716c]/30 mb-3" />
                <p>Chưa có tour trải nghiệm nào</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

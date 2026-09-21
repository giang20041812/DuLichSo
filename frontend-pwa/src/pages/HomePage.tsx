import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { Badge } from "../components/ui/badge"
import SearchHub from "../components/layout/SearchHub"
import { MapPin, Heart, Star, Check, ArrowRight, Handshake, Tag, Headphones, ShieldCheck, Mountain, Sailboat, Landmark, Tent, Utensils, Building2, Ticket, CheckCircle2, Lock, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchHomeData } from "../services/homeService"
import { HomeResponseDto, CategoryKind } from "../types/home"

interface StoryItem {
  id: string;
  region: 'Bắc' | 'Trung' | 'Nam';
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tagColor: string;
}

const REGION_STORIES: StoryItem[] = [
  {
    id: 'bac-1',
    region: 'Bắc',
    category: 'Phóng sự văn hóa',
    title: 'Nghệ Nhân Dệt Thổ Cẩm Vùng Cao Sa Pa — Hồn Cốt Giữa Mây Ngàn',
    excerpt: 'Gặp gỡ nghệ nhân làng dệt thổ cẩm vùng cao Tây Bắc, nơi từng sợi lanh nhuộm chàm thô mộc biến thành bức tranh sống động mang tinh hoa bản địa ngàn năm.',
    author: 'VietJourney Văn Hóa',
    date: '12 Tháng 9, 2026',
    readTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1542159040-3b03f0b2f059?q=80&w=800&auto=format&fit=crop',
    tagColor: 'bg-[#daf0e2] text-[#2e7d5b]'
  },
  {
    id: 'bac-2',
    region: 'Bắc',
    category: 'Ẩm thực truyền thống',
    title: 'Bí Quyết Nước Dùng Trong Veo Của Phở Gia Truyền Hà Nội Cổ',
    excerpt: 'Hành trình lần theo hương hồi quế qua những con ngõ nhỏ phố cổ Hà Nội, khám phá triết lý ẩm thực đằng sau bát phở thanh trong nức tiếng kinh kỳ.',
    author: 'Ẩm Thực 36 Phố',
    date: '10 Tháng 9, 2026',
    readTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1583561917173-0498a44d7072?q=80&w=800&auto=format&fit=crop',
    tagColor: 'bg-[#fce5e6] text-[#d04648]'
  },
  {
    id: 'trung-1',
    region: 'Trung',
    category: 'Di sản & Cung đình',
    title: 'Dấu Ấn Cố Đô Huế — Hương Vị Cung Đình Bên Dòng Sông Hương',
    excerpt: 'Dưới bóng kinh thành rêu phong, lắng nghe nhã nhạc cung đình và tìm hiểu nghệ thuật ẩm thực tinh tế được bảo tồn qua bao thế hệ con người xứ Huế.',
    author: 'Di Sản Miền Trung',
    date: '8 Tháng 9, 2026',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800&auto=format&fit=crop',
    tagColor: 'bg-[#f8ebd0] text-[#c28a33]'
  },
  {
    id: 'trung-2',
    region: 'Trung',
    category: 'Lễ hội & Đêm phố',
    title: 'Đêm Phố Cổ Hội An — Khi Hàng Ngàn Ngọn Đèn Hoa Đăng Tỏa Sáng',
    excerpt: 'Trải nghiệm chèo thuyền trên sông Hoài trong đêm rằm, thả chiếc đèn hoa đăng mang theo ước nguyện bình an giữa không gian lung linh huyền ảo.',
    author: 'Hội An Hoài Niệm',
    date: '6 Tháng 9, 2026',
    readTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
    tagColor: 'bg-[#dceff0] text-[#16709a]'
  },
  {
    id: 'nam-1',
    region: 'Nam',
    category: 'Sông nước bản địa',
    title: 'Nhịp Sống Chợ Nổi Cái Răng — Sắc Màu Sông Nước Nam Bộ Lúc Bình Minh',
    excerpt: 'Tiếng ghe máy rộn rã, những cây bẹo treo lủng lẳng hoa trái đầu cành mở ra bức tranh đời sống thương hồ phóng khoáng đặc trưng của miền Tây sông nước.',
    author: 'Ký Sự Phương Nam',
    date: '4 Tháng 9, 2026',
    readTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1610450949065-2e22528e08d6?q=80&w=800&auto=format&fit=crop',
    tagColor: 'bg-[#daf0e2] text-[#2e7d5b]'
  },
  {
    id: 'nam-2',
    region: 'Nam',
    category: 'Lifestyle & Ký ức',
    title: 'Văn Hóa Cà Phê Vợt Sài Gòn — Nhịp Sống Chậm Giữa Đô Hội Hối Hả',
    excerpt: 'Bên chiếc siêu đất đun củi và chiếc vợt vải ngả màu thời gian, thưởng thức ly cà phê sữa đá đậm đà lưu giữ ký ức cả thế kỷ của người Sài Gòn.',
    author: 'Sài Gòn Góc Phố',
    date: '2 Tháng 9, 2026',
    readTime: '3 phút đọc',
    image: 'https://images.unsplash.com/photo-1629828450148-52fb58fce4be?q=80&w=800&auto=format&fit=crop',
    tagColor: 'bg-[#fce5e6] text-[#d04648]'
  }
];

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState<'Tất cả' | 'Bắc' | 'Trung' | 'Nam'>('Tất cả');
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

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

  const filteredStories = selectedRegion === 'Tất cả' 
    ? REGION_STORIES 
    : REGION_STORIES.filter(s => s.region === selectedRegion);

  // Tính năng 1: Tự động cuộn ngang (Auto-scroll) theo chu kỳ, dừng khi hover hoặc kéo
  useEffect(() => {
    if (isHovered || isDragging) return;
    
    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      
      // Nếu đã cuộn gần hết, quay lại đầu
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 360, behavior: 'smooth' });
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isHovered, isDragging]);

  // Tính năng 2: Người sử dụng tự kéo chuột sang (Mouse Drag to scroll)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
  };

  const scrollPrev = () => {
    scrollRef.current?.scrollBy({ left: -360, behavior: 'smooth' });
  };

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 360, behavior: 'smooth' });
  };

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
      <section className="relative w-full h-[800px] flex items-start justify-center pt-[180px] md:pt-[200px]">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/80 via-[#0f2d3c]/40 to-transparent"></div>
          {/* Bottom white glow - Giảm độ trắng xuống, làm phần giao trong hơn */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/30 via-white/10 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl w-full">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md mb-6 rounded-full px-4 py-1.5 text-xs font-medium">
            Nền tảng 12 hành trình sinh thái & trải nghiệm bản địa cao cấp hàng đầu
          </Badge>
          {/* Tiêu đề chia thành 2 dòng, bỏ dấu gạch ngang */}
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold font-display text-white leading-tight mb-6 tracking-tight flex flex-col items-center">
            <span>Khám Phá Việt Nam</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-medium text-white/95 mt-2 tracking-normal">
              Từ Những Đỉnh Núi Đến Bờ Biển Xanh
            </span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-body max-w-2xl mx-auto mb-10">
            Hành trình trải nghiệm văn hóa bản địa, ẩm thực truyền thống và cảnh sắc thiên nhiên hùng vĩ trên khắp dải đất hình chữ S.
          </p>
          
          {/* SearchHub Inside Image */}
          <div className="w-full max-w-5xl mx-auto">
            <SearchHub />
          </div>
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
            
            <div className="flex overflow-x-auto scrollbar-hide w-full md:w-auto items-center gap-2 pb-2 md:pb-0">
              <button className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full border-2 border-[#16709a] text-[#16709a] font-bold text-sm bg-[#ebf6fa] hover:bg-[#dceff0] transition-colors shadow-sm">Tất cả (12)</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#4a5568] hover:border-[#16709a] hover:text-[#16709a] font-medium text-sm transition-colors shadow-sm bg-white">Bắc Bộ</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#4a5568] hover:border-[#16709a] hover:text-[#16709a] font-medium text-sm transition-colors shadow-sm bg-white">Trung Bộ</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#4a5568] hover:border-[#16709a] hover:text-[#16709a] font-medium text-sm transition-colors shadow-sm bg-white">Nam Bộ & Đảo</button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
            {homeData.featuredDestinations.length > 0 ? (
              homeData.featuredDestinations.map(dest => (
              <div key={dest.id} className="bg-white rounded-2xl overflow-hidden border border-[#66716c]/10 shadow-sm hover:shadow-md transition-shadow group flex flex-col w-[85vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none">
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
            <div key={hs.id} className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#66716c]/10 flex flex-col group w-[85vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none">
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
                  <Link 
                    to={`/homestay/${hs.slug || 'ban-lim-mong-eco-lodge'}`}
                    className="bg-[#16709a] text-white rounded-lg hover:bg-[#125a7a] px-5 py-2 font-bold text-xs shadow-sm transition-colors inline-block text-center"
                  >
                    Xem phòng
                  </Link>
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
            
            <div className="flex overflow-x-auto scrollbar-hide w-full md:w-auto items-center gap-2 pb-2 md:pb-0">
              <button className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full border-2 border-[#16709a] text-[#16709a] font-bold text-sm bg-[#ebf6fa] hover:bg-[#dceff0] transition-colors shadow-sm">Tour trọn gói</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#4a5568] hover:border-[#16709a] hover:text-[#16709a] font-medium text-sm transition-colors shadow-sm bg-white">Bán chạy nhất</button>
              <button className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#4a5568] hover:border-[#16709a] hover:text-[#16709a] font-medium text-sm transition-colors shadow-sm bg-white">Ưu đãi mùa thu</button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
            {homeData.featuredTours.length > 0 ? (
              homeData.featuredTours.map(tour => (
              <div key={tour.id} className="bg-white rounded-2xl overflow-hidden border border-[#66716c]/10 shadow-sm hover:shadow-md transition-shadow group flex flex-col w-[85vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none">
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
      {/* Culture & Heritage Section - Tổng hợp câu chuyện của 3 miền, tự động cuộn ngang và kéo chuột */}
      <section className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div className="flex flex-col items-start gap-3">
            <Badge className="bg-[#fce5e6] text-[#d04648] hover:bg-[#f6cdcf] font-medium px-3 py-1 text-xs uppercase tracking-wider">
              Chuyện người bản địa
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-[#0f2d3c]">
              Hương Vị & Văn Hóa Xứ Sở — Câu Chuyện 3 Miền
            </h2>
            <p className="text-[#66716c] text-base">
              Lắng nghe những lát cắt mộc mạc và câu chuyện truyền cảm hứng từ Bắc, Trung đến Nam
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Bộ lọc vùng miền */}
            <div className="flex overflow-x-auto scrollbar-hide w-full md:w-auto items-center gap-2 pb-2 md:pb-0">
              {(['Tất cả', 'Bắc', 'Trung', 'Nam'] as const).map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full font-medium text-sm transition-colors shadow-sm ${
                    selectedRegion === region
                      ? 'border-2 border-[#16709a] text-[#16709a] font-bold bg-[#ebf6fa] hover:bg-[#dceff0]'
                      : 'border border-[#66716c]/30 text-[#4a5568] hover:border-[#16709a] hover:text-[#16709a] bg-white'
                  }`}
                >
                  {region === 'Tất cả' ? 'Tất cả 3 Miền' : `Miền ${region}`}
                </button>
              ))}
            </div>

            {/* Nút cuộn thủ công */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={scrollPrev}
                aria-label="Cuộn sang trái"
                className="w-9 h-9 rounded-full bg-white border border-[#66716c]/20 hover:border-[#16709a] text-[#0f2d3c] hover:text-[#16709a] flex items-center justify-center shadow-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollNext}
                aria-label="Cuộn sang phải"
                className="w-9 h-9 rounded-full bg-white border border-[#66716c]/20 hover:border-[#16709a] text-[#0f2d3c] hover:text-[#16709a] flex items-center justify-center shadow-sm transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container: Hỗ trợ tự động cuộn ngang + Người dùng tự bấm giữ kéo chuột / vuốt tay */}
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setIsHovered(true)}
          className={`flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 px-4 -mx-4 md:mx-0 md:px-0 select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="w-[85vw] max-w-[320px] md:max-w-none shrink-0 snap-center md:w-[380px] bg-white rounded-2xl overflow-hidden border border-[#66716c]/10 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#e8eaf6]">
                <img
                  src={story.image}
                  alt={story.title}
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge className={`${story.tagColor} border-none font-bold text-xs shadow-sm px-2.5 py-0.5`}>
                    Miền {story.region}
                  </Badge>
                  <span className="bg-[#0f2d3c]/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    {story.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#66716c] font-medium mb-3">
                    <span className="text-[#16709a] font-bold">{story.author}</span>
                    <span className="w-1 h-1 rounded-full bg-[#66716c]/30"></span>
                    <span>{story.date}</span>
                    <span className="w-1 h-1 rounded-full bg-[#66716c]/30"></span>
                    <span>{story.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0f2d3c] leading-snug mb-3 group-hover:text-[#16709a] transition-colors line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-[#66716c] text-sm leading-relaxed line-clamp-3 mb-4">
                    {story.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#66716c]/10 mt-auto">
                  <span className="text-xs font-semibold text-[#16709a] group-hover:underline flex items-center gap-1">
                    Đọc câu chuyện <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[11px] text-[#66716c]/80 italic">Kéo để xem tiếp &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Thanh trạng thái tương tác */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-xs text-[#66716c] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2e7d5b] animate-pulse"></span>
            Tự động cuộn &bull; Bấm giữ kéo hoặc vuốt tay sang 3 miền
          </span>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-[#f8f9fa] py-16 border-t border-[#66716c]/10">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-[#0f2d3c]">Cam Kết Giá Trị Từ VietJourney</h2>
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8 -mx-4 px-4 md:mx-0 md:px-0">
            {/* Value 1 */}
            <div className="flex flex-col items-center text-center w-[75vw] max-w-[280px] shrink-0 snap-center md:w-auto md:max-w-none">
              <div className="w-16 h-16 rounded-full bg-[#dceff0] flex items-center justify-center mb-6">
                <Handshake className="w-8 h-8 text-[#16709a]" />
              </div>
              <h3 className="font-bold text-[#0f2d3c] text-lg mb-3">Trải Nghiệm Bản Địa</h3>
              <p className="text-[#66716c] text-sm">Hợp tác trực tiếp cùng người dân địa phương, đảm bảo tính chân thực và phát triển kinh tế vùng.</p>
            </div>
            
            {/* Value 2 */}
            <div className="flex flex-col items-center text-center w-[75vw] max-w-[280px] shrink-0 snap-center md:w-auto md:max-w-none">
              <div className="w-16 h-16 rounded-full bg-[#f8ebd0] flex items-center justify-center mb-6">
                <Tag className="w-8 h-8 text-[#c28a33]" />
              </div>
              <h3 className="font-bold text-[#0f2d3c] text-lg mb-3">Giá Niêm Yết Minh Bạch</h3>
              <p className="text-[#66716c] text-sm">Không phí ẩn, cam kết đúng giá trị thực cho từng dịch vụ và trải nghiệm.</p>
            </div>

            {/* Value 3 */}
            <div className="flex flex-col items-center text-center w-[75vw] max-w-[280px] shrink-0 snap-center md:w-auto md:max-w-none">
              <div className="w-16 h-16 rounded-full bg-[#fce5e6] flex items-center justify-center mb-6">
                <Headphones className="w-8 h-8 text-[#d04648]" />
              </div>
              <h3 className="font-bold text-[#0f2d3c] text-lg mb-3">Đồng Hành 24/7</h3>
              <p className="text-[#66716c] text-sm">Đội ngũ hỗ trợ địa phương luôn sẵn sàng giải quyết mọi vấn đề phát sinh xuyên suốt hành trình.</p>
            </div>

            {/* Value 4 */}
            <div className="flex flex-col items-center text-center w-[75vw] max-w-[280px] shrink-0 snap-center md:w-auto md:max-w-none">
              <div className="w-16 h-16 rounded-full bg-[#daf0e2] flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-[#2e7d5b]" />
              </div>
              <h3 className="font-bold text-[#0f2d3c] text-lg mb-3">Linh Hoạt & Bảo Hiểm</h3>
              <p className="text-[#66716c] text-sm">Chính sách hoàn hủy linh hoạt, tặng kèm bảo hiểm du lịch 100% cho mọi chuyến đi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8">
          <div className="bg-gradient-to-br from-[#0d617e] to-[#264734] rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            
            <div className="flex-1 relative z-10 text-center md:text-left max-w-xl">
              <Badge className="bg-white/10 hover:bg-white/20 text-white/90 border-none rounded-full px-3 py-1 text-xs font-medium mb-4 flex items-center gap-1.5 w-fit mx-auto md:mx-0">
                <Ticket className="w-3.5 h-3.5" /> Mã ưu đãi độc quyền thành viên
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4 leading-tight">
                Nhận Ngay Voucher Giảm 25%<br className="hidden md:block" /> Cho Chuyến Đi Đầu Tiên
              </h2>
              <p className="text-white/80 text-sm md:text-base leading-relaxed">
                Đăng ký nhận bản tin định kỳ để không bỏ lỡ các ưu đãi mùa lúa, mùa hoa tam giác mạch và cẩm nang hành trình bản địa tuyển chọn.
              </p>
            </div>
            
            <div className="w-full md:w-[440px] shrink-0 relative z-10 flex flex-col">
              <div className="flex flex-col sm:flex-row items-center p-1.5 bg-white rounded-2xl sm:rounded-full shadow-xl mb-3 gap-2 sm:gap-0 border border-white/30 transition-all focus-within:ring-2 focus-within:ring-[#e5a33d]">
                <input 
                  type="email" 
                  placeholder="Nhập email của bạn..." 
                  className="w-full flex-1 min-w-0 px-4 sm:px-5 py-3 outline-none text-[#0f2d3c] text-sm rounded-xl sm:rounded-full placeholder:text-[#66716c] bg-transparent"
                />
                <button className="w-full sm:w-auto bg-[#9e6d23] hover:bg-[#7a5316] text-white px-6 py-3 rounded-xl sm:rounded-full font-bold text-sm shadow-md transition-all whitespace-nowrap shrink-0 flex items-center justify-center">
                  Nhận Mã Giảm
                </button>
              </div>
              
              <div className="flex flex-col gap-2 text-left">
                <p className="text-white/70 text-[11px]">
                  * Ưu đãi áp dụng tự động cho đơn tour hoặc phòng homestay đầu tiên.
                </p>
                <div className="flex items-center gap-3 text-white/70 text-[11px]">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Cam kết không spam</span>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Bảo mật dữ liệu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchHomestays, HomestayFilterParams } from '@/services/homestayService';
import { HomestayDto } from '@/types/homestay';
import SearchHub from '@/components/layout/SearchHub';
import { PriceSlider } from '@/components/ui/price-slider';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Heart, 
  Check, 
  SlidersHorizontal, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowUpDown, 
  RotateCcw, 
  Map, 
  Sparkles, 
  Wind, 
  Mountain, 
  Bath, 
  Utensils, 
  Flame,
  Phone
} from 'lucide-react';
import OpenStreetMapView from '@/components/map/OpenStreetMapView';

function FacebookIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.48 6.34 6.34 0 0 0 1.86-4.48V8.71a8.16 8.16 0 0 0 4.71 1.48V6.74a4.85 4.85 0 0 1-.8-.05z" />
    </svg>
  );
}

export interface AmenityItem {
  code: string;
  name: string;
  scope: 'ROOM' | 'PLACE';
  tag?: string;
}

// Tiện nghi cấp phòng (Room Scope)
const ROOM_AMENITIES: AmenityItem[] = [
  { code: 'AIR_CONDITIONING', name: 'Điều hòa không khí', scope: 'ROOM', tag: 'Phòng' },
  { code: 'BALCONY', name: 'Ban công view núi / ruộng', scope: 'ROOM', tag: 'Phòng' },
  { code: 'BATHTUB', name: 'Bồn tắm ngâm thảo dược', scope: 'ROOM', tag: 'Phòng' },
];

// Tiện nghi cấp homestay / cơ sở (Place Scope)
const PLACE_AMENITIES: AmenityItem[] = [
  { code: 'WIFI', name: 'Wifi tốc độ cao', scope: 'PLACE' },
  { code: 'HOT_WATER', name: 'Nước nóng tắm', scope: 'PLACE' },
  { code: 'HEATER', name: 'Sưởi / điều hòa ấm', scope: 'PLACE' },
  { code: 'PARKING', name: 'Bãi đỗ xe ô tô', scope: 'PLACE' },
  { code: 'RESTAURANT', name: 'Nhà hàng tại chỗ', scope: 'PLACE' },
  { code: 'KITCHEN', name: 'Bếp nấu tự do', scope: 'PLACE' },
  { code: 'BBQ_AREA', name: 'Sân nướng BBQ ngoài trời', scope: 'PLACE' },
  { code: 'MOTORBIKE_RENTAL', name: 'Cho thuê xe máy', scope: 'PLACE' },
  { code: 'FIREPLACE', name: 'Lò sưởi củi sinh hoạt chung', scope: 'PLACE' },
  { code: 'BACKUP_POWER', name: 'Điện dự phòng', scope: 'PLACE' },
  { code: 'STABLE_WATER', name: 'Nước ổn định vùng cao', scope: 'PLACE' },
];

const ALL_AMENITIES = [...ROOM_AMENITIES, ...PLACE_AMENITIES];

export default function HomestayListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [homestays, setHomestays] = useState<HomestayDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'>('recommended');
  
  // Khởi tạo filters từ URL params
  const [filters, setFilters] = useState<HomestayFilterParams>(() => {
    const initialFilters: HomestayFilterParams = {};
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const amenitiesStr = searchParams.get('amenities');
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const ward = searchParams.get('ward');
    const attractionsStr = searchParams.get('attractions');
    
    if (checkIn) initialFilters.checkIn = checkIn;
    if (checkOut) initialFilters.checkOut = checkOut;
    if (minPrice) initialFilters.minPrice = Number(minPrice);
    if (maxPrice) initialFilters.maxPrice = Number(maxPrice);
    if (minRating) initialFilters.minRating = Number(minRating);
    if (amenitiesStr) initialFilters.amenities = amenitiesStr.split(',');
    if (province) initialFilters.province = province;
    if (district) initialFilters.district = district;
    if (ward) initialFilters.ward = ward;
    if (attractionsStr) initialFilters.attractions = attractionsStr.split(',');
    
    return initialFilters;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // 6 homestay per page = 3 rows in 2-column grid
  const ITEMS_PER_PAGE = 6;

  const getHomestayPhone = (hs: HomestayDto) => {
    const c = hs.contacts?.find(item => item.channel === 'PHONE');
    if (c && c.value) return c.value;
    const seed = Math.abs(hs.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const num = (seed * 91823) % 9000000 + 1000000;
    return `098${num}`;
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const getHomestayFacebook = (hs: HomestayDto) => {
    const c = hs.contacts?.find(item => item.channel === 'FACEBOOK');
    if (c && c.value) return c.value;
    return `https://www.facebook.com/search/top?q=${encodeURIComponent(hs.name)}`;
  };

  const getHomestayTikTok = (hs: HomestayDto) => {
    const c = hs.contacts?.find(item => item.channel === 'TIKTOK');
    if (c && c.value) return c.value;
    return `https://www.tiktok.com/search?q=${encodeURIComponent(hs.name)}`;
  };

  const handleFilterChange = (updates: Partial<HomestayFilterParams>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      // Đồng bộ URL params
      const newParams = new URLSearchParams(searchParams);
      if (newFilters.checkIn) newParams.set('checkIn', newFilters.checkIn); else newParams.delete('checkIn');
      if (newFilters.checkOut) newParams.set('checkOut', newFilters.checkOut); else newParams.delete('checkOut');
      if (newFilters.minPrice !== undefined) newParams.set('minPrice', newFilters.minPrice.toString()); else newParams.delete('minPrice');
      if (newFilters.maxPrice !== undefined) newParams.set('maxPrice', newFilters.maxPrice.toString()); else newParams.delete('maxPrice');
      if (newFilters.minRating !== undefined) newParams.set('minRating', newFilters.minRating.toString()); else newParams.delete('minRating');
      if (newFilters.amenities && newFilters.amenities.length > 0) newParams.set('amenities', newFilters.amenities.join(',')); else newParams.delete('amenities');
      if (newFilters.province) newParams.set('province', newFilters.province); else newParams.delete('province');
      if (newFilters.district) newParams.set('district', newFilters.district); else newParams.delete('district');
      if (newFilters.ward) newParams.set('ward', newFilters.ward); else newParams.delete('ward');
      if (newFilters.attractions && newFilters.attractions.length > 0) newParams.set('attractions', newFilters.attractions.join(',')); else newParams.delete('attractions');
      
      setSearchParams(newParams, { replace: true });
      return newFilters;
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchParams(new URLSearchParams(), { replace: true });
    setCurrentPage(1);
  };

  // Đồng bộ lại filters nếu URL thay đổi (nhấn back/forward hoặc từ SearchHub)
  useEffect(() => {
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const amenitiesStr = searchParams.get('amenities');
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const ward = searchParams.get('ward');
    const attractionsStr = searchParams.get('attractions');
    
    setFilters({
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      amenities: amenitiesStr ? amenitiesStr.split(',') : undefined,
      province: province || undefined,
      district: district || undefined,
      ward: ward || undefined,
      attractions: attractionsStr ? attractionsStr.split(',') : undefined,
    });
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchHomestays(filters).then(data => {
      setHomestays(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filters]);

  const hasActiveFilters = Boolean(
    filters.amenities?.length || filters.minRating || filters.maxPrice || filters.minPrice || filters.ward || (filters.province && filters.province !== 'Yên Bái') || filters.attractions?.length
  );

  // Sắp xếp danh sách
  const sortedHomestays = [...homestays].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating_desc') return (b.ratingScore || 0) - (a.ratingScore || 0);
    return 0;
  });

  const paginatedHomestays = sortedHomestays.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedHomestays.length / ITEMS_PER_PAGE);

  const roomAmenitiesSelectedCount = filters.amenities?.filter(code => 
    ROOM_AMENITIES.some(ra => ra.code === code)
  ).length || 0;

  const placeAmenitiesSelectedCount = filters.amenities?.filter(code => 
    PLACE_AMENITIES.some(pa => pa.code === code)
  ).length || 0;

  const renderFilters = () => (
    <div className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-xs">
      <div className="p-4 border-b border-gray-200/90 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="font-bold text-[var(--color-ink-deep)] text-base">Bộ lọc chỗ nghỉ</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-coral)] hover:underline flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Đặt lại
          </button>
        )}
      </div>
      
      {/* 1. Tiện nghi phòng ngủ (Room Scope) */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Tiện nghi phòng
          </span>
          {roomAmenitiesSelectedCount > 0 && (
            <span className="text-[10px] bg-[var(--color-primary-50)] text-[var(--color-primary)] px-2 py-0.5 rounded-md font-bold">
              {roomAmenitiesSelectedCount} đã chọn
            </span>
          )}
        </h4>
        <div className="flex flex-col gap-2.5">
          {ROOM_AMENITIES.map(amenity => {
            const isChecked = filters.amenities?.includes(amenity.code) || false;
            return (
              <label key={amenity.code} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isChecked}
                  onChange={(e) => {
                    const currentAmenities = filters.amenities || [];
                    handleFilterChange({ 
                      amenities: e.target.checked 
                        ? [...currentAmenities, amenity.code] 
                        : currentAmenities.filter(a => a !== amenity.code) 
                    });
                  }}
                />
                <span className={`text-sm flex-1 transition-colors ${isChecked ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
                  {amenity.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] bg-gray-100 px-1.5 py-0.5 rounded">
                  Phòng
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Tiện nghi & Dịch vụ Homestay (Place Scope) */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[var(--color-coral)]" /> Dịch vụ & Cơ sở vật chất
          </span>
          {placeAmenitiesSelectedCount > 0 && (
            <span className="text-[10px] bg-[var(--color-primary-50)] text-[var(--color-primary)] px-2 py-0.5 rounded-md font-bold">
              {placeAmenitiesSelectedCount} đã chọn
            </span>
          )}
        </h4>
        <div className="flex flex-col gap-2.5">
          {PLACE_AMENITIES.map(amenity => {
            const isChecked = filters.amenities?.includes(amenity.code) || false;
            return (
              <label key={amenity.code} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isChecked}
                  onChange={(e) => {
                    const currentAmenities = filters.amenities || [];
                    handleFilterChange({ 
                      amenities: e.target.checked 
                        ? [...currentAmenities, amenity.code] 
                        : currentAmenities.filter(a => a !== amenity.code) 
                    });
                  }}
                />
                <span className={`text-sm flex-1 transition-colors ${isChecked ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
                  {amenity.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Điểm đánh giá của khách */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" /> Đánh giá của khách
          </span>
        </h4>
        <div className="flex flex-col gap-2.5">
          {[4.5, 4.0, 3.5].map(score => {
            const isChecked = filters.minRating === score;
            return (
              <label key={score} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isChecked}
                  onChange={(e) => handleFilterChange({ minRating: e.target.checked ? score : undefined })}
                />
                <span className={`text-sm flex-1 transition-colors ${isChecked ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
                  {score === 4.5 ? 'Tuyệt hảo (4.5+)' : score === 4.0 ? 'Rất tốt (4.0+)' : 'Tốt (3.5+)'}
                </span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${i < Math.floor(score) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </label>
            );
          })}
        </div>
      </div>
      
      {/* 4. Ngân sách mỗi đêm */}
      <div className="p-4 bg-gradient-to-b from-white to-gray-50/40">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-[var(--color-ink-deep)] text-sm">Ngân sách (mỗi đêm)</h4>
          {(filters.minPrice || filters.maxPrice) && (
            <button
              onClick={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
              className="text-[11px] text-[var(--color-muted)] hover:text-[var(--color-coral)] transition-colors"
            >
              Mặc định
            </button>
          )}
        </div>
        <PriceSlider 
          min={200000} 
          max={4000000} 
          step={100000}
          value={[filters.minPrice ?? 200000, filters.maxPrice ?? 4000000]}
          onChange={() => {}}
          onChangeEnd={([min, max]) => handleFilterChange({ 
            minPrice: min > 200000 ? min : undefined, 
            maxPrice: max < 4000000 ? max : undefined 
          })}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--color-canvas)]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[460px] md:min-h-[360px] flex items-start md:items-center justify-center pt-[136px] md:pt-[110px] pb-8 md:pb-6">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/85 via-[#0f2d3c]/50 to-transparent"></div>
          {/* Bottom fade to match background */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-canvas)] to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4">
          <SearchHub />
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-4 pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-3">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold">Homestay & Chỗ nghỉ Mù Cang Chải</span>
        </div>

        {/* BỘ LỌC BÊN TRÊN HIỆN ĐẠI (Top Filter Toolbar & Quick Filter Bar) */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-3.5 md:p-4 shadow-sm mb-5 transition-all">
          {/* Row 1: Header + Count + Sort & Map View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                Homestay & Chỗ nghỉ bản địa
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--color-primary-50)] text-[var(--color-primary)] border border-[var(--color-primary-100)]">
                  {homestays.length} chỗ nghỉ
                </span>
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Các homestay mộc mạc bên ruộng bậc thang, đầy đủ tiện nghi ấm cúng và phong cảnh đẹp
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 hover:border-gray-300 transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span className="text-xs text-gray-500 font-medium hidden md:inline">Sắp xếp:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs md:text-sm font-semibold text-[var(--color-ink-deep)] focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Gợi ý hàng đầu</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                  <option value="rating_desc">Đánh giá cao nhất</option>
                </select>
              </div>

              {/* Map Button (OpenStreetMap) */}
              <button 
                onClick={() => setShowMap(!showMap)} 
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md border transition-all shadow-2xs active:scale-98 cursor-pointer ${
                  showMap 
                    ? 'border-[#048c73] bg-[#048c73] text-white' 
                    : 'border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
                }`}
                title="Bật/Tắt chế độ xem bản đồ OpenStreetMap"
              >
                <Map className="w-3.5 h-3.5" />
                <span>{showMap ? 'Ẩn bản đồ' : 'Bản đồ OpenStreetMap'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Thanh lọc nhanh (1-click quick filter buttons) */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-sun)]" /> Lọc nhanh:
            </span>

            {/* Quick Điều hòa (Room) */}
            <button
              onClick={() => {
                const current = filters.amenities || [];
                const target = 'AIR_CONDITIONING';
                handleFilterChange({
                  amenities: current.includes(target)
                    ? current.filter(a => a !== target)
                    : [...current, target]
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.amenities?.includes('AIR_CONDITIONING')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Wind className="w-3 h-3" /> Điều hòa (Phòng)
            </button>

            {/* Quick Ban công view núi (Room) */}
            <button
              onClick={() => {
                const current = filters.amenities || [];
                const target = 'BALCONY';
                handleFilterChange({
                  amenities: current.includes(target)
                    ? current.filter(a => a !== target)
                    : [...current, target]
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.amenities?.includes('BALCONY')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Mountain className="w-3 h-3" /> View núi / ruộng
            </button>

            {/* Quick Bồn tắm thảo dược (Room) */}
            <button
              onClick={() => {
                const current = filters.amenities || [];
                const target = 'BATHTUB';
                handleFilterChange({
                  amenities: current.includes(target)
                    ? current.filter(a => a !== target)
                    : [...current, target]
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.amenities?.includes('BATHTUB')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Bath className="w-3 h-3" /> Bồn tắm thảo dược
            </button>

            {/* Quick Bếp nấu tự do (Place) */}
            <button
              onClick={() => {
                const current = filters.amenities || [];
                const target = 'KITCHEN';
                handleFilterChange({
                  amenities: current.includes(target)
                    ? current.filter(a => a !== target)
                    : [...current, target]
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.amenities?.includes('KITCHEN')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Utensils className="w-3 h-3" /> Bếp tự do
            </button>

            {/* Quick Đánh giá 4.5+ */}
            <button
              onClick={() => handleFilterChange({ minRating: filters.minRating === 4.5 ? undefined : 4.5 })}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.minRating === 4.5
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Star className={`w-3 h-3 ${filters.minRating === 4.5 ? 'text-white fill-white' : 'text-[#f59e0b] fill-[#f59e0b]'}`} />
              Đánh giá 4.5+
            </button>

            {/* Quick Budget < 500k */}
            <button
              onClick={() => {
                const isUnder500k = filters.maxPrice === 500000 && !filters.minPrice;
                handleFilterChange({
                  minPrice: undefined,
                  maxPrice: isUnder500k ? undefined : 500000
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.maxPrice === 500000 && !filters.minPrice
                  ? 'bg-[var(--color-coral)] text-white border-[var(--color-coral)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              Dưới 500k / đêm
            </button>
          </div>

          {/* Row 3: Active Filters Tags (Khi có bộ lọc đang chạy) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-dashed border-gray-200">
              <span className="text-xs font-semibold text-[var(--color-muted)] mr-1">
                Đang áp dụng:
              </span>

              {filters.province && filters.province !== 'Yên Bái' && (
                <button 
                  onClick={() => handleFilterChange({ province: undefined })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
                  Tỉnh: {filters.province} <X className="w-3 h-3 text-[var(--color-primary)]" />
                </button>
              )}

              {filters.ward && (
                <button 
                  onClick={() => handleFilterChange({ ward: undefined })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
                  Xã: {filters.ward} <X className="w-3 h-3 text-[var(--color-primary)]" />
                </button>
              )}

              {filters.attractions && filters.attractions.length > 0 && (
                <button 
                  onClick={() => handleFilterChange({ attractions: undefined })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#f59e0b] bg-[#fffbeb] text-[#b45309] text-xs font-semibold shadow-2xs transition-all hover:bg-[#fef3c7]"
                >
                  <Sparkles className="w-3 h-3 text-[#f59e0b]" />
                  {filters.attractions.length} điểm du lịch <X className="w-3 h-3 text-[#b45309]" />
                </button>
              )}

              {filters.checkIn && (
                <button 
                  onClick={() => handleFilterChange({ checkIn: undefined })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-teal-300 bg-teal-50 text-teal-800 text-xs font-semibold shadow-2xs transition-all hover:bg-teal-100"
                >
                  Ngày đi: {filters.checkIn} <X className="w-3 h-3 text-teal-700" />
                </button>
              )}

              {filters.amenities?.map(amenityCode => {
                const item = ALL_AMENITIES.find(a => a.code === amenityCode);
                const name = item ? `${item.name}${item.scope === 'ROOM' ? ' (Phòng)' : ''}` : amenityCode;
                return (
                  <button 
                    key={amenityCode}
                    onClick={() => handleFilterChange({ amenities: filters.amenities?.filter(a => a !== amenityCode) })}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                  >
                    {name} <X className="w-3 h-3 text-[var(--color-primary)]" />
                  </button>
                );
              })}

              {filters.minRating && (
                <button 
                  onClick={() => handleFilterChange({ minRating: undefined })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  {filters.minRating === 4.5 ? 'Tuyệt hảo (4.5+)' : filters.minRating === 4.0 ? 'Rất tốt (4.0+)' : 'Tốt (3.5+)'}
                  <Star className="w-3 h-3 inline text-[#f59e0b] fill-[#f59e0b]" />
                  <X className="w-3 h-3 text-[var(--color-primary)]" />
                </button>
              )}

              {(filters.minPrice || filters.maxPrice) && (
                <button 
                  onClick={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  {filters.minPrice ? `Từ ${filters.minPrice.toLocaleString('vi-VN')}đ` : ''}
                  {filters.minPrice && filters.maxPrice ? ' - ' : ''}
                  {filters.maxPrice ? `Đến ${filters.maxPrice.toLocaleString('vi-VN')}đ` : ''}
                  <X className="w-3 h-3 text-[var(--color-primary)]" />
                </button>
              )}

              <button 
                onClick={handleClearFilters}
                className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 text-xs font-bold transition-all shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" /> Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Main Content Layout with Sidebar */}
        <div className="w-full flex flex-col md:flex-row gap-6">
          {/* Mobile Filter Button */}
          <div className="flex md:hidden mb-2">
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="flex w-full items-center justify-center gap-2 bg-white p-3 rounded-md shadow-xs border border-[var(--color-primary)] text-sm font-bold text-[var(--color-primary)]"
            >
              <SlidersHorizontal className="w-4 h-4" /> Lọc kết quả homestay
            </button>
          </div>

          {/* Mobile Filter Modal */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end transition-opacity">
              <div className="w-[85%] max-w-[320px] h-full bg-white overflow-y-auto flex flex-col shadow-xl">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h3 className="font-bold text-[var(--color-ink-deep)] text-lg">Lọc homestay</h3>
                  <button onClick={() => setMobileFilterOpen(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-800">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1">
                  {renderFilters()}
                </div>
                <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <Button variant="primary" className="w-full h-11 rounded-md" onClick={() => setMobileFilterOpen(false)}>
                    Xem {homestays.length} kết quả
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar (Desktop) */}
          <aside className="hidden md:flex flex-col w-[300px] shrink-0 gap-4">
            {renderFilters()}
          </aside>

          {/* Main List */}
          <div className="flex-1 flex flex-col gap-4">
            {/* OpenStreetMap Interactive Viewer */}
            {showMap && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs mb-2 animate-in fade-in duration-300">
                <div className="px-4 py-2.5 bg-[#edfbf7] border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#048c73] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Bản đồ vị trí homestay (Nguồn: OpenStreetMap)
                  </span>
                  <button 
                    onClick={() => setShowMap(false)} 
                    className="text-xs text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                  >
                    ✕ Đóng bản đồ
                  </button>
                </div>
                <div className="h-[360px] w-full">
                  <OpenStreetMapView 
                    centerLat={homestays[0]?.latitude || 21.85}
                    centerLng={homestays[0]?.longitude || 104.08}
                    zoomLevel={12}
                    markers={homestays.map(hs => ({
                      id: hs.id,
                      name: hs.name,
                      latitude: hs.latitude || (21.85 + (Math.sin(Number(hs.id) || 1) * 0.05)),
                      longitude: hs.longitude || (104.08 + (Math.cos(Number(hs.id) || 1) * 0.05)),
                      price: hs.price,
                      kind: 'HOMESTAY',
                      displayMode: 'price',
                      coverImageUrl: hs.coverImageUrl,
                      district: hs.district,
                      url: `/homestays/${hs.id}`
                    }))}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center p-12 text-[var(--color-primary)] font-bold">
                Đang tìm kiếm homestay phù hợp...
              </div>
            ) : (
              <div>
                {paginatedHomestays.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-lg border border-gray-200 shadow-xs">
                    <p className="text-gray-500 font-medium">Không tìm thấy homestay nào phù hợp với bộ lọc đã chọn.</p>
                    <button 
                      onClick={handleClearFilters}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-50)] text-[var(--color-primary)] font-bold text-xs rounded-md border border-[var(--color-primary)] hover:bg-[var(--color-primary-100)] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Bỏ tất cả bộ lọc
                    </button>
                  </div>
                ) : (
                  /* 2 Ô 1 DÒNG KHI CHƯA RESPONSIVE (grid-cols-1 md:grid-cols-2) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    {paginatedHomestays.map((hs) => {
                      const phone = getHomestayPhone(hs);
                      const fb = getHomestayFacebook(hs);
                      const tiktok = getHomestayTikTok(hs);

                      return (
                        <div 
                          key={hs.id} 
                          className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-xs hover:shadow-md hover:border-[var(--color-primary-300)] transition-all flex flex-col justify-between"
                        >
                          {/* Image */}
                          <div className="relative w-full h-[190px] shrink-0 overflow-hidden">
                            <Link to={`/homestays/${hs.id}`} className="block w-full h-full">
                              <img 
                                src={hs.coverImageUrl} 
                                alt={hs.name} 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                              />
                            </Link>
                            <button className="absolute top-2.5 right-2.5 w-8 h-8 rounded-md bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs text-gray-400 hover:text-red-500 transition-colors">
                              <Heart className="w-4 h-4" />
                            </button>
                            {/* Rating badge */}
                            <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs flex items-center gap-1 border border-black/5">
                              <Star className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" />
                              <span className="font-extrabold text-[#78350f] text-xs leading-none">
                                {hs.ratingScore > 0 ? hs.ratingScore.toString().replace('.', ',') : '9,0'}
                              </span>
                              {hs.reviewCount > 0 && (
                                <span className="text-[10px] text-gray-500 font-medium">({hs.reviewCount})</span>
                              )}
                            </div>
                            {hs.isGenius && (
                              <span className="absolute top-2.5 left-2.5 bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                Genius
                              </span>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between">
                            <div>
                              <Link to={`/homestays/${hs.id}`}>
                                <h2 className="text-[16px] font-bold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-1 mb-1">
                                  {hs.name}
                                </h2>
                              </Link>

                              {/* Vị trí với liên kết OpenStreetMap */}
                              <div className="text-xs text-[var(--color-primary)] flex items-center gap-1 mb-2">
                                <a 
                                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(hs.name + ' ' + (hs.district || ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center gap-1 truncate text-[#048c73]"
                                  title="Xem vị trí trên OpenStreetMap"
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{hs.district || 'Yên Bái'}</span>
                                </a>
                                {hs.distanceFromCenter && (
                                  <span className="text-gray-400 shrink-0 text-[11px]">• {hs.distanceFromCenter}</span>
                                )}
                              </div>

                              {hs.description && (
                                <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed mb-2">
                                  {hs.description}
                                </p>
                              )}
                              
                              {/* Tiện nghi */}
                              {hs.amenities && hs.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2.5">
                                  {hs.amenities.slice(0, 3).map((amenity, aIdx) => (
                                    <span key={aIdx} className="bg-[var(--color-hover)] text-[var(--color-primary)] text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-[var(--color-primary)]/15">
                                      <Check className="w-2.5 h-2.5 text-[var(--color-accent)]" />
                                      {amenity}
                                    </span>
                                  ))}
                                  {hs.amenities.length > 3 && (
                                    <span className="text-[10px] text-[var(--color-muted)] font-medium self-center">
                                      +{hs.amenities.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* CÁC LINK LIÊN QUAN: PHONE, FACEBOOK, TIKTOK CÓ ICON THEO TỪNG LOẠI */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 border-t border-gray-100">
                                {/* Phone Number */}
                                <a 
                                  href={`tel:${phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold transition-colors border border-emerald-200 shadow-2xs"
                                  title="Gọi điện đặt phòng"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{formatPhoneNumber(phone)}</span>
                                </a>

                                {/* Facebook */}
                                <a 
                                  href={fb}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 text-[11px] font-bold transition-colors border border-blue-200 shadow-2xs"
                                  title="Trang Facebook Homestay"
                                >
                                  <FacebookIcon className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span>Facebook</span>
                                </a>

                                {/* TikTok */}
                                <a 
                                  href={tiktok}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-[11px] font-bold transition-colors border border-neutral-300 shadow-2xs"
                                  title="Kênh TikTok Homestay"
                                >
                                  <TikTokIcon className="w-3 h-3 text-neutral-900 shrink-0" />
                                  <span>TikTok</span>
                                </a>
                              </div>
                            </div>

                            {/* Bottom: Price & Button */}
                            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                              <div className="flex flex-col">
                                {hs.originalPrice && (
                                  <span className="text-gray-400 text-[10px] line-through">
                                    {hs.originalPrice.toLocaleString('vi-VN')} đ
                                  </span>
                                )}
                                <span className="text-[17px] font-extrabold text-[#ea580c] leading-tight">
                                  {hs.price ? `${hs.price.toLocaleString('vi-VN')} đ` : 'Liên hệ'}
                                </span>
                                <span className="text-[10px] text-gray-400">/đêm</span>
                              </div>

                              <Link to={`/homestays/${hs.id}`} className="shrink-0">
                                <Button variant="primary" className="rounded-md font-bold h-8 px-3.5 text-xs bg-[#048c73] hover:bg-[#03725e]">
                                  Xem chỗ trống
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6 mb-4">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-xs"
                    >
                      <ChevronLeft className="w-4 h-4 text-[var(--color-ink-deep)]" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-9 h-9 rounded-md font-bold text-xs transition-colors ${
                            currentPage === i + 1 
                              ? 'bg-[var(--color-primary)] text-white shadow-2xs' 
                              : 'text-[var(--color-ink-deep)] hover:bg-gray-100 bg-white border border-gray-200'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-xs"
                    >
                      <ChevronRight className="w-4 h-4 text-[var(--color-ink-deep)]" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

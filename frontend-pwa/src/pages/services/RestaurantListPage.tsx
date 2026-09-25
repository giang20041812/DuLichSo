import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchRestaurants, RestaurantDto, RestaurantFilterParams } from '@/services/restaurantService';
import { PriceSlider } from '@/components/ui/price-slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Heart, 
  SlidersHorizontal, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowUpDown, 
  RotateCcw, 
  Map, 
  Sparkles,
  UtensilsCrossed,
  Wifi,
  Car,
  Home,
  Phone,
  Globe,
  ExternalLink,
  MessageCircle,
  Video
} from 'lucide-react';

const CUISINE_CATEGORIES = [
  'Đặc sản Tây Bắc',
  'Thắng cố & Thịt ngựa',
  'Cơm bản & Lẩu nướng',
  'Ẩm thực nhà sàn Thái',
  'Gà đồi & Lợn bản'
];

const RESTAURANT_AMENITIES = [
  { code: 'PARKING', name: 'Bãi đỗ xe ô tô', icon: Car },
  { code: 'STILT_HOUSE', name: 'Không gian nhà sàn', icon: Home },
  { code: 'WIFI', name: 'Wifi miễn phí', icon: Wifi },
  { code: 'PRIVATE_ROOM', name: 'Phòng tiệc riêng', icon: UtensilsCrossed },
];

export default function RestaurantListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'>('recommended');
  
  // Khởi tạo filters từ URL params
  const [filters, setFilters] = useState<RestaurantFilterParams>(() => {
    const initialFilters: RestaurantFilterParams = {};
    const q = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const cuisinesStr = searchParams.get('cuisines');
    const amenitiesStr = searchParams.get('amenities');
    
    if (q) initialFilters.keyword = q;
    if (minPrice) initialFilters.minPrice = Number(minPrice);
    if (maxPrice) initialFilters.maxPrice = Number(maxPrice);
    if (minRating) initialFilters.minRating = Number(minRating);
    if (cuisinesStr) initialFilters.cuisineTypes = cuisinesStr.split(',');
    if (amenitiesStr) initialFilters.amenities = amenitiesStr.split(',');
    
    return initialFilters;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const ITEMS_PER_PAGE = 8;

  const handleFilterChange = (updates: Partial<RestaurantFilterParams>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      // Đồng bộ URL params
      const newParams = new URLSearchParams(searchParams);
      if (newFilters.keyword) newParams.set('q', newFilters.keyword); else newParams.delete('q');
      if (newFilters.minPrice !== undefined) newParams.set('minPrice', newFilters.minPrice.toString()); else newParams.delete('minPrice');
      if (newFilters.maxPrice !== undefined) newParams.set('maxPrice', newFilters.maxPrice.toString()); else newParams.delete('maxPrice');
      if (newFilters.minRating !== undefined) newParams.set('minRating', newFilters.minRating.toString()); else newParams.delete('minRating');
      if (newFilters.cuisineTypes && newFilters.cuisineTypes.length > 0) newParams.set('cuisines', newFilters.cuisineTypes.join(',')); else newParams.delete('cuisines');
      if (newFilters.amenities && newFilters.amenities.length > 0) newParams.set('amenities', newFilters.amenities.join(',')); else newParams.delete('amenities');
      
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

  // Đồng bộ lại filters nếu URL thay đổi (nhấn back/forward)
  useEffect(() => {
    const q = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const cuisinesStr = searchParams.get('cuisines');
    const amenitiesStr = searchParams.get('amenities');
    
    setFilters({
      keyword: q || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      cuisineTypes: cuisinesStr ? cuisinesStr.split(',') : undefined,
      amenities: amenitiesStr ? amenitiesStr.split(',') : undefined,
    });
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchRestaurants(filters).then(data => {
      setRestaurants(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filters]);

  const hasActiveFilters = Boolean(
    filters.keyword || filters.cuisineTypes?.length || filters.amenities?.length || filters.minRating || filters.maxPrice || filters.minPrice
  );

  // Sorting
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.priceMin || 0) - (b.priceMin || 0);
    if (sortBy === 'price_desc') return (b.priceMin || 0) - (a.priceMin || 0);
    if (sortBy === 'rating_desc') return (b.ratingScore || 0) - (a.ratingScore || 0);
    return 0;
  });

  const paginatedRestaurants = sortedRestaurants.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedRestaurants.length / ITEMS_PER_PAGE);

  const renderFilters = () => (
    <div className="bg-white border border-gray-200/80 rounded-lg overflow-hidden shadow-xs">
      <div className="p-4 border-b border-gray-200/80 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="font-bold text-[var(--color-ink-deep)] text-base">Bộ lọc ẩm thực</h3>
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
      
      {/* Loại hình món ăn / Đặc sản */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm flex items-center justify-between">
          <span>Đặc sản & Món ăn</span>
          {filters.cuisineTypes?.length ? (
            <span className="text-[10px] bg-[var(--color-primary-50)] text-[var(--color-primary)] px-2 py-0.5 rounded-full font-bold">
              {filters.cuisineTypes.length} đã chọn
            </span>
          ) : null}
        </h4>
        <div className="flex flex-col gap-2.5">
          {CUISINE_CATEGORIES.map(category => {
            const isChecked = filters.cuisineTypes?.includes(category) || false;
            return (
              <label key={category} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isChecked}
                  onChange={(e) => {
                    const current = filters.cuisineTypes || [];
                    handleFilterChange({ 
                      cuisineTypes: e.target.checked 
                        ? [...current, category] 
                        : current.filter(c => c !== category) 
                    });
                  }}
                />
                <span className={`text-sm flex-1 transition-colors ${isChecked ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
                  {category}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Điểm đánh giá */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Điểm đánh giá</h4>
        <div className="flex flex-col gap-2.5">
          {[4.5, 4.0, 3.5].map(score => {
            const isSelected = filters.minRating === score;
            return (
              <label key={score} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isSelected}
                  onChange={(e) => handleFilterChange({ minRating: e.target.checked ? score : undefined })}
                />
                <span className={`text-sm flex-1 transition-colors ${isSelected ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
                  {score === 4.5 ? 'Tuyệt hảo (4.5+)' : score === 4.0 ? 'Rất ngon (4.0+)' : 'Được khen (3.5+)'}
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

      {/* Tiện ích quán ăn */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Không gian & Tiện ích</h4>
        <div className="flex flex-col gap-2.5">
          {RESTAURANT_AMENITIES.map(amenity => {
            const isChecked = filters.amenities?.includes(amenity.code) || false;
            return (
              <label key={amenity.code} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isChecked}
                  onChange={(e) => {
                    const current = filters.amenities || [];
                    handleFilterChange({ 
                      amenities: e.target.checked 
                        ? [...current, amenity.code] 
                        : current.filter(a => a !== amenity.code) 
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
      
      {/* Ngân sách tham khảo */}
      <div className="p-4 bg-gradient-to-b from-white to-gray-50/40">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-[var(--color-ink-deep)] text-sm">Mức giá tham khảo (/người)</h4>
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
          min={30000} 
          max={500000} 
          step={20000}
          value={[filters.minPrice ?? 30000, filters.maxPrice ?? 500000]}
          onChange={() => {}}
          onChangeEnd={([min, max]) => handleFilterChange({ 
            minPrice: min > 30000 ? min : undefined, 
            maxPrice: max < 500000 ? max : undefined 
          })}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--color-canvas)]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[420px] md:min-h-[380px] flex items-start md:items-center justify-center pt-[175px] md:pt-[160px] pb-10 md:pb-8">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000&auto=format&fit=crop')` }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/85 via-[#0f2d3c]/50 to-transparent"></div>
          {/* Bottom fade to match canvas background */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-canvas)] to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white backdrop-blur-md mb-3 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-sm border border-white/20">
            <UtensilsCrossed className="w-4 h-4 text-[#f59e0b]" />
            <span>Món ngon vùng cao & Ẩm thực Mù Cang Chải</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight mb-3 drop-shadow-md">
            Hương Vị Tây Bắc Nguyên Bản
          </h1>
          <p className="text-white/90 text-sm md:text-base font-body max-w-2xl mx-auto drop-shadow-sm">
            Thưởng thức thắng cố truyền thống, lợn cắp nách nướng than hoa, cá suối, xôi ngũ sắc nếp nương Tú Lệ tại những quán ăn bản địa thân thiện.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-3 pb-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-3">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold">Nhà hàng & Ẩm thực Mù Cang Chải</span>
        </div>

        {/* BỘ LỌC BÊN TRÊN HIỆN ĐẠI (Top Filter Toolbar & Quick Filter Bar) */}
        <div className="bg-white border border-gray-200/80 rounded-lg p-3.5 md:p-4 shadow-sm mb-5 transition-all">
          
          {/* Row 1: Header + Count + Sort & Map View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                Quán ăn & Nhà hàng đặc sản
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary-50)] text-[var(--color-primary)] border border-[var(--color-primary-100)]">
                  {restaurants.length} địa điểm
                </span>
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Các điểm ẩm thực bản địa uy tín, địa chỉ thực tế kèm số điện thoại liên hệ trực tiếp
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

              {/* Map Button */}
              <Link 
                to="/map" 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-2xs active:scale-98"
              >
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xem</span> Bản đồ
              </Link>
            </div>
          </div>

          {/* Row 2: Thanh lọc nhanh (1-click quick filter buttons) */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-sun)]" /> Lọc nhanh:
            </span>

            {/* Quick 4.5+ Rating */}
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

            {/* Quick Thắng cố & Thịt ngựa */}
            <button
              onClick={() => {
                const current = filters.cuisineTypes || [];
                const target = 'Thắng cố & Thịt ngựa';
                const hasType = current.includes(target);
                handleFilterChange({
                  cuisineTypes: hasType ? current.filter(c => c !== target) : [...current, target]
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.cuisineTypes?.includes('Thắng cố & Thịt ngựa')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <UtensilsCrossed className="w-3 h-3" /> Thắng cố & Ngựa
            </button>

            {/* Quick Không gian nhà sàn */}
            <button
              onClick={() => {
                const current = filters.amenities || [];
                const hasStilt = current.includes('STILT_HOUSE');
                handleFilterChange({
                  amenities: hasStilt ? current.filter(a => a !== 'STILT_HOUSE') : [...current, 'STILT_HOUSE']
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.amenities?.includes('STILT_HOUSE')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Home className="w-3 h-3" /> Quán nhà sàn
            </button>

            {/* Quick Bãi đỗ xe */}
            <button
              onClick={() => {
                const current = filters.amenities || [];
                const hasParking = current.includes('PARKING');
                handleFilterChange({
                  amenities: hasParking ? current.filter(a => a !== 'PARKING') : [...current, 'PARKING']
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.amenities?.includes('PARKING')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Car className="w-3 h-3" /> Chỗ đỗ ô tô
            </button>

            {/* Quick Price Under 100k */}
            <button
              onClick={() => {
                const isUnder100 = filters.maxPrice === 100000;
                handleFilterChange({
                  minPrice: undefined,
                  maxPrice: isUnder100 ? undefined : 100000
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.maxPrice === 100000
                  ? 'bg-[var(--color-coral)] text-white border-[var(--color-coral)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              Dưới 100k / người
            </button>

            {/* Quick Price 100k - 200k */}
            <button
              onClick={() => {
                const is100to200 = filters.minPrice === 100000 && filters.maxPrice === 200000;
                handleFilterChange({
                  minPrice: is100to200 ? undefined : 100000,
                  maxPrice: is100to200 ? undefined : 200000
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.minPrice === 100000 && filters.maxPrice === 200000
                  ? 'bg-[var(--color-coral)] text-white border-[var(--color-coral)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              100k - 200k / người
            </button>
          </div>

          {/* Row 3: Active Filters Tags (Khi có bộ lọc đang chạy) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-dashed border-gray-200">
              <span className="text-xs font-semibold text-[var(--color-muted)] mr-1">
                Đang áp dụng:
              </span>

              {filters.keyword && (
                <button 
                  onClick={() => {
                    handleFilterChange({ keyword: undefined });
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  Từ khóa: "{filters.keyword}" <X className="w-3 h-3 text-[var(--color-primary)]" />
                </button>
              )}

              {filters.cuisineTypes?.map(category => (
                <button 
                  key={category}
                  onClick={() => handleFilterChange({ cuisineTypes: filters.cuisineTypes?.filter(c => c !== category) })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  {category} <X className="w-3 h-3 text-[var(--color-primary)]" />
                </button>
              ))}

              {filters.amenities?.map(amenityCode => {
                const name = RESTAURANT_AMENITIES.find(a => a.code === amenityCode)?.name || amenityCode;
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
                  {filters.minRating === 4.5 ? 'Tuyệt hảo: 4.5+' : filters.minRating === 4 ? 'Rất ngon: 4.0+' : 'Được khen: 3.5+'} 
                  <Star className="w-3 h-3 inline text-[#f59e0b] fill-[#f59e0b]" />
                  <X className="w-3 h-3 text-[var(--color-primary)] ml-0.5" />
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

        <div className="w-full flex flex-col md:flex-row gap-6">
        
          {/* Mobile Filter Button */}
          <div className="flex md:hidden mb-2">
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="flex w-full items-center justify-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-[var(--color-primary)] text-sm font-bold text-[var(--color-primary)]"
            >
              <SlidersHorizontal className="w-4 h-4" /> Lọc kết quả ẩm thực
            </button>
          </div>

          {/* Mobile Filter Modal */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end transition-opacity">
              <div className="w-[85%] max-w-[320px] h-full bg-white overflow-y-auto flex flex-col shadow-xl">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h3 className="font-bold text-[var(--color-ink-deep)] text-lg">Lọc quán ăn</h3>
                  <button onClick={() => setMobileFilterOpen(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-800">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1">
                  {renderFilters()}
                </div>
                <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <Button variant="primary" className="w-full h-12" onClick={() => setMobileFilterOpen(false)}>
                    Xem {restaurants.length} kết quả
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar (Desktop) */}
          <aside className="hidden md:flex flex-col w-[300px] shrink-0 gap-4">
            {renderFilters()}
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center p-12 text-[var(--color-primary)] font-bold">
                Đang tải danh sách quán ăn...
              </div>
            ) : (
              <div>
                {paginatedRestaurants.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-xl border border-gray-200">
                    <p className="text-gray-500">Không tìm thấy quán ăn nào phù hợp với bộ lọc.</p>
                    <button 
                      onClick={handleClearFilters}
                      className="mt-3 text-sm font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Bỏ bộ lọc để xem tất cả
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {paginatedRestaurants.map((res) => {
                      const googleMapsQuery = encodeURIComponent(
                        (res.address || res.district || '') + ' ' + res.name
                      );
                      const googleMapsUrl = res.latitude && res.longitude 
                        ? `https://www.google.com/maps/search/?api=1&query=${res.latitude},${res.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

                      return (
                        <div 
                          key={res.id} 
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
                        >
                          {/* Top: Image & Essential info */}
                          <div>
                            <div className="relative w-full h-[210px] overflow-hidden bg-gray-100">
                              <Link to={`/restaurants/${res.id}`} className="block w-full h-full">
                                <img 
                                  src={res.coverImageUrl} 
                                  alt={res.name} 
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                />
                              </Link>
                              
                              <button 
                                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs text-gray-500 hover:text-red-500 transition-colors"
                                aria-label="Lưu quán ăn"
                              >
                                <Heart className="w-4 h-4" />
                              </button>

                              {res.promotionalBadge && (
                                <div className="absolute top-2.5 left-2.5">
                                  <Badge className="bg-[var(--color-coral)] text-white text-[11px] font-bold rounded-sm px-2 py-0.5 shadow-xs">
                                    {res.promotionalBadge}
                                  </Badge>
                                </div>
                              )}

                              {res.specialtyTag && !res.promotionalBadge && (
                                <div className="absolute top-2.5 left-2.5">
                                  <Badge className="bg-[var(--color-primary)] text-white text-[11px] font-bold rounded-sm px-2 py-0.5 shadow-xs">
                                    {res.specialtyTag}
                                  </Badge>
                                </div>
                              )}

                              {/* Rating badge góc dưới ảnh */}
                              <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                                <span>{res.ratingScore > 0 ? res.ratingScore.toString().replace('.', ',') : '4,8'}</span>
                                {res.reviewCount > 0 && (
                                  <span className="text-gray-300 text-[11px] font-normal">({res.reviewCount} đánh giá)</span>
                                )}
                              </div>
                            </div>

                            {/* Body content */}
                            <div className="p-4 flex flex-col gap-2.5">
                              <div>
                                <Link to={`/restaurants/${res.id}`}>
                                  <h3 className="text-lg font-bold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-1">
                                    {res.name}
                                  </h3>
                                </Link>
                                
                                <p className="text-xs text-[var(--color-muted)] flex items-center gap-1 mt-1 line-clamp-1">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)]" />
                                  <span>{res.address || res.district || 'Mù Cang Chải'}</span>
                                </p>
                              </div>

                              {res.description && (
                                <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                                  {res.description}
                                </p>
                              )}

                              {/* Cuisine tag */}
                              {res.cuisineType && (
                                <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
                                  <UtensilsCrossed className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                  <span>{res.cuisineType}</span>
                                </div>
                              )}

                              {/* Contact items badge row */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
                                {/* Luôn luôn hiện nút Google Maps trực tiếp */}
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors"
                                  title="Mở chỉ đường Google Maps"
                                >
                                  <Map className="w-3 h-3 text-blue-600" />
                                  Google Maps
                                </a>

                                {/* Hiển thị các kênh liên hệ thật (SĐT, FB, TikTok, Zalo...) */}
                                {res.contacts && res.contacts.length > 0 ? (
                                  res.contacts.map((contact, cIdx) => {
                                    let icon = <Globe className="w-3 h-3" />;
                                    let label = contact.value;
                                    let href = contact.value;
                                    let colorClass = "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";

                                    if (contact.channel === 'PHONE') {
                                      icon = <Phone className="w-3 h-3 text-emerald-600" />;
                                      label = contact.value;
                                      href = `tel:${contact.value.replace(/[^0-9+]/g, '')}`;
                                      colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
                                    } else if (contact.channel === 'ZALO') {
                                      icon = <MessageCircle className="w-3 h-3 text-cyan-600" />;
                                      label = "Zalo: " + contact.value;
                                      href = contact.value.startsWith('http') ? contact.value : `https://zalo.me/${contact.value.replace(/[^0-9]/g, '')}`;
                                      colorClass = "bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100";
                                    } else if (contact.channel === 'FACEBOOK') {
                                      icon = <ExternalLink className="w-3 h-3 text-indigo-600" />;
                                      label = "Facebook";
                                      href = contact.value.startsWith('http') ? contact.value : `https://facebook.com/${contact.value}`;
                                      colorClass = "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100";
                                    } else if (contact.channel === 'TIKTOK') {
                                      icon = <Video className="w-3 h-3 text-neutral-800" />;
                                      label = "TikTok";
                                      href = contact.value.startsWith('http') ? contact.value : `https://tiktok.com/@${contact.value.replace('@', '')}`;
                                      colorClass = "bg-neutral-100 text-neutral-900 border-neutral-300 hover:bg-neutral-200";
                                    }

                                    return (
                                      <a
                                        key={cIdx}
                                        href={href}
                                        target={contact.channel === 'PHONE' ? '_self' : '_blank'}
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${colorClass}`}
                                      >
                                        {icon}
                                        <span className="truncate max-w-[120px]">{label}</span>
                                      </a>
                                    );
                                  })
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic">Liên hệ đang cập nhật</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom: Price & CTA */}
                          <div className="p-4 pt-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] text-[var(--color-muted)] block leading-tight">Giá tham khảo</span>
                              <div className="text-lg font-black text-[var(--color-coral)] leading-tight">
                                {res.priceMin.toLocaleString('vi-VN')}đ
                                <span className="text-[11px] text-gray-500 font-normal"> /{res.priceUnitNote || 'người'}</span>
                              </div>
                            </div>

                            <Link to={`/restaurants/${res.id}`}>
                              <Button 
                                variant="primary" 
                                className="rounded-md font-bold h-9 px-4 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)]"
                              >
                                Xem chi tiết
                              </Button>
                            </Link>
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
                      className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                    >
                      <ChevronLeft className="w-5 h-5 text-[var(--color-ink-deep)]" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-full font-medium text-sm transition-colors ${
                            currentPage === i + 1 
                              ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                              : 'text-[var(--color-ink-deep)] hover:bg-gray-100 bg-white'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                    >
                      <ChevronRight className="w-5 h-5 text-[var(--color-ink-deep)]" />
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

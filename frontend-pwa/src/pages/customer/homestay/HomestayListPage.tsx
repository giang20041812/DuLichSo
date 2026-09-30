import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchHomestays, fetchHomestayAmenities, HomestayFilterParams } from '@/services/homestayService';
import { HomestayDto, PublicAmenityItem } from '@/types/homestay';
import SearchHub from '@/components/layout/SearchHub';
import { PriceSlider } from '@/components/ui/price-slider';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { openGoogleMapsDirections } from '@/lib/mapUtils';
import {
  MapPin,
  SlidersHorizontal,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  ArrowUpDown,
  RotateCcw,
  Map,
  Sparkles,
  Wind,
  Mountain,
  Bath,
  Utensils,
  Flame,
  Phone,
  type LucideIcon
} from 'lucide-react';
import VietmapView from '@/components/map/VietmapView';

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

// Chip "Lọc nhanh": chỉ hiện khi mã tiện ích có trong danh mục đang dùng (GET /api/public/places/amenities).
const QUICK_AMENITY_ICONS: [string, LucideIcon][] = [
  ['AIR_CONDITIONING', Wind],
  ['TERRACE', Mountain],
  ['BATHTUB', Bath],
  ['KITCHEN', Utensils],
  ['BREAKFAST', Utensils],
];

export default function HomestayListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [homestays, setHomestays] = useState<HomestayDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'>('recommended');
  const [keywordInput, setKeywordInput] = useState('');
  const [amenityCatalog, setAmenityCatalog] = useState<PublicAmenityItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetchHomestayAmenities()
      .then(items => { if (alive) setAmenityCatalog(items); })
      .catch(() => { if (alive) setAmenityCatalog([]); });
    return () => { alive = false; };
  }, []);

  const roomAmenities = amenityCatalog.filter(a => a.scope === 'ROOM');
  const placeAmenities = amenityCatalog.filter(a => a.scope === 'PLACE');
  const quickAmenities = QUICK_AMENITY_ICONS
    .map(([code, Icon]) => ({ item: amenityCatalog.find(a => a.code === code), Icon }))
    .filter((q): q is { item: PublicAmenityItem; Icon: LucideIcon } => q.item !== undefined);

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
    const keywordStr = searchParams.get('keyword');

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
    if (keywordStr) initialFilters.keyword = keywordStr;

    return initialFilters;
  });

  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get('page') || '1'));
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const filterPanelRef = useRef<HTMLElement>(null);
  const [filterPanelHeight, setFilterPanelHeight] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 12;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const getHomestayPhone = (hs: HomestayDto) => {
    const c = hs.contacts?.find(item => item.channel === 'PHONE');
    return c?.value ? c.value.trim() : null;
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const getHomestayFacebook = (hs: HomestayDto) => {
    const c = hs.contacts?.find(item => item.channel === 'FACEBOOK');
    if (!c || !c.value) return null;
    const val = c.value.trim();
    return val.startsWith('http') ? val : `https://facebook.com/${val.replace(/^@/, '')}`;
  };

  const getHomestayTikTok = (hs: HomestayDto) => {
    const c = hs.contacts?.find(item => item.channel === 'TIKTOK');
    if (!c || !c.value) return null;
    const val = c.value.trim();
    return val.startsWith('http') ? val : `https://www.tiktok.com/@${val.replace(/^@/, '')}`;
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
      if (newFilters.keyword) newParams.set('keyword', newFilters.keyword); else newParams.delete('keyword');
      newParams.delete('guestCount');
      newParams.set('page', '1');

      setSearchParams(newParams, { replace: true });
      return newFilters;
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchParams(new URLSearchParams(), { replace: true });
    setCurrentPage(1);
    setError(null);
  };

  const handleSortChange = (value: typeof sortBy) => {
    setSortBy(value);
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    next.set('sort', value);
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const handlePageChange = (page: number) => {
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(safePage);
    const next = new URLSearchParams(searchParams);
    next.set('page', String(safePage));
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const keywordStr = searchParams.get('keyword');
    const page = Number(searchParams.get('page') || '1');
    const urlSort = searchParams.get('sort') as typeof sortBy | null;

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
      keyword: keywordStr || undefined,
    });
    setKeywordInput(keywordStr || '');
    if (Number.isFinite(page) && page > 0) setCurrentPage(page);
    if (urlSort && ['recommended', 'price_asc', 'price_desc', 'rating_desc'].includes(urlSort)) setSortBy(urlSort);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchHomestays({ ...filters, page: currentPage - 1, sort: sortBy }).then(data => {
      setHomestays(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    }).catch((err: unknown) => {
      setHomestays([]);
      setTotalElements(0);
      setTotalPages(0);
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách Homestay.');
    }).finally(() => setLoading(false));
  }, [filters, currentPage, sortBy]);

  const hasActiveFilters = Boolean(
    filters.amenities?.length || filters.minRating || filters.maxPrice || filters.minPrice || filters.ward || (filters.province && filters.province !== 'Yên Bái') || filters.attractions?.length
  );

  const paginatedHomestays = [...homestays].sort((a, b) => {
    const score = (item: HomestayDto) => item.operationStatus === 'TEMPORARILY_CLOSED' || item.availableForSelectedDates === false ? 1 : 0;
    return score(a) - score(b);
  });
  const homestayDetailPath = (id: string) => {
    const query = searchParams.toString();
    return `/homestays/${id}${query ? `?${query}` : ''}`;
  };

  const roomAmenitiesSelectedCount = filters.amenities?.filter(code =>
    roomAmenities.some(ra => ra.code === code)
  ).length || 0;

  const placeAmenitiesSelectedCount = filters.amenities?.filter(code =>
    placeAmenities.some(pa => pa.code === code)
  ).length || 0;

  const renderKeywordSearch = () => (
    <div className="pt-3 mt-3 border-t border-gray-100">
      <h2 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm flex items-center gap-1.5">
        <Search className="w-4 h-4 text-[var(--color-primary)]" /> Tìm kiếm chỗ nghỉ
      </h2>
      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleFilterChange({ keyword: keywordInput.trim() || undefined });
        }}
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tên, địa chỉ, mô tả..."
            aria-label="Tìm kiếm chỗ nghỉ"
            className="w-full h-11 pl-10 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all placeholder-gray-400"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {keywordInput && (
            <button
              type="button"
              aria-label="Xóa tìm kiếm"
              onClick={() => setKeywordInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="primary" className="h-11 px-5 rounded-md font-bold shrink-0">
          <Search className="w-4 h-4" />
          Tìm kiếm
        </Button>
      </form>
    </div>
  );

  useEffect(() => {
    const panel = filterPanelRef.current;
    if (!panel) return;

    const updatePanelHeight = () => setFilterPanelHeight(panel.getBoundingClientRect().height);
    updatePanelHeight();

    const observer = new ResizeObserver(updatePanelHeight);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [mobileFilterOpen]);

  const renderFilters = () => (
    <div ref={filterPanelRef} className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-xs">
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

      {/* 0. Tìm kiếm theo tên/địa chỉ */}
      <div className="hidden p-4 border-b border-gray-100 bg-white">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Tìm kiếm chỗ nghỉ
          </span>
        </h4>
        <div className="relative">
          <input
            type="text"
            placeholder="Tên, địa chỉ, mô tả..."
            className="w-full h-10 pl-9 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all placeholder-gray-400"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFilterChange({ keyword: keywordInput || undefined });
              }
            }}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {keywordInput && (
            <button
              onClick={() => {
                setKeywordInput('');
                handleFilterChange({ keyword: undefined });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Tiện nghi phòng ngủ (Room Scope) — chỉ hiện khi có homestay khai báo tiện nghi cấp phòng */}
      {roomAmenities.length > 0 && (
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
          {roomAmenities.map(amenity => {
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
      )}

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
          {placeAmenities.length === 0 && (
            <p className="text-xs text-[var(--color-muted)]">Chưa tải được danh mục tiện ích.</p>
          )}
          {placeAmenities.map(amenity => {
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
          onChange={() => { }}
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
        {/* Tìm kiếm tách riêng khỏi bộ lọc chi tiết */}
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-3">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold">Homestay & Chỗ nghỉ Mù Cang Chải</span>
        </div>

        <div className="hidden" aria-hidden="true">
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
                  {totalElements} chỗ nghỉ
                </span>
              </h2>

            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 hover:border-gray-300 transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span className="text-xs text-gray-500 font-medium hidden md:inline">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                  className="bg-transparent text-xs md:text-sm font-semibold text-[var(--color-ink-deep)] focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Gợi ý hàng đầu</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                  <option value="rating_desc">Đánh giá cao nhất</option>
                </select>
              </div>

              {/* Map Button (VietMap) */}
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md border transition-all shadow-2xs active:scale-98 cursor-pointer ${showMap
                    ? 'border-[#10b981] bg-[#10b981] text-white'
                    : 'border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
                  }`}
                title="Bật/Tắt chế độ xem bản đồ VietMap"
              >
                <Map className="w-3.5 h-3.5" />
                <span>{showMap ? 'Ẩn bản đồ' : 'Bản đồ VietMap'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Thanh lọc nhanh (1-click quick filter buttons) */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-sun)]" /> Lọc nhanh:
            </span>

            {quickAmenities.map(({ item, Icon }) => {
              const active = filters.amenities?.includes(item.code) ?? false;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    const current = filters.amenities || [];
                    handleFilterChange({
                      amenities: active ? current.filter(a => a !== item.code) : [...current, item.code]
                    });
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${active
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                      : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                >
                  <Icon className="w-3 h-3" /> {item.name}
                </button>
              );
            })}

            {/* Quick Đánh giá 4.5+ */}
            <button
              onClick={() => handleFilterChange({ minRating: filters.minRating === 4.5 ? undefined : 4.5 })}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${filters.minRating === 4.5
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
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${filters.maxPrice === 500000 && !filters.minPrice
                  ? 'bg-[var(--color-coral)] text-white border-[var(--color-coral)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
            >
              Dưới 500k / đêm
            </button>
          </div>

          {/* Thanh tìm kiếm nằm ngay dưới các bộ lọc nhanh */}
          {renderKeywordSearch()}

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
                const item = amenityCatalog.find(a => a.code === amenityCode);
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
        <div className="w-full flex flex-col gap-6 md:flex-row md:items-stretch">
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
                    Xem {totalElements} kết quả
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar (Desktop) */}
          <aside className="hidden w-[300px] shrink-0 flex-col gap-4 md:flex">
            {renderFilters()}
          </aside>

          {/* Main List */}
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* VietMap Interactive Viewer */}
            {showMap && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs mb-2 animate-in fade-in duration-300">
                <div className="px-4 py-2.5 bg-[#edfbf7] border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#10b981] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Bản đồ vị trí homestay (Nguồn: VietMap)
                  </span>
                  <button
                    onClick={() => setShowMap(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                  >
                    ✕ Đóng bản đồ
                  </button>
                </div>
                <div className="h-[360px] w-full">
                  <VietmapView
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

            <div className="relative flex min-h-0 flex-1 flex-col gap-4 md:min-h-full">
              {loading ? (
                <CardSkeleton count={ITEMS_PER_PAGE} layout="grid-2" imageHeight="h-48" />
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                  <p className="font-semibold text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      void fetchHomestays({ ...filters, page: currentPage - 1, sort: sortBy }).then((data) => {
                        setHomestays(data.content);
                        setTotalElements(data.totalElements);
                        setTotalPages(data.totalPages);
                      }).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không thể tải danh sách Homestay.')).finally(() => setLoading(false));
                    }}
                    className="mt-3 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-primary-600)]"
                  >
                    Thử lại
                  </button>
                </div>
              ) : paginatedHomestays.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-lg border border-gray-200 shadow-xs">
                  <p className="text-gray-500 font-medium">Không tìm thấy homestay nào phù hợp với bộ lọc đã chọn.</p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-50)] text-[var(--color-primary)] font-bold text-xs rounded-md border border-[var(--color-primary)] hover:bg-[var(--color-primary-100)] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Bỏ tất cả bộ lọc
                  </button>
                </div>
              ) : (
                /* 2 Ô 1 DÒNG KHI CHƯA RESPONSIVE (grid-cols-1 md:grid-cols-2) */
                <div
                  className="grid min-w-0 auto-rows-max items-start grid-cols-1 gap-4 overflow-y-auto overscroll-contain pr-1 lg:gap-5 md:grid-cols-2"
                  style={{ maxHeight: filterPanelHeight ? `${filterPanelHeight}px` : undefined }}
                >
                  {paginatedHomestays.map((hs) => {
                    const phone = getHomestayPhone(hs);
                    const fb = getHomestayFacebook(hs);
                    const tiktok = getHomestayTikTok(hs);

                      return (
                        <div
                          key={hs.id}
                          className="h-[500px] bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-primary-300)] transition-all duration-300 flex flex-col"
                        >
                          {/* Image */}
                          <div className="relative w-full h-[190px] shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
                            {hs.coverImageUrl ? (
                              <Link to={homestayDetailPath(hs.id)} className="block w-full h-full">
                                <img
                                  src={hs.coverImageUrl}
                                  alt={hs.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </Link>
                            ) : (
                              <Link to={homestayDetailPath(hs.id)} className="flex flex-col items-center justify-center w-full h-full text-slate-400">
                                <Mountain className="w-10 h-10 opacity-30 mb-1" />
                                <span className="text-xs">Chưa có ảnh</span>
                              </Link>
                            )}
                            {/* Rating badge */}
                            {hs.ratingScore > 0 && (
                              <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 border border-black/5">
                                <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                                <span className="font-extrabold text-[#78350f] text-xs sm:text-sm leading-none">
                                  {hs.ratingScore.toString().replace('.', ',')}
                                </span>
                                {hs.reviewCount > 0 && (
                                  <span className="text-[11px] text-gray-500 font-semibold">({hs.reviewCount})</span>
                                )}
                              </div>
                            )}
                            {/* Điểm Google (dữ liệu đã xác thực) — hiện khi chưa có đánh giá nội bộ */}
                            {hs.ratingScore <= 0 && hs.googleRating != null && (
                              <div
                                className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 border border-black/5"
                                title="Điểm đánh giá trên Google Maps"
                              >
                                <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                                <span className="font-extrabold text-[#78350f] text-xs sm:text-sm leading-none">
                                  {hs.googleRating.toFixed(1).replace('.', ',')}
                                </span>
                                <span className="text-[11px] text-gray-500 font-semibold">Google</span>
                              </div>
                            )}
                            {hs.isGenius && (
                              <span className="absolute top-2.5 left-2.5 bg-[var(--color-primary)] text-white text-xs font-extrabold px-2.5 py-0.5 rounded-md shadow-xs">
                                Genius
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-h-0 flex-1 p-4 flex flex-col justify-between">
                            <div className="min-h-0 flex-1 overflow-hidden">
                              <Link to={homestayDetailPath(hs.id)}>
                                <h2 className="text-lg font-extrabold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-1 mb-1.5">
                                  {hs.name}
                                </h2>
                              </Link>

                              {hs.operationStatus === 'TEMPORARILY_CLOSED' && (
                                <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900">
                                  Tạm ngừng nhận đặt phòng{hs.operationStatusReason ? `: ${hs.operationStatusReason}` : ''}
                                </div>
                              )}
                              {hs.availableForSelectedDates === false && hs.operationStatus !== 'TEMPORARILY_CLOSED' && (
                                <div className="mb-2 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                                  Không khả dụng trong khoảng ngày đã chọn
                                </div>
                              )}

                              {/* Vị trí với liên kết xem trên bản đồ VietMap */}
                              <div className="text-xs sm:text-[13px] text-[var(--color-primary)] font-semibold flex items-center gap-1 mb-2">
                                <button
                                  type="button"
                                  onClick={() => setShowMap(true)}
                                  className="hover:underline flex items-center gap-1 truncate text-[#10b981] cursor-pointer"
                                  title="Xem vị trí trên bản đồ VietMap"
                                >
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{hs.district || 'Yên Bái'}</span>
                                </button>
                                {hs.distanceFromCenter && (
                                  <span className="text-gray-400 shrink-0 text-xs font-normal">• {hs.distanceFromCenter}</span>
                                )}
                              </div>

                              {hs.description && (
                                  <p className="min-h-[72px] text-xs sm:text-[13px] text-slate-600 font-medium line-clamp-4 leading-relaxed mb-3">
                                  {hs.description}
                                </p>
                              )}

                              {/* CÁC LINK LIÊN QUAN: PHONE, FACEBOOK, TIKTOK CÓ ICON THEO TỪNG LOẠI */}
                              {(phone || fb || tiktok) && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 border-t border-gray-100">
                                  {/* Phone Number */}
                                  {phone && (
                                    <a
                                      href={`tel:${phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold transition-colors border border-emerald-200 shadow-2xs"
                                      title="Gọi điện đặt phòng"
                                    >
                                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{formatPhoneNumber(phone)}</span>
                                    </a>
                                  )}

                                  {/* Facebook */}
                                  {fb && (
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
                                  )}

                                  {/* TikTok */}
                                  {tiktok && (
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
                                  )}
                                </div>
                              )}
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

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openGoogleMapsDirections(hs.latitude, hs.longitude, `${hs.district || ''} ${hs.name}`)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                                  title="Mở Google Maps để chọn điểm xuất phát"
                                >
                                  <Map className="w-3.5 h-3.5 text-blue-600" />
                                  Chỉ đường
                                </button>

                                <Link to={homestayDetailPath(hs.id)} className="shrink-0">
                                  <Button variant="primary" className="rounded-lg font-bold h-8.5 px-3.5 text-xs bg-[#10b981] hover:bg-[#03725e] shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer" disabled={hs.operationStatus === 'TEMPORARILY_CLOSED'}>
                                    {hs.operationStatus === 'TEMPORARILY_CLOSED' ? 'Xem thông tin' : 'Xem chỗ trống'}
                                  </Button>
                                </Link>
                              </div>
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
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-xs cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-[var(--color-ink-deep)]" />
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`w-10 h-10 rounded-md font-bold text-xs transition-colors cursor-pointer ${currentPage === i + 1
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-xs cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-[var(--color-ink-deep)]" />
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

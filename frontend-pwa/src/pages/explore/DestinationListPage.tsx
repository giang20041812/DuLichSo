import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchDestinations, DestinationDto, DestinationFilterParams } from '@/services/destinationService';
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
  Compass,
  Mountain,
  Ticket
} from 'lucide-react';

const SCENIC_TYPES = [
  'Ruộng bậc thang di sản',
  'Thác nước & Suối nguồn',
  'Tứ đại đỉnh đèo & Đỉnh mây',
  'Rừng sinh thái nguyên sinh',
  'Điểm săn mây & Trekking',
  'Thung lũng & Bản làng'
];

export default function DestinationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [destinations, setDestinations] = useState<DestinationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'>('recommended');
  
  const [filters, setFilters] = useState<DestinationFilterParams>(() => {
    const initial: DestinationFilterParams = {};
    const q = searchParams.get('q');
    const minRating = searchParams.get('minRating');
    const scenics = searchParams.get('scenics');
    const freeOnly = searchParams.get('freeOnly');
    
    if (q) initial.keyword = q;
    if (minRating) initial.minRating = Number(minRating);
    if (scenics) initial.scenicTypes = scenics.split(',');
    if (freeOnly === 'true') initial.maxPrice = 0;
    
    return initial;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const ITEMS_PER_PAGE = 8;

  const handleFilterChange = (updates: Partial<DestinationFilterParams>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      const newParams = new URLSearchParams(searchParams);
      if (newFilters.keyword) newParams.set('q', newFilters.keyword); else newParams.delete('q');
      if (newFilters.minRating !== undefined) newParams.set('minRating', newFilters.minRating.toString()); else newParams.delete('minRating');
      if (newFilters.maxPrice !== undefined) newParams.set('maxPrice', newFilters.maxPrice.toString()); else newParams.delete('maxPrice');
      if (newFilters.scenicTypes && newFilters.scenicTypes.length > 0) newParams.set('scenics', newFilters.scenicTypes.join(',')); else newParams.delete('scenics');
      
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

  useEffect(() => {
    const q = searchParams.get('q');
    const minRating = searchParams.get('minRating');
    const scenics = searchParams.get('scenics');
    const maxPrice = searchParams.get('maxPrice');
    
    setFilters({
      keyword: q || undefined,
      minRating: minRating ? Number(minRating) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      scenicTypes: scenics ? scenics.split(',') : undefined,
    });
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchDestinations(filters).then(data => {
      setDestinations(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filters]);

  const hasActiveFilters = Boolean(
    filters.keyword || filters.scenicTypes?.length || filters.minRating || filters.maxPrice !== undefined
  );

  const sortedDestinations = [...destinations].sort((a, b) => {
    if (sortBy === 'price_asc') return a.ticketPrice - b.ticketPrice;
    if (sortBy === 'price_desc') return b.ticketPrice - a.ticketPrice;
    if (sortBy === 'rating_desc') return b.ratingScore - a.ratingScore;
    return 0;
  });

  const paginatedDestinations = sortedDestinations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedDestinations.length / ITEMS_PER_PAGE);

  const renderFilters = () => (
    <div className="bg-white border border-gray-200/80 rounded-lg overflow-hidden shadow-xs">
      <div className="p-4 border-b border-gray-200/80 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="font-bold text-[var(--color-ink-deep)] text-base">Bộ lọc điểm đến</h3>
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
      
      {/* Loại hình danh thắng */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm flex items-center justify-between">
          <span>Loại hình cảnh quan</span>
          {filters.scenicTypes?.length ? (
            <span className="text-[10px] bg-[var(--color-primary-50)] text-[var(--color-primary)] px-2 py-0.5 rounded-full font-bold">
              {filters.scenicTypes.length} đã chọn
            </span>
          ) : null}
        </h4>
        <div className="flex flex-col gap-2.5">
          {SCENIC_TYPES.map(scenic => {
            const isChecked = filters.scenicTypes?.includes(scenic) || false;
            return (
              <label key={scenic} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isChecked}
                  onChange={(e) => {
                    const current = filters.scenicTypes || [];
                    handleFilterChange({ 
                      scenicTypes: e.target.checked 
                        ? [...current, scenic] 
                        : current.filter(c => c !== scenic) 
                    });
                  }}
                />
                <span className={`text-sm flex-1 transition-colors ${isChecked ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
                  {scenic}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Vé tham quan */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Giá vé tham quan</h4>
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
              checked={filters.maxPrice === 0}
              onChange={(e) => handleFilterChange({ maxPrice: e.target.checked ? 0 : undefined })}
            />
            <span className={`text-sm flex-1 transition-colors ${filters.maxPrice === 0 ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
              Miễn phí tham quan (0đ)
            </span>
          </label>
        </div>
      </div>

      {/* Điểm đánh giá */}
      <div className="p-4">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Điểm đánh giá</h4>
        <div className="flex flex-col gap-2.5">
          {[4.8, 4.5, 4.0].map(score => {
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
                  {score === 4.8 ? 'Kỳ vĩ (4.8+)' : score === 4.5 ? 'Tuyệt hảo (4.5+)' : 'Đẹp (4.0+)'}
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
    </div>
  );

  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--color-canvas)]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[420px] md:min-h-[380px] flex items-start md:items-center justify-center pt-[175px] md:pt-[160px] pb-10 md:pb-8">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/85 via-[#0f2d3c]/50 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-canvas)] to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white backdrop-blur-md mb-3 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-sm border border-white/20">
            <Mountain className="w-4 h-4 text-[#52d967]" />
            <span>Kỳ quan Di tích Quốc gia & Danh thắng Tây Bắc</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight mb-3 drop-shadow-md">
            Điểm Đến & Thắng Cảnh Mù Cang Chải
          </h1>
          <p className="text-white/90 text-sm md:text-base font-body max-w-2xl mx-auto drop-shadow-sm">
            Chiêm ngưỡng những kiệt tác ruộng bậc thang Mâm Xôi, Móng Ngựa, thác Pú Nhu, đèo Khau Phạ và những cánh rừng trúc bạt ngàn mây phủ.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-3 pb-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-3">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold">Danh thắng & Điểm tham quan</span>
        </div>

        {/* Top Filter Toolbar */}
        <div className="bg-white border border-gray-200/80 rounded-lg p-3.5 md:p-4 shadow-sm mb-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                Danh thắng Mù Cang Chải
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary-50)] text-[var(--color-primary)] border border-[var(--color-primary-100)]">
                  {destinations.length} địa điểm
                </span>
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Các tuyệt tác thiên nhiên nguyên bản, tọa độ GPS dẫn đường và thông tin vé tham quan
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 hover:border-gray-300 transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span className="text-xs text-gray-500 font-medium hidden md:inline">Sắp xếp:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs md:text-sm font-semibold text-[var(--color-ink-deep)] focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Gợi ý hàng đầu</option>
                  <option value="rating_desc">Đánh giá cao nhất</option>
                  <option value="price_asc">Vé: Thấp đến Cao</option>
                </select>
              </div>

              <Link 
                to="/map" 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-2xs active:scale-98"
              >
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xem</span> Bản đồ
              </Link>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-sun)]" /> Lọc nhanh:
            </span>

            {/* Quick Mâm xôi & Ruộng bậc thang */}
            <button
              onClick={() => {
                const current = filters.scenicTypes || [];
                const target = 'Ruộng bậc thang di sản';
                const has = current.includes(target);
                handleFilterChange({
                  scenicTypes: has ? current.filter(s => s !== target) : [...current, target]
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.scenicTypes?.includes('Ruộng bậc thang di sản')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Mountain className="w-3 h-3" /> Ruộng bậc thang
            </button>

            {/* Quick Thác & Suối */}
            <button
              onClick={() => {
                const current = filters.scenicTypes || [];
                const target = 'Thác nước & Suối nguồn';
                const has = current.includes(target);
                handleFilterChange({
                  scenicTypes: has ? current.filter(s => s !== target) : [...current, target]
                });
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.scenicTypes?.includes('Thác nước & Suối nguồn')
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              Thác Pú Nhu & Thác Mơ
            </button>

            {/* Quick Free Ticket */}
            <button
              onClick={() => handleFilterChange({ maxPrice: filters.maxPrice === 0 ? undefined : 0 })}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.maxPrice === 0
                  ? 'bg-[var(--color-coral)] text-white border-[var(--color-coral)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Ticket className="w-3 h-3" /> Miễn phí vé vào
            </button>

            {/* Quick 4.8+ Rating */}
            <button
              onClick={() => handleFilterChange({ minRating: filters.minRating === 4.8 ? undefined : 4.8 })}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                filters.minRating === 4.8
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-gray-50 text-[var(--color-ink)] border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <Star className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" /> Đánh giá 4.8+
            </button>
          </div>

          {/* Active Filters */}
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

              {filters.scenicTypes?.map(s => (
                <button 
                  key={s}
                  onClick={() => handleFilterChange({ scenicTypes: filters.scenicTypes?.filter(item => item !== s) })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  {s} <X className="w-3 h-3 text-[var(--color-primary)]" />
                </button>
              ))}

              {filters.maxPrice === 0 && (
                <button 
                  onClick={() => handleFilterChange({ maxPrice: undefined })}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--color-primary-100)]"
                >
                  Miễn phí vé <X className="w-3 h-3 text-[var(--color-primary)]" />
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
          <div className="flex md:hidden mb-2">
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="flex w-full items-center justify-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-[var(--color-primary)] text-sm font-bold text-[var(--color-primary)]"
            >
              <SlidersHorizontal className="w-4 h-4" /> Lọc cảnh quan
            </button>
          </div>

          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end transition-opacity">
              <div className="w-[85%] max-w-[320px] h-full bg-white overflow-y-auto flex flex-col shadow-xl">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h3 className="font-bold text-[var(--color-ink-deep)] text-lg">Lọc điểm đến</h3>
                  <button onClick={() => setMobileFilterOpen(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-800">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1">
                  {renderFilters()}
                </div>
                <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <Button variant="primary" className="w-full h-12" onClick={() => setMobileFilterOpen(false)}>
                    Xem {destinations.length} kết quả
                  </Button>
                </div>
              </div>
            </div>
          )}

          <aside className="hidden md:flex flex-col w-[300px] shrink-0 gap-4">
            {renderFilters()}
          </aside>

          <div className="flex-1 flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-[var(--color-primary)] font-bold">
                Đang tải danh lam thắng cảnh...
              </div>
            ) : (
              <div>
                {paginatedDestinations.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-xl border border-gray-200">
                    <p className="text-gray-500">Không tìm thấy địa điểm nào phù hợp.</p>
                    <button 
                      onClick={handleClearFilters}
                      className="mt-3 text-sm font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Bỏ bộ lọc để xem tất cả
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {paginatedDestinations.map((dest) => {
                      const googleMapsQuery = encodeURIComponent(
                        (dest.address || dest.district || '') + ' ' + dest.name
                      );
                      const googleMapsUrl = dest.latitude && dest.longitude 
                        ? `https://www.google.com/maps/search/?api=1&query=${dest.latitude},${dest.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

                      return (
                        <div 
                          key={dest.id} 
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative w-full h-[220px] overflow-hidden bg-gray-100">
                              <Link to={`/destinations/${dest.id}`} className="block w-full h-full">
                                <img 
                                  src={dest.coverImageUrl} 
                                  alt={dest.name} 
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                />
                              </Link>
                              
                              <button 
                                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs text-gray-500 hover:text-red-500 transition-colors"
                                aria-label="Lưu điểm đến"
                              >
                                <Heart className="w-4 h-4" />
                              </button>

                              <div className="absolute top-2.5 left-2.5">
                                <Badge className="bg-[var(--color-primary)] text-white text-[11px] font-bold rounded-sm px-2 py-0.5 shadow-xs">
                                  {dest.tagBadge || dest.scenicType}
                                </Badge>
                              </div>

                              <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                                <span>{dest.ratingScore.toString().replace('.', ',')}</span>
                                <span className="text-gray-300 text-[11px] font-normal">({dest.reviewCount} đánh giá)</span>
                              </div>
                            </div>

                            <div className="p-4 flex flex-col gap-2.5">
                              <div>
                                <Link to={`/destinations/${dest.id}`}>
                                  <h3 className="text-lg font-bold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-1">
                                    {dest.name}
                                  </h3>
                                </Link>
                                
                                <p className="text-xs text-[var(--color-muted)] flex items-center gap-1 mt-1 line-clamp-1">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)]" />
                                  <span>{dest.address || dest.district || 'Mù Cang Chải, Yên Bái'}</span>
                                </p>
                              </div>

                              {dest.description && (
                                <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                                  {dest.description}
                                </p>
                              )}

                              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
                                <Compass className="w-3.5 h-3.5" />
                                <span>{dest.scenicType}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 pt-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] text-[var(--color-muted)] block leading-tight">Vé tham quan</span>
                              <div className="text-lg font-black text-[var(--color-coral)] leading-tight">
                                {dest.ticketPrice === 0 ? 'Miễn phí' : `${dest.ticketPrice.toLocaleString('vi-VN')}đ`}
                                {dest.ticketPrice > 0 && <span className="text-[11px] text-gray-500 font-normal"> /lượt</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
                              >
                                <Map className="w-3.5 h-3.5 text-blue-600" />
                                Chỉ đường
                              </a>

                              <Link to={`/destinations/${dest.id}`}>
                                <Button 
                                  variant="primary" 
                                  className="rounded-md font-bold h-9 px-3.5 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)]"
                                >
                                  Xem chi tiết
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

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

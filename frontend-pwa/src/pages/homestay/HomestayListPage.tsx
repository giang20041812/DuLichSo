import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchHomestays, HomestayFilterParams } from '@/services/homestayService';
import { HomestayDto } from '@/types/homestay';
import SearchHub from '@/components/layout/SearchHub';
import { PriceSlider } from '@/components/ui/price-slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Heart, Check, SlidersHorizontal, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';

const AMENITIES = [
  { code: 'HOT_WATER', name: 'Nước nóng' },
  { code: 'HEATER', name: 'Sưởi / điều hòa ấm' },
  { code: 'BACKUP_POWER', name: 'Điện dự phòng' },
  { code: 'STABLE_WATER', name: 'Nước ổn định' },
  { code: 'WIFI', name: 'Wifi' },
  { code: 'PARKING', name: 'Bãi đỗ xe' },
  { code: 'RESTAURANT', name: 'Nhà hàng tại chỗ' }
];

export default function HomestayListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [homestays, setHomestays] = useState<HomestayDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Khởi tạo filters từ URL params
  const [filters, setFilters] = useState<HomestayFilterParams>(() => {
    const initialFilters: HomestayFilterParams = {};
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const amenitiesStr = searchParams.get('amenities');
    
    if (checkIn) initialFilters.checkIn = checkIn;
    if (checkOut) initialFilters.checkOut = checkOut;
    if (minPrice) initialFilters.minPrice = Number(minPrice);
    if (maxPrice) initialFilters.maxPrice = Number(maxPrice);
    if (minRating) initialFilters.minRating = Number(minRating);
    if (amenitiesStr) initialFilters.amenities = amenitiesStr.split(',');
    
    return initialFilters;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const ITEMS_PER_PAGE = 5;

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
    
    setFilters({
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      amenities: amenitiesStr ? amenitiesStr.split(',') : undefined,
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

  const paginatedHomestays = homestays.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(homestays.length / ITEMS_PER_PAGE);

  const renderFilters = () => (
    <div className="bg-white border-y md:border border-gray-200 md:rounded-lg overflow-hidden shadow-sm">
      <div className="hidden md:block p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-bold text-[var(--color-ink-deep)]">Lọc theo:</h3>
      </div>
      
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Phổ biến</h4>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" checked={true} readOnly />
            <span className="text-sm text-[var(--color-ink-deep)] flex-1">Homestay</span>
          </label>
          {AMENITIES.map(amenity => (
            <label key={amenity.code} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" 
                checked={filters.amenities?.includes(amenity.code) || false}
                onChange={(e) => {
                  const currentAmenities = filters.amenities || [];
                  handleFilterChange({ 
                    amenities: e.target.checked 
                      ? [...currentAmenities, amenity.code] 
                      : currentAmenities.filter(a => a !== amenity.code) 
                  });
                }}
              />
              <span className="text-sm text-[var(--color-ink-deep)] flex-1">{amenity.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Điểm đánh giá của khách</h4>
        <div className="flex flex-col gap-3">
          {[4.5, 4.0, 3.5].map(score => (
            <label key={score} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" 
                checked={filters.minRating === score}
                onChange={(e) => handleFilterChange({ minRating: e.target.checked ? score : undefined })}
              />
              <span className="text-sm text-[var(--color-ink-deep)] flex-1">
                {score === 4.5 ? 'Tuyệt hảo: 4.5 điểm trở lên' : score === 4.0 ? 'Rất tốt: 4.0 điểm trở lên' : 'Tốt: 3.5 điểm trở lên'}
              </span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(score) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-300'}`} />
                ))}
              </div>
            </label>
          ))}
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Ngân sách (mỗi đêm)</h4>
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
    <div className="w-full flex flex-col min-h-screen bg-[#f5f5f5]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[460px] md:min-h-[360px] flex items-start md:items-center justify-center pt-[136px] md:pt-[110px] pb-8 md:pb-6">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/80 via-[#0f2d3c]/40 to-transparent"></div>
          {/* Bottom fade to match background */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f5f5f5] to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4">
          <SearchHub />
        </div>
      </section>

      {/* Breadcrumb & Active Filters */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-4 pb-2">
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-2">
          <a href="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</a>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-medium">Homestay & Khách sạn</span>
        </div>

        {/* Quick Filters (Active tags only) */}
        <div className="flex flex-wrap gap-2">
          {(filters.amenities?.length || filters.minRating || filters.maxPrice || filters.minPrice) ? (
            <button 
              onClick={handleClearFilters}
              className="shrink-0 flex items-center gap-1 whitespace-nowrap px-4 py-2 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 text-sm font-bold shadow-sm transition-colors"
            >
              Bỏ lọc <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {filters.amenities?.map(amenityCode => {
            const name = AMENITIES.find(a => a.code === amenityCode)?.name || amenityCode;
            return (
            <button 
              key={amenityCode}
              onClick={() => handleFilterChange({ amenities: filters.amenities?.filter(a => a !== amenityCode) })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              {name} <X className="w-3.5 h-3.5" />
            </button>
            )
          })}

          {filters.minRating && (
            <button 
              onClick={() => handleFilterChange({ minRating: undefined })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              {filters.minRating === 9 ? 'Tuyệt hảo: 9+' : filters.minRating === 8 ? 'Rất tốt: 8+' : 'Tốt: 7+'} <Star className="w-3.5 h-3.5 inline text-[#f59e0b] fill-[#f59e0b]" />
              <X className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}

          {(filters.minPrice || filters.maxPrice) && (
            <button 
              onClick={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              {filters.minPrice ? `Từ ${filters.minPrice.toLocaleString('vi-VN')}đ` : ''}
              {filters.minPrice && filters.maxPrice ? ' - ' : ''}
              {filters.maxPrice ? `Đến ${filters.maxPrice.toLocaleString('vi-VN')}đ` : ''}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-4 flex flex-col md:flex-row gap-6">
        
        {/* Mobile Filter Button */}
        <div className="flex md:hidden mb-2">
          <button 
            onClick={() => setMobileFilterOpen(true)}
            className="flex w-full items-center justify-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-[var(--color-primary)] text-sm font-bold text-[var(--color-primary)]"
          >
            <SlidersHorizontal className="w-4 h-4" /> Lọc kết quả
          </button>
        </div>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end transition-opacity">
            <div className="w-[85%] max-w-[320px] h-full bg-white overflow-y-auto flex flex-col shadow-xl">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="font-bold text-[var(--color-ink-deep)] text-lg">Lọc kết quả</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-800">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1">
                {renderFilters()}
              </div>
              <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <Button variant="primary" className="w-full h-12" onClick={() => setMobileFilterOpen(false)}>
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center p-12 text-[var(--color-primary)] font-bold">Đang tải dữ liệu...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {paginatedHomestays.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-gray-200">
                  <p className="text-gray-500">Không tìm thấy homestay nào phù hợp.</p>
                </div>
              ) : paginatedHomestays.map((hs) => (
                <div key={hs.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="relative w-full md:w-[280px] h-[220px] shrink-0">
                    <Link to={`/homestays/${hs.id}`} className="block w-full h-full overflow-hidden">
                      <img src={hs.coverImageUrl} alt={hs.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </Link>
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link to={`/homestays/${hs.id}`}>
                          <h2 className="text-[20px] font-bold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors leading-tight mb-1">{hs.name}</h2>
                        </Link>
                        {hs.isGenius && (
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex gap-0.5">
                                <span className="w-3.5 h-3.5 bg-[#f59e0b] rounded-xs flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>
                                <span className="w-3.5 h-3.5 bg-[#f59e0b] rounded-xs flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>
                                <span className="w-3.5 h-3.5 bg-[#f59e0b] rounded-xs flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>
                            </div>
                            <span className="bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Genius</span>
                          </div>
                        )}
                        <div className="text-xs text-[var(--color-primary)] flex flex-wrap gap-1 items-center mt-1">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hs.name + ' ' + (hs.district || ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-dashed underline-offset-4 hover:text-[var(--color-primary-600)] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3 inline" /> {hs.district}
                          </a>
                          {hs.distanceFromCenter && <span className="text-[var(--color-muted)] no-underline">• {hs.distanceFromCenter}</span>}
                        </div>
                        {hs.description && (
                          <p className="text-[13px] text-[var(--color-muted)] mt-2 line-clamp-2 leading-relaxed">
                            {hs.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 bg-[#fefce8] px-2.5 py-1 rounded-md border border-[#f59e0b]/30 shadow-xs">
                          <Star className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b]" />
                          <span className="font-extrabold text-[#78350f] text-base leading-none">
                            {hs.ratingScore > 0 ? hs.ratingScore.toString().replace('.', ',') : '9,0'}
                          </span>
                          {hs.ratingText && (
                            <span className="text-xs font-bold text-[#b45309] hidden sm:inline">• {hs.ratingText}</span>
                          )}
                        </div>
                        {hs.reviewCount > 0 && (
                          <span className="text-xs text-[#59766e] font-medium">
                            {hs.reviewCount} đánh giá
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col md:flex-row justify-between items-end flex-1">
                      <div className="w-full md:w-auto">
                        {hs.promotionalBadge && (
                          <Badge className="bg-[var(--color-success)] hover:bg-[var(--color-success)] text-white text-xs font-bold rounded-sm px-2 py-1 mb-2">
                            {hs.promotionalBadge}
                          </Badge>
                        )}
                        <div className="text-[13px]">
                          {hs.roomType && <strong className="text-[var(--color-ink-deep)] block">{hs.roomType}: <span className="font-normal">{hs.bedInfo}</span></strong>}
                          {hs.freeCancellation && <div className="text-[var(--color-success)] font-bold mt-1 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Hủy miễn phí</div>}
                          {hs.noPrepayment && <div className="text-[var(--color-success)] font-bold mt-0.5 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Không cần thanh toán trước</div>}
                          {hs.scarcityMessage && <div className="text-[var(--color-danger)] font-medium mt-1">{hs.scarcityMessage}</div>}
                        </div>
                      </div>

                      <div className="text-right w-full md:w-auto mt-4 md:mt-0 flex flex-col justify-end">
                        {hs.priceDetails && <div className="text-xs text-[var(--color-muted)] mb-0.5">{hs.priceDetails}</div>}
                        <div className="flex items-center justify-end gap-2 mb-1">
                          {hs.originalPrice && (
                            <span className="text-[var(--color-danger)] text-sm line-through decoration-1">
                              VND {hs.originalPrice.toLocaleString('vi-VN')}
                            </span>
                          )}
                          <span className="text-[22px] font-bold text-[var(--color-ink-deep)] leading-none">
                            VND {hs.price.toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {hs.taxesAndFeesIncluded && <div className="text-[11px] text-[var(--color-muted)]">Đã bao gồm thuế và phí</div>}
                        <Link to={`/homestays/${hs.id}`}>
                          <Button variant="primary" className="w-full md:w-auto mt-3 rounded-sm font-bold h-9 px-6 text-[13px]">
                            Xem chỗ trống
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

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
  )
}

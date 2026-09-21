import { useState, useEffect } from 'react';
import { fetchHomestays, HomestayFilterParams } from '../services/homestayService';
import { HomestayDto } from '../types/homestay';
import CompactSearch from '../components/layout/CompactSearch';
import SearchHub from '../components/layout/SearchHub';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { MapPin, Heart, Check, SlidersHorizontal, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function HomestayListPage() {
  const [homestays, setHomestays] = useState<HomestayDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HomestayFilterParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const ITEMS_PER_PAGE = 5;

  const handleFilterChange = (updates: Partial<HomestayFilterParams>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

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
          {['Bao gồm bữa sáng', 'Hồ bơi', 'Bãi đậu xe miễn phí', 'Xe đưa đón sân bay', 'Phòng gym', 'Cho phép mang thú cưng'].map(amenity => (
            <label key={amenity} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" 
                checked={filters.amenities?.includes(amenity) || false}
                onChange={(e) => {
                  const currentAmenities = filters.amenities || [];
                  handleFilterChange({ 
                    amenities: e.target.checked 
                      ? [...currentAmenities, amenity] 
                      : currentAmenities.filter(a => a !== amenity) 
                  });
                }}
              />
              <span className="text-sm text-[var(--color-ink-deep)] flex-1">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Điểm đánh giá của khách</h4>
        <div className="flex flex-col gap-3">
          {[9, 8, 7].map(score => (
            <label key={score} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" 
                checked={filters.minRating === score}
                onChange={(e) => handleFilterChange({ minRating: e.target.checked ? score : undefined })}
              />
              <span className="text-sm text-[var(--color-ink-deep)] flex-1">
                {score === 9 ? 'Tuyệt hảo: 9 điểm trở lên' : score === 8 ? 'Rất tốt: 8 điểm trở lên' : 'Tốt: 7 điểm trở lên'}
              </span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < (score >= 9 ? 5 : score >= 8 ? 4 : 3) ? 'text-[var(--color-accent)] fill-[var(--color-accent)]' : 'text-gray-300'}`} />
                ))}
              </div>
            </label>
          ))}
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Ngân sách (mỗi đêm)</h4>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" 
              checked={filters.maxPrice === 500000 && filters.minPrice === undefined}
              onChange={(e) => handleFilterChange({ minPrice: undefined, maxPrice: e.target.checked ? 500000 : undefined })}
            />
            <span className="text-sm text-[var(--color-ink-deep)] flex-1">Dưới 500.000đ</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" 
              checked={filters.minPrice === 500000 && filters.maxPrice === 1000000}
              onChange={(e) => handleFilterChange({ 
                minPrice: e.target.checked ? 500000 : undefined, 
                maxPrice: e.target.checked ? 1000000 : undefined 
              })}
            />
            <span className="text-sm text-[var(--color-ink-deep)] flex-1">500.000đ - 1.000.000đ</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-[var(--color-primary)]" 
              checked={filters.minPrice === 1000000 && filters.maxPrice === undefined}
              onChange={(e) => handleFilterChange({ minPrice: e.target.checked ? 1000000 : undefined, maxPrice: undefined })}
            />
            <span className="text-sm text-[var(--color-ink-deep)] flex-1">Trên 1.000.000đ</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#f5f5f5]">
      {/* Hero Section */}
      <section className="relative w-full h-[320px] md:h-[400px] flex items-center justify-center pt-24">
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
          {/* Desktop Search (Full) */}
          <div className="hidden md:block">
            <SearchHub />
          </div>
          {/* Mobile Search (Compact) */}
          <div className="block md:hidden">
            <CompactSearch />
          </div>
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

          {filters.amenities?.map(amenity => (
            <button 
              key={amenity}
              onClick={() => handleFilterChange({ amenities: filters.amenities?.filter(a => a !== amenity) })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              {amenity} <X className="w-3.5 h-3.5" />
            </button>
          ))}

          {filters.minRating && (
            <button 
              onClick={() => handleFilterChange({ minRating: undefined })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              {filters.minRating === 9 ? 'Tuyệt hảo: 9+' : filters.minRating === 8 ? 'Rất tốt: 8+' : 'Tốt: 7+'} <Star className="w-3 h-3 inline fill-current" />
              <X className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}

          {filters.maxPrice === 500000 && filters.minPrice === undefined && (
            <button 
              onClick={() => handleFilterChange({ maxPrice: undefined })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              Dưới 500.000đ <X className="w-3.5 h-3.5" />
            </button>
          )}

          {filters.minPrice === 500000 && filters.maxPrice === 1000000 && (
            <button 
              onClick={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              500.000đ - 1.000.000đ <X className="w-3.5 h-3.5" />
            </button>
          )}

          {filters.minPrice === 1000000 && filters.maxPrice === undefined && (
            <button 
              onClick={() => handleFilterChange({ minPrice: undefined })}
              className="shrink-0 flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm font-medium shadow-sm transition-colors hover:bg-[var(--color-primary-100)]"
            >
              Trên 1.000.000đ <X className="w-3.5 h-3.5" />
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
                    <img src={hs.coverImageUrl} alt={hs.name} className="w-full h-full object-cover" />
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h2 className="text-[20px] font-bold text-[var(--color-primary)] leading-tight mb-1">{hs.name}</h2>
                        {hs.isGenius && (
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex gap-0.5">
                                <span className="w-3.5 h-3.5 bg-[var(--color-accent)] rounded-sm flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>
                                <span className="w-3.5 h-3.5 bg-[var(--color-accent)] rounded-sm flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>
                                <span className="w-3.5 h-3.5 bg-[var(--color-accent)] rounded-sm flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>
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
                      
                      <div className="flex items-start gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                          {hs.ratingText && <span className="font-bold text-[var(--color-ink-deep)] text-sm">{hs.ratingText}</span>}
                          {hs.reviewCount > 0 && <span className="text-xs text-[var(--color-muted)]">{hs.reviewCount} đánh giá</span>}
                        </div>
                        {hs.ratingScore > 0 && (
                          <div className="bg-[var(--color-primary)] text-white font-bold text-lg rounded-t-lg rounded-br-lg px-2 py-1.5 leading-none">
                            {hs.ratingScore.toString().replace('.', ',')}
                          </div>
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
                        <Button variant="primary" className="w-full md:w-auto mt-3 rounded-sm font-bold h-9 px-6 text-[13px]">
                          Xem chỗ trống
                        </Button>
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

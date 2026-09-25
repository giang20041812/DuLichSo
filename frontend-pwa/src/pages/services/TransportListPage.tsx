import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchTransports, TransportDto, TransportFilterParams } from '@/services/transportService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  SlidersHorizontal, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowUpDown, 
  RotateCcw, 
  Sparkles,
  Bus,
  Phone,
  Bike,
  Clock,
  MapPin,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Navigation2
} from 'lucide-react';

const CATEGORY_GROUPS = [
  { id: 'LOCAL_MOTO', label: 'Xe ôm bản địa vượt dốc', desc: 'Đồi Móng Ngựa, Mâm Xôi, Rừng Trúc, Ngã 3' },
  { id: 'TOUR_MOTO', label: 'Xe ôm tour & ghép đoàn', desc: 'Thuê xế bản địa trọn gói theo tour cả ngày' },
  { id: 'SELF_DRIVE', label: 'Thuê xe tự lái (Xe máy / Ô tô)', desc: 'Xe số phượt đèo Hùng Nga, Ô tô 2 cầu bán tải' },
  { id: 'INTERCITY_BUS', label: 'Xe khách & Limousine', desc: 'Hà Nội – Mù Cang Chải (Hà Trang, An Bình...)' },
  { id: 'SHARED_CAR', label: 'Xe ghép liên xã & taxi', desc: 'Kết nối TP Yên Bái, Chế Cu Nha, Nậm Có' },
];

export default function TransportListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [transports, setTransports] = useState<TransportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc'>('recommended');
  
  const [filters, setFilters] = useState<TransportFilterParams>(() => {
    const initial: TransportFilterParams = {};
    const q = searchParams.get('q');
    const groups = searchParams.get('groups');
    if (q) initial.keyword = q;
    if (groups) initial.categoryGroups = groups.split(',');
    return initial;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const ITEMS_PER_PAGE = 8;

  const handleFilterChange = (updates: Partial<TransportFilterParams>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      const newParams = new URLSearchParams(searchParams);
      if (newFilters.keyword) newParams.set('q', newFilters.keyword); else newParams.delete('q');
      if (newFilters.categoryGroups && newFilters.categoryGroups.length > 0) newParams.set('groups', newFilters.categoryGroups.join(',')); else newParams.delete('groups');
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
    const groups = searchParams.get('groups');
    setFilters({
      keyword: q || undefined,
      categoryGroups: groups ? groups.split(',') : undefined,
    });
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchTransports(filters).then(data => {
      setTransports(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filters]);

  const hasActiveFilters = Boolean(filters.keyword || filters.categoryGroups?.length);

  const sortedTransports = [...transports].sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceRef - b.priceRef;
    if (sortBy === 'price_desc') return b.priceRef - a.priceRef;
    return 0;
  });

  const paginatedTransports = sortedTransports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedTransports.length / ITEMS_PER_PAGE);

  const renderFilters = () => (
    <div className="bg-white border border-gray-200/80 rounded-lg overflow-hidden shadow-xs">
      <div className="p-4 border-b border-gray-200/80 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="font-bold text-[var(--color-ink-deep)] text-base">Phân loại di chuyển</h3>
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
      
      <div className="p-4">
        <h4 className="font-bold text-[var(--color-ink-deep)] mb-3 text-sm">Hình thức vận chuyển</h4>
        <div className="flex flex-col gap-3">
          {CATEGORY_GROUPS.map(cg => {
            const isChecked = filters.categoryGroups?.includes(cg.id) || false;
            return (
              <label key={cg.id} className="flex items-start gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 mt-0.5 rounded-xs border-gray-300 accent-[var(--color-primary)] cursor-pointer" 
                  checked={isChecked}
                  onChange={(e) => {
                    const current = filters.categoryGroups || [];
                    handleFilterChange({ 
                      categoryGroups: e.target.checked 
                        ? [...current, cg.id] 
                        : current.filter(c => c !== cg.id) 
                    });
                  }}
                />
                <div className="flex flex-col">
                  <span className={`text-sm leading-tight transition-colors ${isChecked ? 'font-bold text-[var(--color-primary)]' : 'font-medium text-[var(--color-ink)] group-hover:text-[var(--color-primary)]'}`}>
                    {cg.label}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    {cg.desc}
                  </span>
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
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2000&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/85 via-[#0f2d3c]/60 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-canvas)] to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white backdrop-blur-md mb-3 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-sm border border-white/20">
            <Bike className="w-4 h-4 text-[#3dc9d9]" />
            <span>Mạng lưới di chuyển & Xe ôm bản địa Mù Cang Chải</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight mb-3 drop-shadow-md">
            Dịch Vụ Di Chuyển & Xe Ôm Vượt Dốc
          </h1>
          <p className="text-white/90 text-sm md:text-base font-body max-w-2xl mx-auto drop-shadow-sm">
            Tra cứu đầy đủ thông tin đội xe ôm bản địa leo đồi Móng Ngựa, Mâm Xôi, thuê xe máy phượt đèo, xe 2 cầu bán tải và xe khách liên tỉnh có review thực tế.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-3 pb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-3">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold">Dịch vụ di chuyển</span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-lg p-3.5 md:p-4 shadow-sm mb-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                Các phương án di chuyển
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary-50)] text-[var(--color-primary)] border border-[var(--color-primary-100)]">
                  {transports.length} dịch vụ
                </span>
              </h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Tổng hợp giá vé khứ hồi, thời gian di chuyển, số điện thoại liên hệ và review kinh nghiệm thực tế
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 hover:border-gray-300 transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span className="text-xs text-gray-500 font-medium hidden md:inline">Sắp xếp:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'recommended' | 'price_asc' | 'price_desc')}
                  className="bg-transparent text-xs md:text-sm font-semibold text-[var(--color-ink-deep)] focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Gợi ý hàng đầu</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick filter chips theo nhóm phân loại */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-sun)]" /> Lọc nhanh:
            </span>

            <button
              onClick={() => handleFilterChange({ categoryGroups: undefined })}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                !filters.categoryGroups || filters.categoryGroups.length === 0
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-gray-100 text-[var(--color-ink)] hover:bg-gray-200'
              }`}
            >
              Tất cả ({transports.length})
            </button>

            {CATEGORY_GROUPS.map(cg => {
              const isSelected = filters.categoryGroups?.includes(cg.id);
              return (
                <button
                  key={cg.id}
                  onClick={() => {
                    const current = filters.categoryGroups || [];
                    handleFilterChange({
                      categoryGroups: isSelected 
                        ? current.filter(c => c !== cg.id) 
                        : [cg.id]
                    });
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-gray-100 text-[var(--color-ink)] hover:bg-gray-200'
                  }`}
                >
                  {cg.id === 'LOCAL_MOTO' && <Bike className="w-3.5 h-3.5 text-amber-500" />}
                  {cg.id === 'TOUR_MOTO' && <Navigation2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {cg.id === 'INTERCITY_BUS' && <Bus className="w-3.5 h-3.5 text-cyan-500" />}
                  <span>{cg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            {renderFilters()}

            {/* Khuyến cáo an toàn di chuyển */}
            <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Lưu ý khi đi xe ôm leo đồi</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                <li>Các dốc Đồi Móng Ngựa, Mâm Xôi rất đứng, chỉ nên đi xe ôm số của bà con bản địa.</li>
                <li>Thỏa thuận rõ giá khứ hồi (thường từ 60k - 100k) trước khi lên xe.</li>
                <li>Vào mùa lúa chín đông đúc, hãy kiểm tra kỹ mũ bảo hiểm và phanh xe.</li>
              </ul>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-2">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 rounded-md font-bold py-2.5 text-sm bg-white border-gray-300 shadow-xs"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
              Bộ Lọc Phân Loại ({hasActiveFilters ? 'Đang lọc' : 'Mặc định'})
            </Button>
          </div>

          {/* Mobile Filter Modal */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
              <div className="bg-white w-full max-w-xs h-full p-4 overflow-y-auto flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                    <h3 className="font-bold text-lg text-[var(--color-ink-deep)]">Bộ lọc</h3>
                    <button 
                      onClick={() => setMobileFilterOpen(false)}
                      className="p-1 text-gray-500 hover:text-black"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {renderFilters()}
                </div>
                <div className="pt-4 border-t border-gray-200 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-md text-xs font-bold" 
                    onClick={handleClearFilters}
                  >
                    Xoá lọc
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 rounded-md text-xs font-bold bg-[var(--color-primary)] text-white" 
                    onClick={() => setMobileFilterOpen(false)}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* List Area */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white rounded-lg p-4 border border-gray-100 shadow-xs animate-pulse h-80">
                    <div className="w-full h-44 bg-gray-200 rounded-md mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded-sm w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded-md w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {paginatedTransports.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-lg border border-gray-200">
                    <Bike className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Không tìm thấy dịch vụ di chuyển nào phù hợp.</p>
                    <button 
                      onClick={handleClearFilters}
                      className="mt-3 px-4 py-1.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-md"
                    >
                      Xem tất cả dịch vụ
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {paginatedTransports.map((t) => (
                      <div 
                        key={t.id} 
                        className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Box */}
                          <div className="relative w-full h-[190px] overflow-hidden bg-gray-100">
                            <Link to={`/transport/${t.id}`} className="block w-full h-full">
                              <img 
                                src={t.coverImageUrl} 
                                alt={t.name} 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                              />
                            </Link>
                            
                            {/* Badges nhóm dịch vụ */}
                            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                              <Badge className={`text-white text-[11px] font-bold rounded-sm px-2 py-0.5 shadow-xs ${
                                t.categoryGroup === 'LOCAL_MOTO' ? 'bg-amber-600' :
                                t.categoryGroup === 'TOUR_MOTO' ? 'bg-emerald-700' :
                                t.categoryGroup === 'SELF_DRIVE' ? 'bg-indigo-600' :
                                'bg-[var(--color-primary)]'
                              }`}>
                                {t.categoryGroupName}
                              </Badge>

                              <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-sm">
                                {t.vehicleType}
                              </span>
                            </div>

                            {/* Rating badge */}
                            <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                              <span>{t.ratingScore.toString().replace('.', ',')}</span>
                              <span className="text-gray-300 text-[11px] font-normal">({t.reviewCount} đánh giá)</span>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-4 flex flex-col gap-2.5">
                            <div>
                              <Link to={`/transport/${t.id}`}>
                                <h3 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-1">
                                  {t.name}
                                </h3>
                              </Link>
                              <p className="text-xs text-[var(--color-primary)] font-semibold flex items-center gap-1 mt-1">
                                <Navigation2 className="w-3.5 h-3.5 shrink-0" />
                                <span>{t.routeType}</span>
                              </p>
                            </div>

                            {/* Quãng đường & Thời gian nếu có */}
                            {(t.distance || t.duration) && (
                              <div className="flex items-center gap-3 text-[11px] text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
                                {t.distance && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
                                    <span>{t.distance}</span>
                                  </div>
                                )}
                                {t.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    <span>{t.duration}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                              {t.description}
                            </p>

                            {/* Review Box thực tế (Review tích cực & Tiêu cực / Lưu ý) */}
                            {(t.positiveReview || t.negativeReview) && (
                              <div className="mt-1 p-2 bg-emerald-50/50 rounded-md border border-emerald-100/80 flex flex-col gap-1 text-[11px]">
                                {t.positiveReview && (
                                  <div className="flex items-start gap-1.5 text-emerald-800">
                                    <ThumbsUp className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">{t.positiveReview}</span>
                                  </div>
                                )}
                                {t.negativeReview && (
                                  <div className="flex items-start gap-1.5 text-amber-800">
                                    <ThumbsDown className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">Lưu ý: {t.negativeReview}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Contact Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
                              {t.contacts && t.contacts.length > 0 ? (
                                t.contacts.map((contact, cIdx) => (
                                  <a
                                    key={cIdx}
                                    href={contact.channel === 'PHONE' ? `tel:${contact.value.replace(/[^0-9+]/g, '')}` : '#'}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>Hotline: {contact.value}</span>
                                  </a>
                                ))
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">Liên hệ trực tiếp tại điểm đón hoặc homestay</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Card */}
                        <div className="p-4 pt-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-[var(--color-muted)] block leading-tight">Mức giá tham khảo</span>
                            <div className="text-base md:text-lg font-black text-[var(--color-coral)] leading-tight">
                              {t.priceRef.toLocaleString('vi-VN')}đ
                              <span className="text-[11px] text-gray-500 font-normal">
                                {t.priceUnitNote ? ` /${t.priceUnitNote}` : ' /lượt'}
                              </span>
                            </div>
                          </div>

                          <Link to={`/transport/${t.id}`}>
                            <Button 
                              variant="primary" 
                              className="rounded-md font-bold h-9 px-4 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)]"
                            >
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6 mb-4">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 bg-white"
                    >
                      <ChevronLeft className="w-5 h-5 text-[var(--color-ink-deep)]" />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-md font-bold text-sm transition-colors ${
                            currentPage === i + 1 ? 'bg-[var(--color-primary)] text-white shadow-xs' : 'text-[var(--color-ink-deep)] bg-white hover:bg-gray-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 bg-white"
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

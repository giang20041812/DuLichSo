import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchUtilityServices, UtilityServiceDto, UtilityFilterParams } from '@/services/utilityService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  RotateCcw,
  Map,
  Camera,
  Phone,
  Bike
} from 'lucide-react';

export default function UtilityListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [services, setServices] = useState<UtilityServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc'>('recommended');

  const [activeTab, setActiveTab] = useState<'ALL' | 'PHOTO' | 'RENTAL'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'photo') return 'PHOTO';
    if (tab === 'rental') return 'RENTAL';
    return 'ALL';
  });

  const [filters, setFilters] = useState<UtilityFilterParams>(() => {
    const initial: UtilityFilterParams = {};
    const q = searchParams.get('q');
    if (q) initial.keyword = q;
    initial.kind = activeTab;
    return initial;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const handleTabChange = (newTab: 'ALL' | 'PHOTO' | 'RENTAL') => {
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'PHOTO') newParams.set('tab', 'photo');
    else if (newTab === 'RENTAL') newParams.set('tab', 'rental');
    else newParams.delete('tab');
    setSearchParams(newParams, { replace: true });

    setFilters(prev => ({ ...prev, kind: newTab }));
    setCurrentPage(1);
  };

  const handleFilterChange = (updates: Partial<UtilityFilterParams>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      const newParams = new URLSearchParams(searchParams);
      if (newFilters.keyword) newParams.set('q', newFilters.keyword); else newParams.delete('q');
      setSearchParams(newParams, { replace: true });
      return newFilters;
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    handleTabChange('ALL');
    setFilters({ kind: 'ALL' });
    setSearchParams(new URLSearchParams(), { replace: true });
    setCurrentPage(1);
  };

  useEffect(() => {
    const q = searchParams.get('q');
    const tab = searchParams.get('tab');
    const tabKind = tab === 'photo' ? 'PHOTO' : tab === 'rental' ? 'RENTAL' : 'ALL';
    setActiveTab(tabKind);
    setFilters({
      keyword: q || undefined,
      kind: tabKind,
    });
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchUtilityServices(filters).then(data => {
      setServices(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filters]);

  const hasActiveFilters = Boolean(filters.keyword || activeTab !== 'ALL');

  const sortedServices = [...services].sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceRef - b.priceRef;
    if (sortBy === 'price_desc') return b.priceRef - a.priceRef;
    return 0;
  });

  const paginatedServices = sortedServices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedServices.length / ITEMS_PER_PAGE);

  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--color-canvas)]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[420px] md:min-h-[380px] flex items-start md:items-center justify-center pt-[175px] md:pt-[160px] pb-10 md:pb-8">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2000&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2d3c]/85 via-[#0f2d3c]/50 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-canvas)] to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight mb-3 drop-shadow-md">
            Dịch Vụ & Tiện Ích Du Lịch
          </h1>
          <p className="text-white/90 text-sm md:text-base font-body max-w-2xl mx-auto drop-shadow-sm">
            Thuê xe máy phượt, lều trại dã ngoại cắm trại Mâm Xôi & chụp ảnh trang phục dân tộc, flycam chuyên nghiệp.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-3 pb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-3">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold">Dịch vụ & Tiện ích</span>
        </div>

        {/* Category Tabs: Photo & Rental */}
        <div className="flex items-center gap-2 mb-4 p-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs max-w-md">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-md transition-all ${activeTab === 'ALL'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-gray-600 hover:text-[var(--color-primary)]'
              }`}
          >
            Tất cả dịch vụ
          </button>
          <button
            onClick={() => handleTabChange('PHOTO')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${activeTab === 'PHOTO'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-gray-600 hover:text-[var(--color-primary)]'
              }`}
          >
            <Camera className="w-4 h-4" />
            Chụp ảnh & Trang phục
          </button>
          <button
            onClick={() => handleTabChange('RENTAL')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${activeTab === 'RENTAL'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-gray-600 hover:text-[var(--color-primary)]'
              }`}
          >
            <Bike className="w-4 h-4" />
            Thuê xe & Lều trại
          </button>
        </div>

        {/* Top Filter Bar */}
        <div className="bg-white border border-gray-200/80 rounded-lg p-3.5 md:p-4 shadow-sm mb-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                {activeTab === 'PHOTO' ? 'Dịch vụ Chụp ảnh & Trang phục' : activeTab === 'RENTAL' ? 'Dịch vụ Thuê xe máy & Lều dã ngoại' : 'Dịch vụ & Tiện ích bản địa'}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary-50)] text-[var(--color-primary)] border border-[var(--color-primary-100)]">
                  {services.length} điểm cung cấp
                </span>
              </h2>
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
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
              </div>

              <Link
                to="/map"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-2xs"
              >
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xem</span> Bản đồ
              </Link>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-dashed border-gray-200">
              <span className="text-xs font-semibold text-[var(--color-muted)] mr-1">Đang áp dụng:</span>
              {filters.keyword && (
                <button
                  onClick={() => { handleFilterChange({ keyword: undefined }); }}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold"
                >
                  Từ khóa: "{filters.keyword}" <X className="w-3 h-3" />
                </button>
              )}
              {activeTab !== 'ALL' && (
                <button
                  onClick={() => handleTabChange('ALL')}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold"
                >
                  {activeTab === 'PHOTO' ? 'Chụp ảnh & Trang phục' : 'Thuê xe & Lều trại'} <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={handleClearFilters}
                className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-md border border-red-200 bg-red-50 text-red-600 text-xs font-bold"
              >
                <RotateCcw className="w-3 h-3" /> Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Content List */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center p-12 text-[var(--color-primary)] font-bold">
              Đang tải dịch vụ tiện ích...
            </div>
          ) : (
            <div>
              {paginatedServices.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-gray-200">
                  <p className="text-gray-500">Không tìm thấy dịch vụ nào phù hợp.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedServices.map((srv) => {
                    const googleMapsQuery = encodeURIComponent(
                      (srv.address || '') + ' ' + srv.name
                    );
                    const googleMapsUrl = srv.latitude && srv.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${srv.latitude},${srv.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

                    return (
                      <div
                        key={srv.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative w-full h-[200px] overflow-hidden bg-gray-100">
                            <Link to={`/services/${srv.id}`} className="block w-full h-full">
                              <img
                                src={srv.coverImageUrl}
                                alt={srv.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </Link>

                            <div className="absolute top-2.5 left-2.5">
                              <Badge className="bg-[var(--color-primary)] text-white text-[11px] font-bold rounded-sm px-2 py-0.5 shadow-xs">
                                {srv.categoryBadge}
                              </Badge>
                            </div>

                            <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                              <span>{srv.ratingScore.toString().replace('.', ',')}</span>
                              <span className="text-gray-300 text-[11px] font-normal">({srv.reviewCount} đánh giá)</span>
                            </div>
                          </div>

                          <div className="p-4 flex flex-col gap-2.5">
                            <div>
                              <Link to={`/services/${srv.id}`}>
                                <h3 className="text-base font-bold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors leading-snug line-clamp-1">
                                  {srv.name}
                                </h3>
                              </Link>
                              <p className="text-xs text-[var(--color-muted)] flex items-center gap-1 mt-1 line-clamp-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)]" />
                                <span>{srv.address || 'Mù Cang Chải'}</span>
                              </p>
                            </div>

                            <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                              {srv.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 hover:bg-blue-100"
                              >
                                <Map className="w-3 h-3 text-blue-600" />
                                Maps
                              </a>

                              {srv.contacts && srv.contacts.length > 0 ? (
                                srv.contacts.map((contact, cIdx) => (
                                  <a
                                    key={cIdx}
                                    href={contact.channel === 'PHONE' ? `tel:${contact.value.replace(/[^0-9+]/g, '')}` : '#'}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{contact.value}</span>
                                  </a>
                                ))
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-[var(--color-muted)] block leading-tight">Giá thuê từ</span>
                            <div className="text-base font-black text-[var(--color-coral)] leading-tight">
                              {srv.priceRef.toLocaleString('vi-VN')}đ
                              <span className="text-[11px] text-gray-500 font-normal"> /{srv.priceUnitNote || 'ngày'}</span>
                            </div>
                          </div>

                          <Link to={`/services/${srv.id}`}>
                            <Button
                              variant="primary"
                              className="rounded-md font-bold h-8 px-3 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)]"
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

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 mb-4">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-50 bg-white"
                  >
                    <ChevronLeft className="w-5 h-5 text-[var(--color-ink-deep)]" />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-full font-medium text-sm transition-colors ${currentPage === i + 1 ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-ink-deep)] bg-white hover:bg-gray-100'
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-50 bg-white"
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
  );
}

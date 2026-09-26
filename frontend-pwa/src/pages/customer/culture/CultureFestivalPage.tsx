import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFestivals, FestivalDto } from '@/services/festivalService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  MapPin,
  ShieldAlert,
  ChevronRight,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function CultureFestivalPage() {
  const [festivals, setFestivals] = useState<FestivalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<'ALL' | 'CURRENT' | 'SPRING' | 'AUTUMN'>('ALL');

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    setLoading(true);
    fetchFestivals().then(data => {
      setFestivals(data);
      setLoading(false);
    });
  }, []);

  // Các lễ hội thích hợp theo mùa / thời điểm hiện tại
  const currentSeasonFestivals = festivals.filter(f => f.isSuitableByTime || f.isCurrentSeason);

  // Lọc theo tabs & keyword
  const filteredFestivals = festivals.filter(f => {
    let matchSeason = true;
    if (activeSeason === 'CURRENT') {
      matchSeason = Boolean(f.isSuitableByTime || f.isCurrentSeason);
    } else if (activeSeason === 'AUTUMN') {
      matchSeason = f.slug === 'mua-vang-kham-pha-ruong-bac-thang' || f.slug === 'mung-com-moi' || f.seasonNote.toLowerCase().includes('tháng 9') || f.seasonNote.toLowerCase().includes('tháng 10');
    } else if (activeSeason === 'SPRING') {
      matchSeason = f.slug === 'hoa-to-day' || f.slug === 'festival-khen-mong' || f.slug === 'gau-tao' || f.seasonNote.toLowerCase().includes('xuân') || f.seasonNote.toLowerCase().includes('tháng 12');
    }

    return matchSeason;
  });

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


          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display text-white tracking-tight mb-3 drop-shadow-md">
            Trải Nghiệm & Lễ Hội Văn Hóa
          </h1>
          <p className="text-white/90 text-sm md:text-base font-body max-w-2xl mx-auto drop-shadow-sm">
            Trải nghiệm trọn vẹn hồn cốt rẻo cao Tây Bắc: Tiếng khèn Mông gọi bạn, Lễ hội Mùa Vàng ruộng bậc thang, phong tục Mừng Cơm Mới và sắc thắm hoa Tớ Dày.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 pt-3 pb-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-5">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold">Trải nghiệm & Lễ hội bản địa</span>
        </div>

        {/* 🌟 1. BANNER GỢI Ý ĐẶC BIỆT CHO THỜI ĐIỂM HIỆN TẠI (THÁNG 9 - 10) 🌟 */}
        {currentSeasonFestivals.length > 0 && (
          <div className="mb-10 p-5 md:p-6 bg-gradient-to-br from-[#10b981]/10 via-[#06b6d4]/10 to-amber-500/10 rounded-xl border border-[#10b981]/30 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs uppercase tracking-wider mb-2 shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  Gợi ý nổi bật nhất Tháng {currentMonth}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[var(--color-ink-deep)]">
                  Lễ Hội Thích Hợp Theo Mùa
                </h2>

              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-primary)] bg-white px-3 py-1.5 rounded-md border border-[var(--color-primary)]/20 shadow-2xs">
                  🌾 Mùa vàng thu hoạch
                </span>
              </div>
            </div>

            {/* List Featured Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSeasonFestivals.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 border border-[#10b981]/25 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge className="bg-[var(--color-coral)] text-white text-xs font-bold px-2.5 py-0.5 rounded-sm">
                        {item.highlightTag}
                      </Badge>
                      <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {item.timeRange}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[var(--color-ink-deep)] mb-1.5">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed mb-2.5">
                      {item.coreValue}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] mb-2.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    {/* Hiển thị thời gian phù hợp */}
                    <div className="mb-2 py-1 px-2.5 rounded-sm bg-[#edfbf7] border border-[#10b981]/20 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Thời gian phù hợp:</span>
                      <span className="font-bold text-[#10b981]">
                        {item.suitableDateStart && item.suitableDateEnd
                          ? `${item.suitableDateStart.split('-').reverse().slice(0, 2).join('/')} – ${item.suitableDateEnd.split('-').reverse().slice(0, 2).join('/')}`
                          : (item.suitableDateEnd ? `Đến ${item.suitableDateEnd.split('-').reverse().slice(0, 2).join('/')}` : item.timeRange)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Khuyến nghị nên đi ngay
                    </span>
                    <Link to={`/festivals/${item.slug}`}>
                      <button className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-coral)] flex items-center gap-0.5 cursor-pointer">
                        Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs by Season */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <button
              onClick={() => setActiveSeason('ALL')}
              className={`px-3.5 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${activeSeason === 'ALL'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              Tất cả lễ hội ({festivals.length})
            </button>
            <button
              onClick={() => setActiveSeason('CURRENT')}
              className={`px-3.5 py-1.5 rounded-md text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all ${activeSeason === 'CURRENT'
                ? 'bg-[var(--color-coral)] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Đang vào mùa ({currentSeasonFestivals.length})
            </button>
            <button
              onClick={() => setActiveSeason('AUTUMN')}
              className={`px-3.5 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${activeSeason === 'AUTUMN'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              Lễ hội Mùa Thu & Lúa Chín
            </button>
            <button
              onClick={() => setActiveSeason('SPRING')}
              className={`px-3.5 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${activeSeason === 'SPRING'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              Lễ hội Mùa Xuân & Đón Tết
            </button>
          </div>
        </div>

        {/* List of Festivals */}
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[var(--color-primary)] font-bold">
            Đang tải dữ liệu lễ hội văn hóa...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredFestivals.map((fest) => (
              <div
                key={fest.id}
                id={`festival-${fest.slug}`}
                className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row"
              >
                {/* Image */}
                <div className="relative w-full lg:w-[380px] h-[240px] lg:h-auto shrink-0 bg-gray-100 overflow-hidden">
                  <Link to={`/festivals/${fest.slug}`} className="block w-full h-full">
                    <img
                      src={fest.coverImageUrl}
                      alt={fest.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
                    <Badge className="bg-[var(--color-primary)] text-white text-xs font-bold rounded-sm px-2.5 py-1 shadow-xs">
                      {fest.highlightTag}
                    </Badge>
                    {(fest.isSuitableByTime || fest.isCurrentSeason) && (
                      <Badge className="bg-amber-500 text-white text-xs font-bold rounded-sm px-2.5 py-0.5 shadow-xs flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-white" /> Thích hợp theo mùa
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-primary)] mb-2">
                      <span className="flex items-center gap-1 bg-[var(--color-primary-50)] px-2.5 py-1 rounded-md border border-[var(--color-primary-100)]">
                        <Calendar className="w-3.5 h-3.5" /> {fest.seasonNote}
                      </span>
                      {fest.suitableDateStart && fest.suitableDateEnd && (
                        <span className="flex items-center gap-1 bg-[#edfbf7] text-[#10b981] px-2.5 py-1 rounded-md border border-[#10b981]/20 font-bold">
                          Đẹp nhất: {fest.suitableDateStart.split('-').reverse().slice(0, 2).join('/')} – {fest.suitableDateEnd.split('-').reverse().slice(0, 2).join('/')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[var(--color-muted)]">
                        <MapPin className="w-3.5 h-3.5 text-[var(--color-coral)]" /> {fest.location}
                      </span>
                    </div>

                    <Link to={`/festivals/${fest.slug}`}>
                      <h3 className="text-xl md:text-2xl font-bold text-[var(--color-ink-deep)] hover:text-[var(--color-primary)] transition-colors mb-2">
                        {fest.name}
                      </h3>
                    </Link>

                    <p className="text-sm font-medium text-[var(--color-ink)] mb-3 leading-relaxed">
                      {fest.coreValue}
                    </p>

                    {/* Suitable experiences */}
                    <div className="bg-gray-50 rounded-md p-3 mb-3 border border-gray-100 text-xs md:text-sm text-[var(--color-muted)]">
                      <span className="font-bold text-[var(--color-ink-deep)] block mb-1">
                        ✨ Trải nghiệm gợi ý:
                      </span>
                      {fest.suitableExperience}
                    </div>

                    {/* Etiquette & Notice */}
                    <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50/80 p-2.5 rounded-md border border-amber-200/80">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Lưu ý văn hóa bản địa: </span>
                        <span>{fest.etiquetteDont}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activities tags & action */}
                  <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {fest.activities.map((act, aIdx) => (
                        <span key={aIdx} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
                          #{act}
                        </span>
                      ))}
                    </div>

                    <Link to={`/festivals/${fest.slug}`}>
                      <Button
                        variant="primary"
                        className="rounded-md font-bold h-9 px-4 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] flex items-center gap-1 shadow-xs"
                      >
                        Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

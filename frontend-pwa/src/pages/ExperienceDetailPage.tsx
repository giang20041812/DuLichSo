import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  User,
  MapPin,
  ExternalLink,
  Navigation,
  Phone,
  Clock,
  Calendar,
  Users,
  Gift,
  Languages,
  BookOpen,
  Info,
  Home,
  Compass
} from 'lucide-react';
import { ExperienceDetail } from '../types/itinerary';
import { fetchExperienceDetail } from '../services/experienceService';

export default function ExperienceDetailPage() {
  const { slug = 'trai-nghiem-gia-com-nep-tu-le' } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [activeTab, setActiveTab] = useState('experience');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetchExperienceDetail(slug).then((data) => {
      if (isMounted) setExperience(data);
    });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('vi-VN').format(experience.priceRef);

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24 text-slate-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center font-black text-sm">
              TB
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#0F3E2E] block leading-tight">
                TÂY BẮC TRAILS
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">
                Chạm vào nguyên bản
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              aria-label="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center font-bold text-xs"
              aria-label="Tài khoản"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QA Scenario Simulator Bar */}
        <div className="max-w-xl mx-auto mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium text-slate-700 flex items-center gap-1">
            🧪 KỊCH BẢN THỬ NGHIỆM QA (PHASE 1)
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-mono text-[10px] font-bold">
            QA-EXP-01
          </span>
        </div>

        {/* Filter Pills */}
        <div className="max-w-xl mx-auto mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'experience', label: 'Trải nghiệm (Mặc định)' },
            { id: 'attraction', label: 'Điểm tham quan' },
            { id: 'food', label: 'Ẩm thực' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0F3E2E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-3 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-700 hover:text-slate-950 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại danh sách kết quả (Kèm bộ lọc Tú Lệ)
          </button>
        </div>

        {/* Hero Image Card */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-2xl shadow-sm bg-slate-900">
          <img
            src={experience.images[activeImageIndex] || experience.images[0]}
            alt={experience.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Top badge */}
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-emerald-700/90 text-white text-xs font-semibold px-3 py-1 shadow-sm backdrop-blur-xs">
              🌾 {experience.categoryTag}
            </span>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="rounded-full bg-black/60 text-white text-xs font-medium px-2.5 py-1 backdrop-blur-xs">
              {activeImageIndex + 1}/{experience.images.length} ảnh
            </span>
            <button
              type="button"
              className="rounded-full bg-white/90 hover:bg-white text-emerald-950 text-xs font-semibold px-3 py-1.5 shadow-sm transition-all cursor-pointer"
            >
              Xem thư viện
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-3 gap-2">
          {experience.images.slice(1, 4).map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx + 1)}
              className="h-20 rounded-xl overflow-hidden cursor-pointer opacity-85 hover:opacity-100 transition-opacity"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Title & Badges */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              {experience.subCategoryTag}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              {experience.seasonalTag}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {experience.title}
          </h1>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{experience.address}</span>
            </div>

            <Link
              to={`/homestay/ban-lim-mong-eco-lodge/map`}
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold pl-5 text-xs"
            >
              Xem vị trí trên bản đồ vùng (UC-03) <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Price Card */}
        <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              MỨC GIÁ THAM KHẢO
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-600 border border-slate-200">
              {experience.priceBadge}
            </span>
          </div>

          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {formattedPrice}đ
            </span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium ml-1">
              / {experience.priceUnit}
            </span>
          </div>

          <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-500 pt-1 border-t border-sky-200/50">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{experience.priceNotice}</p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/homestay/ban-lim-mong-eco-lodge/map')}
            className="py-3 px-4 rounded-xl bg-[#0F3E2E] hover:bg-[#16503c] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            Chỉ đường (UC-03)
          </button>

          <a
            href={`tel:${experience.hostPhone.replace(/\D/g, '')}`}
            className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Phone className="w-4 h-4 text-emerald-700" />
            Gọi nghệ nhân
          </a>
        </div>

        <hr className="border-slate-200/70" />

        {/* Introduction Narrative */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h2>Giới thiệu trải nghiệm</h2>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {experience.description}
          </div>
        </section>

        <hr className="border-slate-200/70" />

        {/* Practical Details */}
        <section className="space-y-3 pt-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            📋 Thông tin chi tiết thực tế
          </h2>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4 text-emerald-600" /> Thời lượng:
              </span>
              <span className="font-semibold text-slate-800 text-right">{experience.duration}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4 text-emerald-600" /> Mùa vụ lý tưởng:
              </span>
              <span className="font-semibold text-slate-800 text-right">{experience.bestSeason}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <Users className="w-4 h-4 text-emerald-600" /> Đối tượng:
              </span>
              <span className="font-semibold text-slate-800 text-right">{experience.targetAudience}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <Gift className="w-4 h-4 text-emerald-600" /> Tặng phẩm mang về:
              </span>
              <span className="font-semibold text-slate-800 text-right">{experience.giftIncluded}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <Languages className="w-4 h-4 text-emerald-600" /> Ngôn ngữ:
              </span>
              <span className="font-semibold text-slate-800 text-right">{experience.languages}</span>
            </div>
          </div>
        </section>

        <hr className="border-slate-200/70" />

        {/* Location & Access Section */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              📍 Vị trí & Tiếp cận
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">{experience.locationTag}</span>
          </div>

          <div
            onClick={() => navigate('/homestay/ban-lim-mong-eco-lodge/map')}
            className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer group bg-sky-50 flex items-center justify-center"
          >
            <div className="flex flex-col items-center">
              <span className="p-2.5 rounded-full bg-orange-600 text-white shadow-md">
                <MapPin className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-slate-900 mt-1.5">{experience.locationName}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800 block mb-0.5">🚗 Hướng dẫn di chuyển:</strong>
            {experience.accessNote}
          </div>

          <button
            type="button"
            onClick={() => navigate('/homestay/ban-lim-mong-eco-lodge/map')}
            className="w-full py-2.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-sky-700" />
            Mở vị trí đầy đủ trên bản đồ (UC-03)
          </button>
        </section>

        <hr className="border-slate-200/70" />

        {/* Direct Contact Host Card */}
        <section className="space-y-2.5 pt-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            ☎️ Kênh liên hệ trực tiếp
          </h2>
          <p className="text-xs text-slate-500">
            Thông tin liên hệ được công bố minh bạch để hỗ trợ du khách tiếp cận dịch vụ bản địa nhanh nhất.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{experience.hostName}</h3>
              <p className="text-xs text-slate-500">{experience.hostRole}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{experience.hostWorkingHours}</p>
            </div>

            <a
              href={`tel:${experience.hostPhone.replace(/\D/g, '')}`}
              className="w-10 h-10 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center hover:bg-[#16503c] transition-colors shrink-0 shadow-xs"
              aria-label="Gọi điện"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Heritage Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-6 pb-4">
          Tây Bắc Trails • Bảo tồn di sản qua du lịch sinh thái cộng đồng
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav aria-label="Điều hướng chính" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2.5 flex items-center justify-around text-[11px] text-slate-500">
        <Link to="/" className="flex flex-col items-center gap-0.5 hover:text-emerald-800">
          <Home className="w-4 h-4" /> Trang chủ
        </Link>
        <Link to="/homestays" className="flex flex-col items-center gap-0.5 hover:text-emerald-800">
          <Compass className="w-4 h-4" /> Khám phá
        </Link>
        <Link to="/design-system" className="flex flex-col items-center gap-0.5 hover:text-emerald-800">
          <Info className="w-4 h-4" /> Về chúng tôi
        </Link>
      </nav>
    </div>
  );
}

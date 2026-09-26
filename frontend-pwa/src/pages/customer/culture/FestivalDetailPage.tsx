import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchFestivalByIdOrSlug } from '@/services/festivalService';
import { FestivalDto } from '@/types/festival';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VietmapView from '@/components/map/VietmapView';
import type { VietmapMarkerItem } from '@/types/integrations/vietmap';
import {
  Calendar,
  MapPin,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Share2,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  Map as MapIcon,
  Compass,
  Check,
  Flame,
  Info
} from 'lucide-react';

// Tọa độ GPS chuẩn cho từng lễ hội tại Mù Cang Chải
const FESTIVAL_COORDINATES: Record<string, { lat: number; lng: number; address: string; accessNote: string }> = {
  'mua-vang-kham-pha-ruong-bac-thang': {
    lat: 21.8485,
    lng: 104.0912,
    address: 'Đồi Mâm Xôi, Xã La Pán Tẩn, Huyện Mù Cang Chải, Tỉnh Yên Bái',
    accessNote: 'Từ Quốc lộ 32 rẽ vào đường liên thôn La Pán Tẩn. Ô tô đỗ tại bãi xe chân đồi, tiếp tục đi bộ hoặc xe ôm bản địa 1.5km lên đồi.'
  },
  'mung-com-moi': {
    lat: 21.7512,
    lng: 104.3184,
    address: 'Bản Lìm Mông, Xã Tú Lệ & Bản Sáng Nhù, Mù Cang Chải, Yên Bái',
    accessNote: 'Đường bê tông liên bản ô tô vào tận nơi. Có bãi đỗ xe tại nhà văn hóa cộng đồng bản.'
  },
  'festival-khen-mong': {
    lat: 21.8588,
    lng: 104.0845,
    address: 'Sân vận động Trung tâm Huyện Mù Cang Chải, Thị trấn Mù Cang Chải, Yên Bái',
    accessNote: 'Ngay trung tâm thị trấn, mặt đường Quốc lộ 32, chỗ đỗ xe máy và ô tô thuận tiện.'
  },
  'hoa-to-day': {
    lat: 21.7925,
    lng: 104.1432,
    address: 'Khu vực rừng hoa Tớ Dày, Xã Púng Luông & Nậm Khắt, Mù Cang Chải, Yên Bái',
    accessNote: 'Đi theo đường tỉnh lộ hướng Nậm Khắt, đường dốc thoai thoải, cảnh quan hai bên đường ngập tràn sắc hoa đỏ thắm.'
  },
  'gau-tao': {
    lat: 21.8650,
    lng: 104.1120,
    address: 'Đồi Gầu Tào truyền thống, Xã Chế Cu Nha, Huyện Mù Cang Chải, Tỉnh Yên Bái',
    accessNote: 'Đường đèo bê tông dốc vừa phải, ô tô gầm cao hoặc xe máy di chuyển dễ dàng.'
  }
};

// Cung cấp bộ PRO - CON - TIP đặc thù sâu sắc cho từng lễ hội
const FESTIVAL_HIGHLIGHTS: Record<string, {
  pros: string[];
  cons: string[];
  tips: string[];
}> = {
  'mua-vang-kham-pha-ruong-bac-thang': {
    pros: [
      'Khung cảnh Di tích Quốc gia ruộng bậc thang vào mùa lúa chín vàng rực rỡ nhất trong năm.',
      'Nhiều hoạt động biểu diễn dù lượn Bay Trên Mùa Vàng tại đèo Khau Phạ cực kỳ mãn nhãn.',
      'Cơ hội gặp gỡ cộng đồng nghệ nhân Mông, Thái và thưởng thức nông sản mới gặt.'
    ],
    cons: [
      'Lượng khách đổ về rất đông vào các dịp cuối tuần tháng 9 - 10, đường QL32 có thể ùn tắc cục bộ.',
      'Đoạn đường xe ôm lên Mâm Xôi dốc đứng và nhiều bụi vào những ngày hanh khô.'
    ],
    tips: [
      'Nên chụp ảnh vào khung giờ vàng 06:30 - 08:30 sáng khi sương sớm còn vờn trên ngọn lúa.',
      'Nên mặc trang phục màu nổi (trắng, đỏ, cam) để tương phản tuyệt đẹp với nền lúa chín vàng.',
      'Chuẩn bị sẵn tiền mặt lẻ để thanh toán phí xe ôm hoặc mua nông sản người dân.'
    ]
  },
  'mung-com-moi': {
    pros: [
      'Không khí đầm ấm, mộc mạc và đậm chất văn hóa gia đình truyền thống vùng cao Tây Bắc.',
      'Được thưởng thức cốm non nếp nương rang giã tay thơm ngào ngạt vừa ra lò.',
      'Trải nghiệm lối sống sinh hoạt mến khách nguyên bản của đồng bào người Thái Trắng và Mông.'
    ],
    cons: [
      'Lễ hội mang tính gia đình và thôn bản, không diễn ra cố định một ngày mà rải rác theo vụ lúa gặt.',
      'Cần có sự dẫn dắt của người dân địa phương hoặc homestay để tham gia đúng nghi lễ trang trọng.'
    ],
    tips: [
      'Hãy thử tự tay cầm chày giã cốm cùng các cô gái Thái để cảm nhận trọn vẹn sự tinh tế của phong tục.',
      'Mua cốm tươi gói lá dong mang về làm quà trong ngày là lựa chọn tuyệt vời nhất.'
    ]
  },
  'festival-khen-mong': {
    pros: [
      'Hội tụ những nghệ nhân thổi khèn điêu luyện nhất khắp các bản làng rẻo cao Tây Bắc.',
      'Các điệu múa khèn quay người, nhảy bước tinh xảo thể hiện tinh thần thượng võ và tài hoa của chàng trai Mông.',
      'Có không gian trưng bày và workshop hướng dẫn kỹ thuật chế tác nhạc cụ truyền thống.'
    ],
    cons: [
      'Khu vực sân khấu trung tâm vào tối khai mạc rất đông khán giả, cần đến sớm để có vị trí quan sát tốt.',
      'Âm thanh nhạc cụ vang rộn cả ngày, du khách nhạy cảm với tiếng ồn nên chọn vị trí ngồi thoáng.'
    ],
    tips: [
      'Gặp gỡ nghệ nhân tại các gian hàng trưng bày vào buổi sáng để được nghe diễn giải chi tiết về các thế khèn.',
      'Tôn trọng không gian biểu diễn, không đi cắt ngang qua trước mặt các nghệ nhân đang thực hiện bài khèn thi tài.'
    ]
  },
  'hoa-to-day': {
    pros: [
      'Cảnh sắc hoa Tớ Dày (đào rừng hoang dã) bung nở đỏ rực cả sườn núi báo hiệu mùa xuân về.',
      'Không gian thanh bình, ít xô bồ hơn mùa lúa chín, khí hậu mùa đông se lạnh trong lành.',
      'Các bản làng người Mông bước vào ngày tết cổ truyền với nhiều trò chơi dân gian rực rỡ sắc màu.'
    ],
    cons: [
      'Mùa hoa nở phụ thuộc nhiều vào thời tiết rét buốt, thời gian rộ hoa chỉ kéo dài từ 2 đến 3 tuần.',
      'Buổi chiều mùa đông sương mù buông sớm, nhiệt độ giảm sâu cần chuẩn bị áo ấm dày.'
    ],
    tips: [
      'Cung đường xã Nậm Khắt và đồi Púng Luông là hai tọa độ có mật độ hoa nở dày và rực rỡ nhất.',
      'Kết hợp chụp ảnh trang phục dân tộc Mông hoa trên nền cành Tớ Dày sẽ cho ra những bức ảnh rất thơ mộng.'
    ]
  },
  'gau-tao': {
    pros: [
      'Lễ hội mùa xuân linh thiêng nhất của đồng bào Mông cầu phúc, cầu mùa màng bội thu và con cái bình an.',
      'Nhiều trò chơi dân gian truyền thống sôi động: bắn nỏ, đánh cù, ném pao, đẩy gậy.',
      'Màu sắc trang phục truyền thống của phụ nữ Mông rực rỡ sắc thổ cẩm trong ngày hội lớn.'
    ],
    cons: [
      'Địa điểm diễn ra ở bãi đồi cao lộng gió, đường đi dốc và đất đỏ nếu gặp sương mù ẩm ướt.',
      'Cần chú ý giữ gìn trật tự và không làm ồn trong thời gian thầy cúng thực hiện nghi lễ dựng cây nêu.'
    ],
    tips: [
      'Hãy tham gia ném pao cùng thanh niên bản địa để trải nghiệm trọn vẹn nét văn hóa giao duyên thanh lịch.',
      'Không bước qua hoặc động chạm vào cây nêu thiêng giữa bãi hội.'
    ]
  }
};

export default function FestivalDetailPage() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const identifier = slug || id || 'mua-vang-kham-pha-ruong-bac-thang';
  const navigate = useNavigate();

  const [festival, setFestival] = useState<FestivalDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchFestivalByIdOrSlug(identifier)
      .then((data) => {
        setFestival(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [identifier]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-[var(--color-canvas)]">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-[var(--color-primary)]">Đang tải thông tin chi tiết lễ hội...</p>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-[var(--color-canvas)] px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-ink-deep)] mb-2">Không tìm thấy thông tin lễ hội</h2>
        <p className="text-sm text-[var(--color-muted)] max-w-md mb-6">
          Lễ hội bạn đang tìm kiếm có thể đã được cập nhật hoặc không tồn tại. Vui lòng quay lại danh sách để khám phá.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/experiences')}
          className="rounded-md font-bold px-5"
        >
          Quay lại danh sách lễ hội
        </Button>
      </div>
    );
  }

  // Tọa độ & thông tin vị trí
  const geoInfo = FESTIVAL_COORDINATES[festival.slug] || {
    lat: 21.8588,
    lng: 104.0845,
    address: festival.location || 'Huyện Mù Cang Chải, Tỉnh Yên Bái',
    accessNote: 'Đường giao thông liên xã thuận tiện, di chuyển bằng xe máy hoặc ô tô.'
  };

  // Highlights Pro / Con / Tip
  const highlights = FESTIVAL_HIGHLIGHTS[festival.slug] || {
    pros: [
      'Trải nghiệm không gian văn hóa bản địa nguyên bản, đậm chất truyền thống vùng cao Tây Bắc.',
      'Cảnh sắc thiên nhiên núi rừng kỳ vĩ, con người thân thiện, mến khách.',
      'Nhiều hoạt động sinh hoạt cộng đồng giàu giá trị nhân văn.'
    ],
    cons: [
      'Địa hình vùng cao có nhiều dốc cua uốn lượn, cần người có kinh nghiệm lái xe đèo dốc.',
      'Thời tiết buổi sớm và ban đêm se lạnh, cần chuẩn bị thêm áo khoác ấm.'
    ],
    tips: [
      'Nên khởi hành sớm vào buổi sáng để đón ánh bình minh tuyệt đẹp trên núi rừng.',
      'Tôn trọng phong tục tập quán và giữ gìn vệ sinh môi trường tự nhiên nơi diễn ra lễ hội.'
    ]
  };

  // Markers cho VietMap
  const markers: VietmapMarkerItem[] = [
    {
      id: festival.id,
      name: festival.name,
      latitude: geoInfo.lat,
      longitude: geoInfo.lng,
      address: geoInfo.address,
      coverImageUrl: festival.coverImageUrl,
      isMain: true,
      kind: 'ATTRACTION',
      tagText: festival.highlightTag || 'Lễ hội bản địa'
    }
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: festival.name,
        text: festival.coreValue,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${geoInfo.lat},${geoInfo.lng}`;

  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--color-canvas)]">
      {/* Top Breadcrumb & Navigation - ghim ngay dưới Header khi scroll */}
      <div className="bg-white border-b border-gray-200/80 sticky top-[88px] md:top-[92px] z-20 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] truncate">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors shrink-0">
              Trang chủ
            </Link>
            <span>/</span>
            <Link to="/experiences" className="hover:text-[var(--color-primary)] transition-colors shrink-0">
              Văn hóa & Lễ hội
            </Link>
            <span>/</span>
            <span className="text-[var(--color-ink-deep)] font-semibold truncate">
              {festival.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSaved(!saved)}
              className={`p-2 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                saved
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title="Lưu lễ hội"
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-red-600' : ''}`} />
              <span className="hidden sm:inline">{saved ? 'Đã lưu' : 'Lưu lại'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Chia sẻ thông tin"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Đã chép link' : 'Chia sẻ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-[360px] md:h-[440px] overflow-hidden bg-gray-900">
        <img
          src={festival.coverImageUrl}
          alt={festival.name}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2d3c] via-[#0f2d3c]/40 to-black/30" />

        <div className="absolute inset-x-0 bottom-0 max-w-[1240px] mx-auto px-4 md:px-8 pb-8 flex flex-col justify-end text-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded-sm shadow-xs">
              {festival.highlightTag || 'Di Sản Văn Hóa'}
            </Badge>
            {(festival.isSuitableByTime || festival.isCurrentSeason) && (
              <Badge className="bg-[var(--color-coral)] text-white text-xs font-bold px-3 py-1 rounded-sm shadow-xs flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-white" />
                Thời Điểm Đẹp Nhất Đang Diễn Ra
              </Badge>
            )}
            <span className="text-xs font-semibold bg-white/20 backdrop-blur-md px-3 py-1 rounded-sm border border-white/20">
              {festival.regionName || 'Mù Cang Chải, Yên Bái'}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white drop-shadow-md mb-2">
            {festival.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-white/90">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[var(--color-sun)] shrink-0" />
              <span>Thời gian: <strong>{festival.timeRange || festival.seasonNote}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--color-coral)] shrink-0" />
              <span>{festival.location || geoInfo.address}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-[1240px] mx-auto w-full px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3): Content, Pro/Con/Tip, Street Map */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* 1. Core Cultural Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)]">
                Ý Nghĩa Lịch Sử & Bản Sắc Cốt Lõi
              </h2>
            </div>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed font-body whitespace-pre-line mb-4">
              {festival.coreValue}
            </p>

            <div className="p-3.5 bg-gray-50 rounded-md border border-gray-100 text-xs md:text-sm text-gray-600 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--color-ink-deep)]">Chu kỳ thời gian mùa vụ: </span>
                <span>{festival.seasonNote}</span>
              </div>
            </div>
          </div>

          {/* 2. Suitable Experiences & Activities */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <Compass className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)]">
                Trải Nghiệm Đề Xuất & Hoạt Động Tiêu Biểu
              </h2>
            </div>

            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">
              {festival.suitableExperience}
            </div>

            {festival.activities && festival.activities.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                  Các hoạt động chính:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {festival.activities.map((act, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[var(--color-primary-50)] text-[var(--color-primary)] text-xs font-bold rounded-md border border-[var(--color-primary-100)] flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      #{act}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. PRO - TIP - CON (Kinh nghiệm thực tế chuyên sâu) */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                  Đánh Giá & Kinh Nghiệm Thực Tế
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Tổng hợp ưu điểm, lưu ý chuẩn bị và kinh nghiệm bản địa để chuyến đi trọn vẹn nhất
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PRO: Ưu điểm */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-md p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2.5">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span>Ưu điểm (Pro)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-emerald-900 leading-relaxed">
                    {highlights.pros.map((item, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CON: Hạn chế / Điểm lưu ý */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-md p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs uppercase tracking-wider mb-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Lưu ý (Con)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-rose-900 leading-relaxed">
                    {highlights.cons.map((item, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* TIP: Pro tip từ người bản địa */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-md p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Mẹo hay (Pro Tip)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-amber-900 leading-relaxed">
                    {highlights.tips.map((item, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Lưu ý văn hóa & Điều cấm kỵ (Etiquette & Don'ts) */}
          <div className="bg-amber-50/60 border border-amber-300/80 rounded-lg p-5 md:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
              <h3 className="text-base md:text-lg font-bold">
                Quy Tắc Văn Hóa & Điều Không Nên Làm (Etiquette & Don'ts)
              </h3>
            </div>
            <p className="text-xs md:text-sm text-amber-950 font-medium leading-relaxed mb-3">
              {festival.etiquetteDont}
            </p>
            <div className="text-xs text-amber-800 bg-white/70 rounded-md p-3 border border-amber-200">
              💡 <strong>Lời khuyên du lịch có trách nhiệm:</strong> Luôn xin phép trước khi chụp ảnh người cao tuổi, không xả rác tại các khu di tích danh thắng và giữ gìn cảnh quan thiên nhiên sạch đẹp.
            </div>
          </div>

          {/* 5. Tọa độ & Bản đồ VietMap */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-[var(--color-primary)]" />
                  Vị Trí & Bản Đồ Đi Lại (VietMap)
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Định vị chính xác không gian tổ chức trên nền tảng bản đồ số VietMap
                </p>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-100 transition-colors shrink-0"
              >
                <span>Chỉ đường trên Google Maps</span>
              </a>
            </div>

            {/* Address Info */}
            <div className="mb-4 p-3.5 bg-gray-50 rounded-md border border-gray-200/80 text-xs md:text-sm text-gray-700 flex flex-col gap-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--color-ink-deep)]">Địa chỉ tổ chức: </span>
                  <span>{geoInfo.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-gray-200/60">
                <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--color-ink-deep)]">Chỉ dẫn tiếp cận: </span>
                  <span className="text-gray-600">{geoInfo.accessNote}</span>
                </div>
              </div>
            </div>

            {/* VietMap Interactive Container */}
            <div className="w-full h-[320px] md:h-[400px] rounded-lg overflow-hidden border border-gray-200 relative">
              <VietmapView
                centerLat={geoInfo.lat}
                centerLng={geoInfo.lng}
                zoomLevel={14}
                markers={markers}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Summary Card & Useful Guide */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Summary Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs sticky top-16">
            <h3 className="text-base font-bold text-[var(--color-ink-deep)] pb-3 mb-3 border-b border-gray-100">
              Tóm Tắt Lễ Hội
            </h3>

            <div className="flex flex-col gap-3.5 text-xs md:text-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                <span className="text-gray-500">Trạng thái:</span>
                <span className="font-bold text-[var(--color-primary)]">
                  {festival.isCurrentSeason ? 'Đang vào mùa nở rộ' : 'Theo lịch thường niên'}
                </span>
              </div>

              <div className="flex justify-between items-start pb-2.5 border-b border-gray-50">
                <span className="text-gray-500 shrink-0">Thời gian tổ chức:</span>
                <span className="font-semibold text-right text-[var(--color-ink-deep)]">
                  {festival.timeRange || festival.seasonNote}
                </span>
              </div>

              <div className="flex justify-between items-start pb-2.5 border-b border-gray-50">
                <span className="text-gray-500 shrink-0">Khu vực:</span>
                <span className="font-semibold text-right text-[var(--color-ink-deep)]">
                  {festival.regionName || 'Mù Cang Chải'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                <span className="text-gray-500">Giá vé tham gia:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  Miễn phí mở cửa tự do
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Loại hình:</span>
                <span className="font-semibold text-gray-800">Di sản văn hóa phi vật thể</span>
              </div>
            </div>

            {/* Quick Action Buttons (NO booking) */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="primary"
                  className="w-full rounded-md font-bold h-10 bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] text-xs flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  Chỉ đường tới điểm lễ hội
                </Button>
              </a>

              <Link to="/experiences">
                <Button
                  variant="outline"
                  className="w-full rounded-md font-bold h-10 border-gray-200 hover:bg-gray-50 text-gray-700 text-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Xem tất cả lễ hội khác
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

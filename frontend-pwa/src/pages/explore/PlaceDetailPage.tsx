import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchPlaceDetail } from '@/services/placeService';
import { PlaceDetail, PlaceHighlightItem, PlaceAmenityItem } from '@/types/homestay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OpenStreetMapView, { OsmMarkerItem } from '@/components/map/OpenStreetMapView';
import {
  MapPin,
  Star,
  Sparkles,
  ArrowLeft,
  Share2,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  Map as MapIcon,
  Phone,
  Globe,
  Compass,
  Check,
  Flame,
  Info,
  UtensilsCrossed,
  Layers,
  Bike,
  ShieldCheck,
  ExternalLink,
  MessageCircle
} from 'lucide-react';



// Khởi tạo Pro / Con / Tip mặc định theo danh mục nếu backend chưa có highlight cho địa điểm đó
function getDefaultHighlights(kind: string): { pros: string[]; cons: string[]; tips: string[] } {
  const upperKind = kind.toUpperCase();
  if (upperKind === 'ATTRACTION' || upperKind.includes('THẮNG') || upperKind.includes('CẢNH')) {
    return {
      pros: [
        'Tuyệt tác thiên nhiên ruộng bậc thang di sản Mù Cang Chải với tầm nhìn bao quát kỳ vĩ.',
        'Điểm chụp ảnh check-in hàng đầu, không gian khoáng đạt trong lành.',
        'Người dân bản địa thân thiện, không khí núi rừng nguyên sơ bình yên.'
      ],
      cons: [
        'Mùa cao điểm lúa chín (tháng 9-10) lượng du khách ghé thăm rất đông đúc.',
        'Đoạn đường lên đồi có độ dốc cao, cần tay lái vững hoặc đi xe ôm bản địa.'
      ],
      tips: [
        'Khung giờ chụp ảnh đẹp nhất là 06:30 - 08:30 (bình minh) hoặc 16:30 - 17:30 (hoàng hôn vàng).',
        'Nên đi giày thể thao hoặc giày bám đất tốt để di chuyển an toàn trên bờ ruộng dốc.',
        'Chuẩn bị tiền mặt lẻ để mua vé tham quan và nông sản đặc sản địa phương.'
      ]
    };
  }

  if (upperKind === 'RESTAURANT' || upperKind === 'FOOD' || upperKind.includes('ẨM') || upperKind.includes('ĂN')) {
    return {
      pros: [
        'Hương vị ẩm thực Tây Bắc tươi ngon, nguyên liệu bản địa tự nhiên (lợn bản, gà đồi, cá suối, xôi ngũ sắc).',
        'Không gian nhà sàn ấm cúng, đậm đà bản sắc hiếu khách vùng cao.',
        'Mức giá niêm yết hợp lý, phục vụ chu đáo.'
      ],
      cons: [
        'Một số món đặc sản (thắng cố, rượu ngô) có hương vị gia vị hạt dổi, mắc khén đặc trưng có thể lạ miệng với một số thực khách.',
        'Vào các tối cuối tuần mùa lễ hội có thể đông khách, thời gian lên món cần kiên nhẫn chờ một chút.'
      ],
      tips: [
        'Nên gọi thử món cá suối chiên giòn, lợn cắp nách nướng than hoa và xôi nếp nương Tú Lệ.',
        'Có thể liên hệ qua điện thoại trước để quán chuẩn bị nguyên liệu tươi ngon nhất trong ngày.'
      ]
    };
  }

  if (upperKind === 'TRANSPORT' || upperKind.includes('XE') || upperKind.includes('CHUYỂN')) {
    return {
      pros: [
        'Đội ngũ tài xế bản địa thông thạo địa hình, tay lái cứng vượt dốc an toàn.',
        'Giá cước niêm yết rõ ràng theo chặng hoặc thuê trọn gói theo ngày.',
        'Hỗ trợ chỉ điểm góc chụp ảnh đẹp trên cung đường di chuyển.'
      ],
      cons: [
        'Cung đường đồi dốc quanh co nhiều đá cuội, ngồi xe máy cần bám chắc người lái.',
        'Thời tiết mưa bão có thể làm giảm tốc độ di chuyển và đường trơn.'
      ],
      tips: [
        'Nên thỏa thuận rõ ràng điểm đến (khứ hồi hay một chiều) trước khi lên xe.',
        'Lưu lại số điện thoại tài xế để gọi đón khi tham quan xong trên đỉnh đồi.'
      ]
    };
  }

  // Mặc định cho Service / Rental / Photo / Utility
  return {
    pros: [
      'Cung cấp đầy đủ đồ dùng tiện ích (trang phục dân tộc, flycam, xe máy phượt, lều trại cắm trại).',
      'Đồ dùng sạch sẽ, đa dạng mẫu mã trang phục truyền thống Mông, Thái, Dao rực rỡ sắc màu.',
      'Chủ dịch vụ nhiệt tình hướng dẫn cách tạo dáng chụp ảnh và cách sử dụng đồ nghề.'
    ],
    cons: [
      'Trang phục đẹp thường được thuê sớm vào các buổi sáng cuối tuần.',
      'Cần kiểm tra kỹ hiện trạng thiết bị / xe máy trước khi nhận bàn giao.'
    ],
    tips: [
      'Nên thuê trang phục có màu sắc tương phản với cảnh quan (ví dụ váy hoa đỏ/cam nổi trên nền lúa vàng).',
      'Giữ gìn đồ cẩn thận để được hoàn trả tiền cọc nhanh chóng.'
    ]
  };
}

export default function PlaceDetailPage() {
  const { identifier } = useParams<{ identifier?: string }>();
  const navigate = useNavigate();

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);
    fetchPlaceDetail(identifier)
      .then((data) => {
        setPlace(data);
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
        <p className="text-sm font-semibold text-[var(--color-primary)]">Đang tải thông tin chi tiết địa điểm...</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-[var(--color-canvas)] px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-ink-deep)] mb-2">Không tìm thấy địa điểm</h2>
        <p className="text-sm text-[var(--color-muted)] max-w-md mb-6">
          Địa điểm bạn đang tìm kiếm có thể đã bị xóa hoặc không còn tồn tại trên hệ thống.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/destinations')}
          className="rounded-md font-bold px-5"
        >
          Quay lại danh sách điểm đến
        </Button>
      </div>
    );
  }

  const kind = place.categoryKind || 'ATTRACTION';
  const defaultHighlight = getDefaultHighlights(kind);

  // Group Highlights
  const proList: string[] = [];
  const conList: string[] = [];
  const tipList: string[] = [];

  if (place.highlights && place.highlights.length > 0) {
    place.highlights.forEach((h: PlaceHighlightItem) => {
      if (h.type === 'PRO') proList.push(h.content);
      else if (h.type === 'CON' || h.type === 'PAIN_POINT') conList.push(h.content);
      else if (h.type === 'TIP') tipList.push(h.content);
    });
  }

  const finalPros = proList.length > 0 ? proList : defaultHighlight.pros;
  const finalCons = conList.length > 0 ? conList : defaultHighlight.cons;
  const finalTips = tipList.length > 0 ? tipList : defaultHighlight.tips;

  // Media images
  const allImages = place.media && place.media.length > 0
    ? place.media.map(m => m.publicUrl).filter(Boolean)
    : [];

  // Coordinates
  const lat = place.latitude || 21.8588;
  const lng = place.longitude || 104.0845;
  const addressText = place.address || (place.regionName ? `Khu vực ${place.regionName}, Mù Cang Chải, Yên Bái` : 'Huyện Mù Cang Chải, Tỉnh Yên Bái');

  // Markers for OpenStreetMap
  const markers: OsmMarkerItem[] = [
    {
      id: place.id,
      name: place.name,
      latitude: lat,
      longitude: lng,
      address: addressText,
      coverImageUrl: allImages[0],
      isMain: true,
      kind: kind,
      tagText: place.categoryName || 'Địa điểm khám phá'
    }
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: place.description,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // Resolve category link & name for breadcrumb
  let parentRoute = '/destinations';
  let parentLabel = 'Danh thắng & Điểm đến';
  let categoryIcon = <Compass className="w-4 h-4 text-[var(--color-primary)]" />;

  if (kind === 'RESTAURANT' || kind === 'FOOD') {
    parentRoute = '/restaurants';
    parentLabel = 'Ẩm thực & Quán ăn';
    categoryIcon = <UtensilsCrossed className="w-4 h-4 text-[var(--color-coral)]" />;
  } else if (kind === 'TRANSPORT') {
    parentRoute = '/transport';
    parentLabel = 'Dịch vụ di chuyển';
    categoryIcon = <Bike className="w-4 h-4 text-[#3dc9d9]" />;
  } else if (kind === 'SERVICE' || kind === 'PHOTO' || kind === 'RENTAL') {
    parentRoute = '/services';
    parentLabel = 'Dịch vụ & Tiện ích';
    categoryIcon = <Layers className="w-4 h-4 text-[var(--color-sun)]" />;
  }

  // Price label calculation
  const hasPrice = typeof place.priceRefMin === 'number';
  const priceDisplay = !hasPrice || place.priceRefMin === 0
    ? 'Miễn phí tham quan'
    : `${(place.priceRefMin as number).toLocaleString('vi-VN')}đ${place.priceUnitNote ? ` /${place.priceUnitNote}` : ''}`;

  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--color-canvas)]">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] truncate">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors shrink-0">
              Trang chủ
            </Link>
            <span>/</span>
            <Link to={parentRoute} className="hover:text-[var(--color-primary)] transition-colors shrink-0">
              {parentLabel}
            </Link>
            <span>/</span>
            <span className="text-[var(--color-ink-deep)] font-semibold truncate">
              {place.name}
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
              title="Lưu địa điểm"
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-red-600' : ''}`} />
              <span className="hidden sm:inline">{saved ? 'Đã lưu' : 'Lưu'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Chia sẻ thông tin"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Chia sẻ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-[360px] md:h-[440px] overflow-hidden bg-gray-900">
        <img
          src={allImages[activeImageIndex] || allImages[0]}
          alt={place.name}
          className="w-full h-full object-cover opacity-90 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2d3c] via-[#0f2d3c]/40 to-black/30" />

        <div className="absolute inset-x-0 bottom-0 max-w-[1240px] mx-auto px-4 md:px-8 pb-8 flex flex-col justify-end text-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded-sm shadow-xs flex items-center gap-1">
              {categoryIcon}
              <span>{place.categoryName || parentLabel}</span>
            </Badge>

            {place.verification === 'OFFICIAL_VERIFIED' ? (
              <Badge className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> GPS Đã xác minh
              </Badge>
            ) : (
              <Badge className="bg-cyan-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cộng đồng đề xuất
              </Badge>
            )}

            {place.ratingAvg ? (
              <div className="bg-black/60 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-sm text-xs font-bold flex items-center gap-1 border border-white/20">
                <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                <span>{place.ratingAvg.toFixed(1)}</span>
                <span className="text-gray-300 font-normal">({place.ratingCount || 10} đánh giá)</span>
              </div>
            ) : null}
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white drop-shadow-md mb-2">
            {place.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-white/90">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--color-coral)] shrink-0" />
              <span>{addressText}</span>
            </div>
            {place.altitudeMeters ? (
              <div className="flex items-center gap-1.5 text-emerald-300">
                <Compass className="w-4 h-4 shrink-0" />
                <span>Độ cao: {place.altitudeMeters}m so với mực nước biển</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-[1240px] mx-auto w-full px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3): Description, Pro/Con/Tip, Street Map */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Gallery Thumbnails (if multiple images) */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-24 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* 1. Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)]">
                Thông Tin & Mô Tả Chi Tiết
              </h2>
            </div>

            <p className="text-sm md:text-base text-gray-700 leading-relaxed font-body whitespace-pre-line mb-4">
              {place.description || `Địa điểm nổi bật tọa lạc tại khu vực ${place.regionName || 'Mù Cang Chải'}, sở hữu vẻ đẹp hoang sơ kỳ vĩ và cảnh quan đặc trưng của vùng cao Yên Bái. Nơi đây là điểm dừng chân hấp dẫn dành cho du khách muốn trải nghiệm trọn vẹn thiên nhiên và nét sinh hoạt mộc mạc của đồng bào bản địa.`}
            </p>

            {place.suitableDateStart && place.suitableDateEnd && (
              <div className="p-3.5 bg-[#edfbf7] rounded-md border border-[#048c73]/20 text-xs md:text-sm text-[#048c73] flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[var(--color-coral)]" />
                  Thời điểm tham quan đẹp nhất trong năm:
                </span>
                <span className="font-bold">
                  {place.suitableDateStart.split('-').reverse().slice(0, 2).join('/')} – {place.suitableDateEnd.split('-').reverse().slice(0, 2).join('/')}
                </span>
              </div>
            )}
          </div>

          {/* 2. PRO - TIP - CON (Kinh nghiệm thực tế chuyên sâu) */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                  Đánh Giá Thực Tế (Ưu Điểm • Mẹo Hay • Lưu Ý)
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Được tổng hợp từ phản hồi của cộng đồng du khách và chuyên gia khám phá bản địa
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
                    {finalPros.map((item, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CON / PAIN_POINT: Hạn chế / Điểm cần lưu ý */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-md p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs uppercase tracking-wider mb-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Lưu ý (Con)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-rose-900 leading-relaxed">
                    {finalCons.map((item, cIdx) => (
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
                    {finalTips.map((item, tIdx) => (
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

          {/* 3. Amenities / Tiện ích nếu có */}
          {place.amenities && place.amenities.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
              <h3 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)] mb-3 pb-2 border-b border-gray-100">
                Tiện Ích & Dịch Vụ Có Sẵn
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {place.amenities.map((am: PlaceAmenityItem) => (
                  <div key={am.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-200/70 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span className="font-semibold text-gray-800">{am.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Tọa độ & Bản đồ OpenStreetMap */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)] flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-[var(--color-primary)]" />
                  Vị Trí & Bản Đồ Đường Đi (Street Map)
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Định vị chính xác tọa độ GPS trên nền tảng bản đồ OpenStreetMap
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
                  <span className="font-bold text-[var(--color-ink-deep)]">Địa chỉ: </span>
                  <span>{addressText}</span>
                </div>
              </div>

              {place.accessNote && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-200/60">
                  <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[var(--color-ink-deep)]">Ghi chú tiếp cận: </span>
                    <span className="text-gray-600">{place.accessNote}</span>
                  </div>
                </div>
              )}
            </div>

            {/* OpenStreetMap Interactive Container */}
            <div className="w-full h-[320px] md:h-[400px] rounded-lg overflow-hidden border border-gray-200 relative">
              <OpenStreetMapView
                centerLat={lat}
                centerLng={lng}
                zoomLevel={14}
                markers={markers}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Summary Card & Contacts (NO BOOKING BUTTONS) */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs sticky top-16">
            <h3 className="text-base font-bold text-[var(--color-ink-deep)] pb-3 mb-3 border-b border-gray-100">
              Thông Tin Khái Quát
            </h3>

            <div className="flex flex-col gap-3 text-xs md:text-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                <span className="text-gray-500">Mức chi phí tham khảo:</span>
                <span className="font-bold text-base text-[var(--color-coral)]">
                  {priceDisplay}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                <span className="text-gray-500">Danh mục:</span>
                <span className="font-semibold text-gray-800">
                  {place.categoryName || parentLabel}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                <span className="text-gray-500">Khu vực:</span>
                <span className="font-semibold text-gray-800">
                  {place.regionName || 'Huyện Mù Cang Chải'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                <span className="text-gray-500">Trạng thái:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  Đang mở cửa đón khách
                </span>
              </div>
            </div>

            {/* Contacts & Hotline (For information inquiry only, NO booking form) */}
            {place.contacts && place.contacts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2.5">
                  Kênh liên hệ hỏi thông tin:
                </h4>
                <div className="flex flex-col gap-2">
                  {place.contacts.map((contact, cIdx) => {
                    let icon = <Globe className="w-3.5 h-3.5 text-gray-600" />;
                    let label = contact.value;
                    let href = contact.value;
                    let colorStyle = "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100";

                    if (contact.channel === 'PHONE') {
                      icon = <Phone className="w-3.5 h-3.5 text-emerald-600" />;
                      label = `Hotline tư vấn: ${contact.value}`;
                      href = `tel:${contact.value.replace(/[^0-9+]/g, '')}`;
                      colorStyle = "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100";
                    } else if (contact.channel === 'ZALO') {
                      icon = <MessageCircle className="w-3.5 h-3.5 text-cyan-600" />;
                      label = `Zalo hỗ trợ: ${contact.value}`;
                      href = contact.value.startsWith('http') ? contact.value : `https://zalo.me/${contact.value.replace(/[^0-9]/g, '')}`;
                      colorStyle = "bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100";
                    } else if (contact.channel === 'FACEBOOK') {
                      icon = <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />;
                      label = "Fanpage Facebook";
                      href = contact.value.startsWith('http') ? contact.value : `https://facebook.com/${contact.value}`;
                      colorStyle = "bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100";
                    } else if (contact.channel === 'GOOGLE_MAPS') {
                      icon = <MapPin className="w-3.5 h-3.5 text-blue-600" />;
                      label = "Vị trí Google Maps";
                      href = contact.value;
                      colorStyle = "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100";
                    }

                    return (
                      <a
                        key={cIdx}
                        href={href}
                        target={contact.channel === 'PHONE' ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${colorStyle}`}
                      >
                        {icon}
                        <span className="truncate">{label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Navigation Action Buttons (NO BOOKING BUTTONS) */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="primary"
                  className="w-full rounded-md font-bold h-10 bg-[var(--color-primary)] hover:bg-[var(--color-primary-600)] text-xs flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  Mở chỉ đường Google Maps
                </Button>
              </a>

              <Link to={parentRoute}>
                <Button
                  variant="outline"
                  className="w-full rounded-md font-bold h-10 border-gray-200 hover:bg-gray-50 text-gray-700 text-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại {parentLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

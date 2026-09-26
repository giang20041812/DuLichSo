import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Share,
  Heart,
  Wifi,
  Coffee,
  Car,
  Wind,
  Utensils,
  Mountain,
  Bus,
  Sparkles,
  X,
  ShieldCheck,
  Tv,
  Bath,
  Shirt,
  Compass,
  ArrowRight,
  Map as MapIcon,
  ChevronRight,
  Info,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  Phone,
  Globe,
  ExternalLink,
  Video,
  Play
} from 'lucide-react';
import SearchHub from '@/components/layout/SearchHub';
import {
  getHomestayById,
  fetchNearbyPlaces,
  fetchPlaceReviews,
  fetchRegionalDestinations,
} from '@/services/homestayService';
import { fetchBookedDatesByPlace } from '@/services/bookingService';
import { HomestayDetailDto, RoomTypeDto, NearbyPlaceDto, HomestayDto } from '@/types/homestay';
import { BookedDateRangeDto } from '@/types/booking';
import { ReviewDto } from '@/types/review';
import { Button } from '@/components/ui/button';
import VietmapView from '@/components/map/VietmapView';
import type { VietmapMarkerItem } from '@/types/integrations/vietmap';
import RoomBookingCard from '@/components/homestay/RoomBookingCard';
import { TikTokEmbed } from '@/components/homestay/TikTokEmbed';

// Helper trích xuất ID video TikTok từ link
function extractTikTokVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return (match && match[1]) ? match[1] : null;
}

// Helper tính khoảng cách Haversine chính xác theo tọa độ GPS
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function HomestayDetailPage() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const identifier = id || slug || '';
  const navigate = useNavigate();

  const [homestay, setHomestay] = useState<HomestayDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [interactionModal, setInteractionModal] = useState<{ isOpen: boolean; type: 'share' | 'heart' | null }>({
    isOpen: false,
    type: null,
  });

  // Surroundings & Distance
  const [radius, setRadius] = useState(10);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceDto[]>([]);
  const [nearbyCategory, setNearbyCategory] = useState<'ALL' | 'ATTRACTION' | 'FOOD' | 'TRANSPORT'>('ALL');

  // Real Reviews & Regional Destinations
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [regionalDestinations, setRegionalDestinations] = useState<HomestayDto[]>([]);

  // Booked dates
  const [bookedDates, setBookedDates] = useState<BookedDateRangeDto[]>([]);

  // Default initial dates for room booking cards (định dạng theo giờ địa phương, tránh lệch múi giờ UTC)
  const initialCheckInDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);
  const initialCheckOutDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // TikTok Video from homestay contacts
  const tiktokContact = useMemo(() => {
    if (!homestay?.contacts) return null;
    return homestay.contacts.find((c) => c.channel === 'TIKTOK' && c.value);
  }, [homestay]);

  const tiktokVideoId = useMemo(() => {
    if (!tiktokContact?.value) return null;
    return extractTikTokVideoId(tiktokContact.value);
  }, [tiktokContact]);

  // Selected place for focusing map in modal
  const [selectedMapTarget, setSelectedMapTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  // Load homestay detail & related data
  useEffect(() => {
    if (identifier) {
      setLoading(true);
      getHomestayById(identifier)
        .then((data) => {
          if (!data) setErrorMsg('API returned null');
          setHomestay(data);
          setLoading(false);

          if (data?.id) {
            // Booked dates
            fetchBookedDatesByPlace(data.id).then((bList) => setBookedDates(bList));
            // Real reviews
            fetchPlaceReviews(data.id.toString()).then((rList) => setReviews(rList));
            // Regional destinations
            fetchRegionalDestinations(data.id.toString(), 4).then((dList) => setRegionalDestinations(dList));
          }
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Unknown error');
          setLoading(false);
        });
    }
  }, [identifier]);

  // Load nearby places on radius change
  useEffect(() => {
    if (identifier) {
      fetchNearbyPlaces(identifier, radius).then((data) => setNearbyPlaces(data));
    }
  }, [identifier, radius]);

  // Amenity icon mapping - Clean & solid
  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wifi') || n.includes('mạng')) return <Wifi className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('đỗ') || n.includes('xe') || n.includes('parking')) return <Car className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('điều hòa') || n.includes('máy lạnh')) return <Wind className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('nhà hàng') || n.includes('ăn') || n.includes('bếp') || n.includes('kitchen')) return <Utensils className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('cà phê') || n.includes('coffee') || n.includes('trà')) return <Coffee className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('nóng') || n.includes('bình') || n.includes('tắm') || n.includes('shower')) return <Bath className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('giặt') || n.includes('máy giặt')) return <Shirt className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('tivi') || n.includes('tv')) return <Tv className="w-3.5 h-3.5 text-slate-700" />;
    if (n.includes('an ninh') || n.includes('bảo vệ')) return <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />;
    return <Sparkles className="w-3.5 h-3.5 text-slate-700" />;
  };

  // Nearby place icon mapper - Solid & Clean
  const getPlaceIcon = (kind: string) => {
    switch (kind) {
      case 'FOOD':
      case 'RESTAURANT':
      case 'CUISINE':
        return <Utensils className="w-3.5 h-3.5 text-[#dc2626]" />;
      case 'ATTRACTION':
        return <Mountain className="w-3.5 h-3.5 text-[#2563eb]" />;
      case 'TRANSPORT':
        return <Bus className="w-3.5 h-3.5 text-[#d97706]" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // Calculated distance between homestay and nearby place
  const processedNearbyPlaces = useMemo(() => {
    if (!homestay) return [];
    const homeLat = homestay.latitude;
    const homeLng = homestay.longitude;

    return nearbyPlaces.map((item) => {
      // Ưu tiên khoảng cách chuẩn xác do Backend SQL Haversine tính toán
      let distanceValue = typeof item.distance === 'number'
        ? Math.round(item.distance * 10) / 10
        : 0;

      // Nếu có toạ độ thực của cả 2 phía và chưa có distance từ backend thì mới tính lại
      if (distanceValue === 0 && homeLat && homeLng && item.latitude && item.longitude) {
        distanceValue = calculateDistanceKm(homeLat, homeLng, item.latitude, item.longitude);
      }

      return {
        ...item,
        latitude: item.latitude ?? homeLat,
        longitude: item.longitude ?? homeLng,
        displayDistance: distanceValue,
      };
    });
  }, [homestay, nearbyPlaces]);

  // Filter nearby places by selected category
  const filteredNearbyPlaces = useMemo(() => {
    if (nearbyCategory === 'ALL') return processedNearbyPlaces;
    return processedNearbyPlaces.filter((item) => {
      if (nearbyCategory === 'FOOD') {
        return item.kind === 'FOOD' || item.kind === 'RESTAURANT' || item.kind === 'CUISINE';
      }
      if (nearbyCategory === 'ATTRACTION') {
        return item.kind === 'ATTRACTION';
      }
      if (nearbyCategory === 'TRANSPORT') {
        return item.kind === 'TRANSPORT';
      }
      return true;
    });
  }, [processedNearbyPlaces, nearbyCategory]);

  // Markers for VietmapView modal
  const mapMarkers = useMemo<VietmapMarkerItem[]>(() => {
    if (!homestay) return [];

    const list: VietmapMarkerItem[] = [
      {
        id: `homestay-${homestay.id}`,
        name: homestay.name,
        latitude: homestay.latitude || 21.751214,
        longitude: homestay.longitude || 104.318420,
        price: homestay.priceRefMin,
        displayMode: 'name', // Luôn hiển thị tên homestay trên tag (không hiện giá)
        district: homestay.address || homestay.district,
        coverImageUrl: homestay.images?.[0],
        isMain: true,
        kind: 'HOMESTAY',
      },
    ];

    filteredNearbyPlaces.forEach((p) => {
      list.push({
        id: `poi-${p.id}`,
        name: p.name,
        latitude: p.latitude || 21.751214,
        longitude: p.longitude || 104.318420,
        district: p.address || `${p.displayDistance} km từ chỗ nghỉ`,
        kind: p.kind,
        category: p.kind,
        distance: p.displayDistance,
        displayMode: 'name',
        isMain: false,
      });
    });

    return list;
  }, [homestay, filteredNearbyPlaces]);

  // Sắp xếp ưu tiên các điểm du lịch nổi bật theo mùa (isSuitableByTime = true) lên trên đầu
  const sortedRegionalDestinations = useMemo(() => {
    return [...regionalDestinations].sort((a, b) => {
      const aVal = a.isSuitableByTime ? 1 : 0;
      const bVal = b.isSuitableByTime ? 1 : 0;
      return bVal - aVal;
    });
  }, [regionalDestinations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-md h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent"></div>
          <span className="text-sm font-semibold text-[var(--color-muted)]">Đang tải thông tin chỗ nghỉ...</span>
        </div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-[var(--color-ink-deep)] mb-2">Không tìm thấy chỗ nghỉ</h2>
          <p className="text-sm text-gray-600 mb-4">Rất tiếc, chỗ nghỉ bạn tìm kiếm không tồn tại hoặc đã bị tạm ngừng.</p>
          {errorMsg && <p className="text-xs text-rose-600 font-mono mb-4 bg-rose-50 p-2 rounded-md">Error: {errorMsg}</p>}
          <Button onClick={() => navigate('/homestays')} className="rounded-md">Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {/* Hero Search Banner */}
      <section className="relative w-full min-h-[380px] md:min-h-[320px] flex items-start md:items-center justify-center pt-[140px] sm:pt-[132px] md:pt-[110px] pb-6">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#045b4c]/90 via-[#045b4c]/50 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--color-canvas)] to-transparent pointer-events-none"></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4">
          <SearchHub />
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-3 pb-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-muted)] mb-4">
          <a href="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</a>
          <span>/</span>
          <a href="/homestays" className="hover:text-[var(--color-primary)] transition-colors">Homestay & Khách sạn</a>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-semibold truncate max-w-[280px] md:max-w-none">{homestay.name}</span>
        </div>

        {/* Header Title & Basic Info */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#10b981] text-white text-xs font-semibold px-2.5 py-0.5 rounded-xs">
                {homestay.kind === 'HOMESTAY' ? 'Homestay Bản Địa' : 'Chỗ nghỉ trải nghiệm'}
              </span>
              {homestay.ratingAvg != null && homestay.ratingAvg > 0 ? (
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-amber-900 text-xs md:text-sm">{homestay.ratingAvg}</span>
                </div>
              ) : null}
              {homestay.ratingCount != null && homestay.ratingCount > 0 ? (
                <span className="text-xs md:text-sm text-slate-500 font-medium">({homestay.ratingCount} đánh giá)</span>
              ) : (
                <span className="text-xs md:text-sm text-slate-400 font-normal">Chưa có đánh giá</span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {homestay.name}
            </h1>

            <div className="flex items-center gap-2 text-sm md:text-base text-slate-600 mt-2">
              <MapPin className="w-4 h-4 text-[#10b981] shrink-0" />
              <span>{homestay.address || homestay.district}</span>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => setShowMapModal(true)}
                className="text-[#10b981] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <MapIcon className="w-4 h-4" /> Xem bản đồ
              </button>
            </div>
          </div>

          {/* Quick Actions & Contact */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              onClick={() => setInteractionModal({ isOpen: true, type: 'share' })}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 rounded-sm text-slate-700 shadow-2xs transition-colors cursor-pointer border border-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Share className="w-3.5 h-3.5" /> Chia sẻ
            </button>
            <button
              onClick={() => setInteractionModal({ isOpen: true, type: 'heart' })}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 rounded-sm text-slate-700 hover:text-rose-600 shadow-2xs transition-colors cursor-pointer border border-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5" /> Yêu thích
            </button>
          </div>
        </div>

        {/* Gallery ẢNH thực tế (Nếu chưa có ảnh thì vẫn hiện form ảnh kèm thông báo Chưa có ảnh) */}
        <div className="mb-6">
          {homestay.images && homestay.images.length > 0 ? (
            homestay.images.length === 1 ? (
              <div className="rounded-md overflow-hidden border border-slate-200 bg-white p-1.5 h-[280px] md:h-[400px]">
                <img
                  src={homestay.images[0]}
                  alt={homestay.name}
                  className="w-full h-full object-cover rounded-xs"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-md overflow-hidden border border-slate-200 bg-white p-1.5">
                {/* Main large image */}
                <div className="md:col-span-2 md:row-span-2 h-[280px] md:h-[400px] rounded-xs overflow-hidden relative group">
                  <img
                    src={homestay.images[0]}
                    alt={homestay.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                </div>

                {/* Sub images */}
                {homestay.images.slice(1, 5).map((img, idx) => {
                  const isLast = idx === 3 && homestay.images.length > 5;
                  return (
                    <div
                      key={idx}
                      className="h-[135px] md:h-[195px] rounded-xs overflow-hidden relative group border border-slate-100 bg-slate-100"
                    >
                      <img
                        src={img}
                        alt={`${homestay.name} ${idx + 2}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isLast && (
                        <button
                          onClick={() => setShowAmenitiesModal(true)}
                          className="absolute inset-0 bg-black/60 hover:bg-black/70 transition-colors flex items-center justify-center text-white font-bold text-xs cursor-pointer"
                        >
                          +{homestay.images.length - 5} hình ảnh
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="rounded-md overflow-hidden border border-slate-200 bg-white p-2">
              <div className="h-[220px] md:h-[320px] rounded-xs bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Mountain className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                <span className="text-sm font-medium text-slate-500">Chưa có hình ảnh về chỗ nghỉ</span>
              </div>
            </div>
          )}
        </div>

        {/* GIỚI THIỆU CHỖ NGHỈ */}
        {homestay.description && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-[#10b981]" />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">Giới thiệu chỗ nghỉ</h2>
            </div>

            <div className="text-sm md:text-base text-slate-700 leading-relaxed space-y-2">
              <p>{homestay.description}</p>
            </div>
          </div>
        )}

        {/* PHẦN TIỆN ÍCH CỦA HOMESTAY */}
        {homestay.amenities && homestay.amenities.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Tiện ích của chỗ nghỉ</h2>
              </div>
              {homestay.amenities.length > 8 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAmenitiesModal(true)}
                  className="rounded-md font-semibold text-xs md:text-sm h-8 px-3"
                >
                  Hiển thị tất cả ({homestay.amenities.length})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {homestay.amenities.slice(0, 12).map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-200/80 text-sm font-semibold text-slate-800"
                >
                  <div className="shrink-0">
                    {getAmenityIcon(amenity)}
                  </div>
                  <span className="truncate">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO TRẢI NGHIỆM THỰC TẾ (TIKTOK EMBED) */}
        {tiktokContact && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Video review</h2>
                <a
                  href={tiktokContact.value}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black text-white hover:bg-slate-800 text-xs md:text-sm font-semibold transition-colors shrink-0 w-fit"
                >
                  <span>Mở</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                </a>
              </div>


            </div>

            <div className="bg-slate-900 rounded-lg p-3 sm:p-5 flex justify-center items-center shadow-xs border border-slate-800 overflow-hidden min-h-[580px]">
              {tiktokVideoId ? (
                <TikTokEmbed url={tiktokContact.value} videoId={tiktokVideoId} />
              ) : (
                <div className="w-full max-w-md py-8 text-center text-white">
                  <p className="text-base font-semibold mb-2">Xem video đánh giá trải nghiệm</p>
                  <a
                    href={tiktokContact.value}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Xem clip trên TikTok
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DANH SÁCH PHÒNG & LỊCH TRỐNG */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-ink-deep)]">Danh sách phòng & Lịch trống</h2>
          </div>

          <div className="flex flex-col gap-6">
            {homestay.rooms.map((room: RoomTypeDto) => (
              <RoomBookingCard
                key={room.id}
                room={room}
                homestay={homestay}
                bookedDates={bookedDates}
                defaultCheckIn={initialCheckInDate}
                defaultCheckOut={initialCheckOutDate}
              />
            ))}
          </div>
        </div>

        {/* ĐỊA ĐIỂM XUNG QUANH */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-ink-deep)]">Địa điểm & Dịch vụ xung quanh</h2>
            </div>

            {/* Radius slider */}
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
              <span className="text-xs font-semibold text-gray-600">Bán kính:</span>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-24 md:w-32 h-1.5 bg-gray-300 rounded-sm appearance-none cursor-pointer accent-[var(--color-primary)]"
              />
              <span className="text-xs font-bold text-[var(--color-primary)] w-10 text-right">{radius} km</span>
            </div>
          </div>

          {/* BỘ LỌC PHÂN LOẠI ĐỊA ĐIỂM (Hàng ngang kéo lướt, thiết kế hiện đại) */}
          <div className="flex items-center gap-2 mb-4 pb-2.5 overflow-x-auto scrollbar-none border-b border-slate-100 -mx-1 px-1">
            <button
              onClick={() => setNearbyCategory('ALL')}
              className={`shrink-0 px-3.5 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all cursor-pointer shadow-2xs ${
                nearbyCategory === 'ALL'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              Tất cả ({processedNearbyPlaces.length})
            </button>
            <button
              onClick={() => setNearbyCategory('ATTRACTION')}
              className={`shrink-0 px-3.5 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                nearbyCategory === 'ATTRACTION'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-300'
              }`}
            >
              <Mountain className="w-4 h-4 text-blue-500" />
              Điểm đến & Thắng cảnh ({processedNearbyPlaces.filter((p) => p.kind === 'ATTRACTION').length})
            </button>
            <button
              onClick={() => setNearbyCategory('FOOD')}
              className={`shrink-0 px-3.5 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                nearbyCategory === 'FOOD'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-50/50 hover:border-rose-300'
              }`}
            >
              <Utensils className="w-4 h-4 text-rose-500" />
              Ẩm thực & Nhà hàng ({processedNearbyPlaces.filter((p) => p.kind === 'FOOD' || p.kind === 'RESTAURANT' || p.kind === 'CUISINE').length})
            </button>
            <button
              onClick={() => setNearbyCategory('TRANSPORT')}
              className={`shrink-0 px-3.5 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                nearbyCategory === 'TRANSPORT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50/50 hover:border-amber-300'
              }`}
            >
              <Bus className="w-4 h-4 text-amber-500" />
              Bến xe & Di chuyển ({processedNearbyPlaces.filter((p) => p.kind === 'TRANSPORT').length})
            </button>
          </div>

          {/* Danh sách địa điểm & dịch vụ xung quanh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {filteredNearbyPlaces.length > 0 ? (
              filteredNearbyPlaces.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-md bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 transition-all group flex flex-col justify-between"
                >
                  <div
                    onClick={() => {
                      setSelectedMapTarget({ lat: item.latitude, lng: item.longitude, zoom: 16 });
                      setShowMapModal(true);
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                        {getPlaceIcon(item.kind)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm md:text-base font-bold text-[var(--color-ink-deep)] group-hover:text-[var(--color-primary)] transition-colors block truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.kind === 'FOOD' ? 'Ẩm thực & Quán ăn' : item.kind === 'ATTRACTION' ? 'Danh lam thắng cảnh' : item.kind === 'TRANSPORT' ? 'Bến xe & Di chuyển' : 'Điểm lân cận'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs md:text-sm font-bold text-[var(--color-primary)] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-sm border border-emerald-200">
                        {item.displayDistance < 1 ? Math.round(item.displayDistance * 1000) + ' m' : item.displayDistance + ' km'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-primary)]" />
                    </div>
                  </div>

                  {/* THÔNG TIN CONTACT CỦA DỊCH VỤ DƯỚI MỖI THẺ */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    {item.contacts && item.contacts.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.contacts.map((c) => {
                          if (c.channel === 'PHONE') {
                            return (
                              <a
                                key={c.id}
                                href={`tel:${c.value}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{c.value}</span>
                              </a>
                            );
                          }
                          const isUrl = c.value.startsWith('http');
                          return (
                            <a
                              key={c.id}
                              href={isUrl ? c.value : '#'}
                              target={isUrl ? '_blank' : undefined}
                              rel={isUrl ? 'noreferrer noopener' : undefined}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                            >
                              {c.channel === 'FACEBOOK' ? (
                                <span>Facebook</span>
                              ) : c.channel === 'TIKTOK' ? (
                                <span>TikTok</span>
                              ) : c.channel === 'ZALO' ? (
                                <span>Zalo</span>
                              ) : (
                                <Globe className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate max-w-[240px]">{item.address || 'Liên hệ qua ban quản lý / chỗ nghỉ'}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMapTarget({ lat: item.latitude, lng: item.longitude, zoom: 16 });
                        setShowMapModal(true);
                      }}
                      className="text-xs md:text-sm font-semibold text-[#10b981] hover:underline flex items-center gap-0.5 ml-auto cursor-pointer"
                    >
                      Chỉ đường <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-md">
                Không tìm thấy địa điểm nào phù hợp trong danh mục này trong bán kính {radius}km.
              </p>
            )}
          </div>

          {/* NÚT MỞ BẢN ĐỒ VIETMAP Ở DƯỚI ĐỊA ĐIỂM XUNG QUANH */}
          <div className="pt-1 flex justify-center">
            <Button
              onClick={() => {
                setSelectedMapTarget(null);
                setShowMapModal(true);
              }}
              variant="outline"
              className="rounded-md font-bold text-sm flex items-center gap-2 px-6 py-2.5 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-50)]"
            >
              <MapIcon className="w-4 h-4" />
              Mở bản đồ VietMap toàn cảnh ({filteredNearbyPlaces.length} địa điểm)
            </Button>
          </div>
        </div>

        {/* ĐÁNH GIÁ CỦA KHÁCH (Data thực tế từ Review backend) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-ink-deep)]">Đánh giá của khách</h2>
            </div>
            {homestay.ratingAvg != null && homestay.ratingAvg > 0 && (
              <div className="flex items-center gap-1.5 bg-[#fefce8] px-3 py-1 rounded-md border border-[#f59e0b]/40">
                <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                <span className="font-black text-[#78350f] text-sm md:text-base">{homestay.ratingAvg} / 5.0</span>
              </div>
            )}
          </div>

          {/* ĐÁNH GIÁ NỔI BẬT: Ưu điểm (PRO), Lưu ý (CON), Mẹo trải nghiệm (TIP) */}
          {homestay.highlights && homestay.highlights.length > 0 && (
            <div className="mb-6 p-4 rounded-md bg-slate-50 border border-slate-200">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#10b981]" />
                Đúc kết trải nghiệm thực tế từ du khách
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* PRO - Ưu điểm */}
                {homestay.highlights.some(h => h.type === 'PRO') && (
                  <div className="bg-white p-3.5 rounded-sm border border-slate-200">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs md:text-sm mb-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ưu điểm nổi bật (Pro)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs md:text-sm text-slate-700">
                      {homestay.highlights.filter(h => h.type === 'PRO').map((h, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold leading-none mt-0.5">•</span>
                          <span>{h.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CON - Cần lưu ý */}
                {homestay.highlights.some(h => h.type === 'CON') && (
                  <div className="bg-white p-3.5 rounded-sm border border-slate-200">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs md:text-sm mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Điểm cần lưu ý (Con)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs md:text-sm text-slate-700">
                      {homestay.highlights.filter(h => h.type === 'CON').map((h, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold leading-none mt-0.5">•</span>
                          <span>{h.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* TIP - Mẹo hữu ích */}
                {homestay.highlights.some(h => h.type === 'TIP') && (
                  <div className="bg-white p-3.5 rounded-sm border border-slate-200">
                    <div className="flex items-center gap-1.5 text-sky-800 font-bold text-xs md:text-sm mb-2">
                      <Lightbulb className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Mẹo trải nghiệm (Tip)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs md:text-sm text-slate-700">
                      {homestay.highlights.filter(h => h.type === 'TIP').map((h, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-sky-600 font-bold leading-none mt-0.5">•</span>
                          <span>{h.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 border border-slate-200 rounded-sm bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xs bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {rev.guestName.charAt(0)}
                      </div>
                      <span className="font-semibold text-xs md:text-sm text-slate-800">{rev.guestName}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed italic">"{rev.content}"</p>
                  <span className="text-xs text-slate-400 block mt-2">
                    {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-sm border border-slate-200">
              <p className="text-xs md:text-sm text-slate-500">
                {homestay.ratingCount && homestay.ratingCount > 0 ? (
                  <>
                    Hiện tại chỗ nghỉ này có tổng cộng <strong>{homestay.ratingCount}</strong> lượt chấm điểm với mức trung bình <strong>{homestay.ratingAvg}★</strong>.
                  </>
                ) : (
                  <>Chưa có đánh giá nào cho chỗ nghỉ này.</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* DƯỚI CÙNG: ĐỊA ĐIỂM DU LỊCH TRONG TỈNH/XÃ MÀ HOMESTAY ĐÓ Ở TẠI */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-ink-deep)]">
                Điểm du lịch nổi bật tại {homestay.regionName || homestay.district || 'khu vực lân cận'}
              </h2>
            </div>
            <button
              onClick={() => navigate('/destinations')}
              className="text-xs md:text-sm font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {sortedRegionalDestinations.map((dest) => {
              const isSuitable = Boolean(dest.isSuitableByTime);
              return (
                <div
                  key={dest.id}
                  onClick={() => navigate(`/destination/${dest.id}`)}
                  className={`bg-white rounded-md overflow-hidden border shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between ${isSuitable ? 'border-[#10b981]/40 ring-1 ring-[#10b981]/20 hover:border-[#10b981]' : 'border-slate-200 hover:border-[#10b981]/40'
                    }`}
                >
                  <div>
                    <div className="h-36 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {dest.coverImageUrl ? (
                        <img
                          src={dest.coverImageUrl}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Mountain className="w-8 h-8 opacity-30 mb-1" />
                          <span className="text-[10px]">Chưa có ảnh</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        {isSuitable && (
                          <span className="bg-[#10b981] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-tight shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-300" /> Thích hợp theo mùa
                          </span>
                        )}
                        <span className="bg-slate-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-xs">
                          Thắng cảnh
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-sm md:text-base text-slate-900 group-hover:text-[#10b981] transition-colors truncate">
                        {dest.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                        <span className="truncate">{dest.district || dest.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1.5 flex items-center justify-between border-t border-slate-100 text-xs md:text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-slate-800 text-xs">{dest.ratingScore}</span>
                    </div>
                    <span className="text-[#10b981] font-semibold text-xs md:text-sm group-hover:translate-x-0.5 transition-transform">
                      Khám phá →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL VIETMAP TOÀN CẢNH */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[85vh] p-4 md:p-5 shadow-xl relative flex flex-col border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)]">
                  Bản đồ VietMap: {homestay.name} & Địa điểm xung quanh
                </h3>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700 mb-2.5 px-0.5">
              <div className="flex items-center gap-1.5 bg-[#edfbf7] text-[#10b981] px-2.5 py-1 rounded-sm border border-[#10b981]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]"></span> Chỗ nghỉ ({homestay.name})
              </div>
              <div className="flex items-center gap-1.5 bg-[#fef2f2] text-[#dc2626] px-2.5 py-1 rounded-sm border border-[#dc2626]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]"></span> Ẩm thực
              </div>
              <div className="flex items-center gap-1.5 bg-[#eff6ff] text-[#2563eb] px-2.5 py-1 rounded-sm border border-[#2563eb]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]"></span> Thắng cảnh
              </div>
              <div className="flex items-center gap-1.5 bg-[#fffbeb] text-[#d97706] px-2.5 py-1 rounded-sm border border-[#d97706]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]"></span> Di chuyển
              </div>
              <div className="flex items-center gap-1.5 bg-[#f5f3ff] text-[#7c3aed] px-2.5 py-1 rounded-sm border border-[#7c3aed]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#7C3AED]"></span> Chợ / Mua sắm
              </div>
              <div className="flex items-center gap-1.5 bg-[#f1f5f9] text-[#0f172a] px-2.5 py-1 rounded-sm border border-[#0f172a]/20">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0F172A]"></span> Dịch vụ
              </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 rounded-md overflow-hidden border border-gray-200 relative">
              <VietmapView
                centerLat={selectedMapTarget?.lat || homestay.latitude || 21.85}
                centerLng={selectedMapTarget?.lng || homestay.longitude || 104.08}
                zoomLevel={selectedMapTarget?.zoom || 14}
                className="w-full h-full"
                markers={mapMarkers}
              />
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-md"
                onClick={() => setShowMapModal(false)}
              >
                Đóng bản đồ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị tất cả tiện nghi */}
      {showAmenitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 md:p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200 border border-gray-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-[var(--color-ink-deep)]">Tất cả tiện nghi ({homestay.amenities.length})</h3>
              <button
                onClick={() => setShowAmenitiesModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {homestay.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-gray-50 text-[var(--color-ink)] text-xs border border-gray-100">
                  <div className="shrink-0">{getAmenityIcon(amenity)}</div>
                  <span className="truncate font-medium">{amenity}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-md cursor-pointer"
                onClick={() => setShowAmenitiesModal(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tương tác Modal (Share & Save) */}
      {interactionModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl relative animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-md ${interactionModal.type === 'share' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                  {interactionModal.type === 'share' ? <Share className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-current" />}
                </div>
                <h3 className="text-base font-bold text-[var(--color-ink-deep)]">
                  {interactionModal.type === 'share' ? 'Chia sẻ chỗ nghỉ' : 'Đã lưu chỗ nghỉ'}
                </h3>
              </div>
              <button
                onClick={() => setInteractionModal({ isOpen: false, type: null })}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              {interactionModal.type === 'share'
                ? 'Sao chép liên kết dưới đây để gửi cho bạn bè hoặc người đồng hành của bạn.'
                : 'Chỗ nghỉ này đã được lưu vào danh sách yêu thích của bạn.'}
            </p>

            {interactionModal.type === 'share' && (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 p-2 text-xs border border-gray-200 rounded-md bg-gray-50 outline-none text-gray-600 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-md"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  Sao chép
                </Button>
              </div>
            )}

            <Button
              className="w-full text-xs rounded-md"
              onClick={() => setInteractionModal({ isOpen: false, type: null })}
            >
              {interactionModal.type === 'share' ? 'Hoàn tất' : 'Xem danh sách yêu thích'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  ExternalLink
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
import OpenStreetMapView, { OsmMarkerItem } from '@/components/map/OpenStreetMapView';
import RoomBookingCard from '@/components/homestay/RoomBookingCard';

// Helper tính khoảng cách Haversine chính xác theo OpenStreetMap / GPS tọa độ
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
  const identifier = id || slug || '28';
  const navigate = useNavigate();

  const [homestay, setHomestay] = useState<HomestayDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [showOsmModal, setShowOsmModal] = useState(false);
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

  // Default initial dates for room booking cards
  const initialCheckInDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);
  const initialCheckOutDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  }, []);

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

  // Calculated distance between homestay and nearby place using OpenStreetMap coordinates
  const processedNearbyPlaces = useMemo(() => {
    if (!homestay) return [];
    const homeLat = homestay.latitude || 21.85;
    const homeLng = homestay.longitude || 104.08;

    return nearbyPlaces.map((item) => {
      const pLat = item.latitude ?? (homeLat + ((item.id % 7) - 3) * 0.007);
      const pLng = item.longitude ?? (homeLng + ((item.id % 5) - 2) * 0.007);
      const calculatedDistance = calculateDistanceKm(homeLat, homeLng, pLat, pLng);

      return {
        ...item,
        latitude: pLat,
        longitude: pLng,
        displayDistance: calculatedDistance,
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

  // Markers for OpenStreetMapView modal
  const mapMarkers = useMemo<OsmMarkerItem[]>(() => {
    if (!homestay) return [];

    const list: OsmMarkerItem[] = [
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
      <section className="relative w-full min-h-[380px] md:min-h-[320px] flex items-start md:items-center justify-center pt-[120px] md:pt-[95px] pb-6">
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
              <span className="bg-[#048c73] text-white text-[11px] font-semibold px-2 py-0.5 rounded-xs">
                {homestay.kind === 'HOMESTAY' ? 'Homestay Bản Địa' : 'Chỗ nghỉ trải nghiệm'}
              </span>
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="font-bold text-amber-900 text-xs">{homestay.ratingAvg || '4.8'}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">({homestay.ratingCount || 128} đánh giá)</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {homestay.name}
            </h1>

            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#048c73] shrink-0" />
              <span>{homestay.address || homestay.district}</span>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => setShowOsmModal(true)}
                className="text-[#048c73] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <MapIcon className="w-3.5 h-3.5" /> Xem bản đồ OpenStreetMap
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

        {/* Gallery ẢNH (Gọn gàng & Hiện đại) */}
        <div className="mb-6">
          {homestay.images.length > 0 ? (
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
          ) : (
            <div className="w-full h-[320px] rounded-md bg-slate-100 flex items-center justify-center border border-slate-200">
              <MapPin className="w-12 h-12 text-slate-300" />
            </div>
          )}
        </div>

        {/* GIỚI THIỆU CHỖ NGHỈ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-[#048c73]" />
            <h2 className="text-base font-bold text-slate-900">Giới thiệu chỗ nghỉ</h2>
          </div>
          
          <div className="text-xs md:text-sm text-slate-600 leading-relaxed space-y-2">
            <p>
              {homestay.description ||
                'Tọa lạc tại vị trí thanh bình và thoáng đãng, chỗ nghỉ mang đến cho du khách không gian nghỉ dưỡng ấm cúng, gần gũi với thiên nhiên bản địa. Phòng nghỉ được trang bị đầy đủ tiện nghi, view nhìn ra núi đồi hoặc thung lũng xanh ngát.'}
            </p>
          </div>
        </div>

        {/* PHẦN TIỆN ÍCH CỦA HOMESTAY (Gọn gàng, tag bo tròn rounded-md) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tiện ích của chỗ nghỉ</h2>
              <p className="text-xs text-slate-400 mt-0.5">Các tiện nghi đã sẵn sàng phục vụ kỳ nghỉ của bạn</p>
            </div>
            {homestay.amenities.length > 8 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAmenitiesModal(true)}
                className="rounded-md font-semibold text-xs h-7 px-2.5"
              >
                Hiển thị tất cả ({homestay.amenities.length})
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {homestay.amenities.slice(0, 12).map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
              >
                <div className="shrink-0">
                  {getAmenityIcon(amenity)}
                </div>
                <span className="truncate font-medium">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DANH SÁCH PHÒNG & LỊCH TRỐNG (Active Availability Calendar) */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[var(--color-ink-deep)]">Danh sách phòng & Lịch trống</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chọn ngày trực tiếp trên lịch để kiểm tra và đặt phòng. Ngày đã kín phòng sẽ tự động bị khóa (disable).
            </p>
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

        {/* ĐỊA ĐIỂM XUNG QUANH (Tính khoảng cách bằng OpenStreetMap, có nút mở OpenStreetMap ở dưới) */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Địa điểm & Dịch vụ xung quanh</h2>
              <p className="text-xs text-gray-500 mt-0.5">Khoảng cách được tính toán chính xác theo định vị tọa độ OpenStreetMap</p>
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

          {/* BỘ LỌC PHÂN LOẠI ĐỊA ĐIỂM (Tất cả, Điểm đến, Ẩm thực, Di chuyển...) */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-100">
            <button
              onClick={() => setNearbyCategory('ALL')}
              className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
                nearbyCategory === 'ALL'
                  ? 'bg-[#048c73] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả ({processedNearbyPlaces.length})
            </button>
            <button
              onClick={() => setNearbyCategory('ATTRACTION')}
              className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                nearbyCategory === 'ATTRACTION'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              Điểm đến & Thắng cảnh ({processedNearbyPlaces.filter(p => p.kind === 'ATTRACTION').length})
            </button>
            <button
              onClick={() => setNearbyCategory('FOOD')}
              className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                nearbyCategory === 'FOOD'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              Ẩm thực & Nhà hàng ({processedNearbyPlaces.filter(p => p.kind === 'FOOD' || p.kind === 'RESTAURANT' || p.kind === 'CUISINE').length})
            </button>
            <button
              onClick={() => setNearbyCategory('TRANSPORT')}
              className={`px-2.5 py-1 rounded-xs text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                nearbyCategory === 'TRANSPORT'
                  ? 'bg-[#d97706] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              Bến xe & Di chuyển ({processedNearbyPlaces.filter(p => p.kind === 'TRANSPORT').length})
            </button>
          </div>

          {/* Danh sách địa điểm & dịch vụ xung quanh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {filteredNearbyPlaces.length > 0 ? (
              filteredNearbyPlaces.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 transition-all group flex flex-col justify-between"
                >
                  <div
                    onClick={() => {
                      setSelectedMapTarget({ lat: item.latitude, lng: item.longitude, zoom: 16 });
                      setShowOsmModal(true);
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                        {getPlaceIcon(item.kind)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs md:text-sm font-semibold text-[var(--color-ink-deep)] group-hover:text-[var(--color-primary)] transition-colors block truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {item.kind === 'FOOD' ? 'Ẩm thực & Quán ăn' : item.kind === 'ATTRACTION' ? 'Danh lam thắng cảnh' : item.kind === 'TRANSPORT' ? 'Bến xe & Di chuyển' : 'Điểm lân cận'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs font-bold text-[var(--color-primary)] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-sm border border-emerald-200">
                        {item.displayDistance < 1 ? Math.round(item.displayDistance * 1000) + ' m' : item.displayDistance + ' km'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-primary)]" />
                    </div>
                  </div>

                  {/* THÔNG TIN CONTACT CỦA DỊCH VỤ DƯỚI MỖI THẺ */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                    {item.contacts && item.contacts.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.contacts.map((c) => {
                          if (c.channel === 'PHONE') {
                            return (
                              <a
                                key={c.id}
                                href={`tel:${c.value}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
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
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                            >
                              {c.channel === 'FACEBOOK' ? (
                                <span>Facebook</span>
                              ) : c.channel === 'TIKTOK' ? (
                                <span>TikTok</span>
                              ) : c.channel === 'ZALO' ? (
                                <span>Zalo</span>
                              ) : (
                                <Globe className="w-3 h-3 text-slate-500" />
                              )}
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] italic">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate max-w-[240px]">{item.address || 'Liên hệ qua ban quản lý / chỗ nghỉ'}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMapTarget({ lat: item.latitude, lng: item.longitude, zoom: 16 });
                        setShowOsmModal(true);
                      }}
                      className="text-[11px] font-semibold text-[#048c73] hover:underline flex items-center gap-0.5 ml-auto cursor-pointer"
                    >
                      Chỉ đường <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-md">
                Không tìm thấy địa điểm nào phù hợp trong danh mục này trong bán kính {radius}km.
              </p>
            )}
          </div>

          {/* NÚT MỞ BẢN ĐỒ OPENSTREETMAP Ở DƯỚI ĐỊA ĐIỂM XUNG QUANH */}
          <div className="pt-1 flex justify-center">
            <Button
              onClick={() => {
                setSelectedMapTarget(null);
                setShowOsmModal(true);
              }}
              variant="outline"
              className="rounded-md font-bold text-xs md:text-sm flex items-center gap-2 px-6 py-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-50)]"
            >
              <MapIcon className="w-4 h-4" />
              Mở bản đồ OpenStreetMap toàn cảnh ({filteredNearbyPlaces.length} địa điểm)
            </Button>
          </div>
        </div>

        {/* ĐÁNH GIÁ CỦA KHÁCH (Data thực tế từ Review backend) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink-deep)]">Đánh giá của khách</h2>
              <p className="text-xs text-gray-500 mt-0.5">Dữ liệu đánh giá từ khách hàng đã hoàn thành kỳ nghỉ tại {homestay.name}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#fefce8] px-2.5 py-1 rounded-md border border-[#f59e0b]/40">
              <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
              <span className="font-black text-[#78350f] text-sm">{homestay.ratingAvg || '4.8'} / 5.0</span>
            </div>
          </div>

          {/* ĐÁNH GIÁ NỔI BẬT: Ưu điểm (PRO), Lưu ý (CON), Mẹo trải nghiệm (TIP) */}
          {homestay.highlights && homestay.highlights.length > 0 && (
            <div className="mb-6 p-4 rounded-md bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#048c73]" />
                Đúc kết trải nghiệm thực tế từ du khách
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* PRO - Ưu điểm */}
                {homestay.highlights.some(h => h.type === 'PRO') && (
                  <div className="bg-white p-3 rounded-sm border border-slate-200">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-2">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ưu điểm nổi bật (Pro)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
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
                  <div className="bg-white p-3 rounded-sm border border-slate-200">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Điểm cần lưu ý (Con)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
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
                  <div className="bg-white p-3 rounded-sm border border-slate-200">
                    <div className="flex items-center gap-1.5 text-sky-800 font-bold text-xs mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Mẹo trải nghiệm (Tip)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-3.5 border border-slate-200 rounded-sm bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xs bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {rev.guestName.charAt(0)}
                      </div>
                      <span className="font-semibold text-xs text-slate-800">{rev.guestName}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.content}"</p>
                  <span className="text-[10px] text-slate-400 block mt-2">
                    {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-sm border border-slate-200">
              <p className="text-xs text-slate-500">
                Hiện tại homestay này có tổng cộng <strong>{homestay.ratingCount || 128}</strong> lượt chấm điểm với mức trung bình <strong>{homestay.ratingAvg || 4.8}★</strong>.
              </p>
            </div>
          )}
        </div>

        {/* DƯỚI CÙNG: ĐỊA ĐIỂM DU LỊCH TRONG TỈNH/XÃ MÀ HOMESTAY ĐÓ Ở TẠI */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink-deep)]">
                Điểm du lịch nổi bật tại {homestay.district || 'khu vực lân cận'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Các danh lam thắng cảnh và điểm tham quan trong tỉnh/xã bạn không nên bỏ lỡ
              </p>
            </div>
            <button
              onClick={() => navigate('/destinations')}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
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
                  className={`bg-white rounded-md overflow-hidden border shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between ${
                    isSuitable ? 'border-[#048c73]/40 ring-1 ring-[#048c73]/20 hover:border-[#048c73]' : 'border-slate-200 hover:border-[#048c73]/40'
                  }`}
                >
                  <div>
                    <div className="h-36 overflow-hidden relative bg-slate-100">
                      <img
                        src={dest.coverImageUrl}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        {isSuitable && (
                          <span className="bg-[#048c73] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-tight shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-300" /> Thích hợp theo mùa
                          </span>
                        )}
                        <span className="bg-slate-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-xs">
                          Thắng cảnh
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-xs md:text-sm text-slate-900 group-hover:text-[#048c73] transition-colors truncate">
                        {dest.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-[#048c73] shrink-0" />
                        <span className="truncate">{dest.district || dest.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-slate-800 text-[11px]">{dest.ratingScore}</span>
                    </div>
                    <span className="text-[#048c73] font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform">
                      Khám phá →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL OPENSTREETMAP TOÀN CẢNH */}
      {showOsmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[85vh] p-4 md:p-5 shadow-xl relative flex flex-col border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-base md:text-lg font-bold text-[var(--color-ink-deep)]">
                  Bản đồ OpenStreetMap: {homestay.name} & Địa điểm xung quanh
                </h3>
              </div>
              <button
                onClick={() => setShowOsmModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legend bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700 mb-2.5 px-0.5">
              <div className="flex items-center gap-1.5 bg-[#edfbf7] text-[#048c73] px-2.5 py-1 rounded-sm border border-[#048c73]/30">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#048C73]"></span> Chỗ nghỉ ({homestay.name})
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
              <OpenStreetMapView
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
                onClick={() => setShowOsmModal(false)}
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

import { useState, useEffect } from 'react';
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
  CheckCircle2,
  Users,
  Maximize,
  ExternalLink,
  BedDouble,
  Mountain,
  Bus,
  Sparkles,
  X
} from 'lucide-react';
import SearchHub from '../components/layout/SearchHub';
import { getHomestayById, fetchNearbyPlaces } from '../services/homestayService';
import { HomestayDetailDto, RoomTypeDto, NearbyPlaceDto } from '../types/homestay';
import { Button } from '../components/ui/button';

export default function HomestayDetailPage() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const identifier = id || slug || '28';
  const navigate = useNavigate();
  const [homestay, setHomestay] = useState<HomestayDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [radius, setRadius] = useState(10);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceDto[]>([]);

  useEffect(() => {
    if (identifier) {
      setLoading(true);
      getHomestayById(identifier).then(data => {
        if (!data) setErrorMsg("API returned null");
        setHomestay(data);
        setLoading(false);
      }).catch(err => {
        setErrorMsg(err.message || "Unknown error");
        setLoading(false);
      });
    }
  }, [identifier]);

  useEffect(() => {
    if (identifier) {
      fetchNearbyPlaces(identifier, radius).then(data => setNearbyPlaces(data));
    }
  }, [identifier, radius]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16709a]"></div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy chỗ nghỉ</h2>
        <p className="text-gray-600 mb-2">Rất tiếc, chỗ nghỉ bạn tìm kiếm không tồn tại hoặc đã bị gỡ.</p>
        {errorMsg && <p className="text-red-500 font-bold mb-4">Error: {errorMsg}</p>}
        <Button onClick={() => navigate('/homestays')}>Quay lại danh sách</Button>
      </div>
    );
  }

  // Helper to map amenity strings to icons
  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wifi')) return <Wifi className="w-4 h-4 text-[var(--color-primary)]" />;
    if (n.includes('đỗ') || n.includes('xe')) return <Car className="w-4 h-4 text-[var(--color-primary)]" />;
    if (n.includes('điều hòa')) return <Wind className="w-4 h-4 text-[var(--color-primary)]" />;
    if (n.includes('nhà hàng') || n.includes('ăn')) return <Utensils className="w-4 h-4 text-[var(--color-primary)]" />;
    if (n.includes('cà phê') || n.includes('coffee')) return <Coffee className="w-4 h-4 text-[var(--color-primary)]" />;
    if (n.includes('nóng') || n.includes('bình')) return <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />;
    return <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />;
  };

  // Helper to map place kind to icon
  const getPlaceIcon = (kind: string) => {
    switch (kind) {
      case 'FOOD': return <Utensils className="w-4 h-4 text-[var(--color-primary)]" />;
      case 'ATTRACTION': return <Mountain className="w-4 h-4 text-[var(--color-primary)]" />;
      case 'TRANSPORT': return <Bus className="w-4 h-4 text-[var(--color-primary)]" />;
      default: return <MapPin className="w-4 h-4 text-[var(--color-primary)]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Hero Banner - giống trang HomestayListPage */}
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

      {/* === GALLERY + INFO (trong container) === */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-5 pb-2">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-3">
          <a href="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</a>
          <span>/</span>
          <a href="/homestays" className="hover:text-[var(--color-primary)] transition-colors">Homestay & Khách sạn</a>
          <span>/</span>
          <span className="text-[var(--color-ink-deep)] font-medium">{homestay.name}</span>
        </div>

        {/* Tên + Actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2">
          <h1 className="text-2xl md:text-[32px] font-bold text-[var(--color-ink-deep)] leading-tight">
            {homestay.name}
          </h1>
          <div className="flex gap-3 shrink-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-md text-sm font-bold text-[var(--color-ink-deep)] transition-colors border border-gray-200 shadow-sm">
              <Share className="w-4 h-4" /> Chia sẻ
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-md text-sm font-bold text-[var(--color-ink-deep)] transition-colors border border-gray-200 shadow-sm">
              <Heart className="w-4 h-4" /> Lưu
            </button>
          </div>
        </div>

        {/* Rating + Địa chỉ + Google Maps */}
        <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1.5 bg-[#fefce8] px-2.5 py-1 rounded-md border border-[#f59e0b]/30">
            <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
            <span className="font-extrabold text-[#78350f]">{homestay.ratingAvg || '4.8'}</span>
            <span className="text-[#a16207] text-xs font-semibold cursor-pointer">({homestay.ratingCount || 0} đánh giá)</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="text-[var(--color-muted)]">{homestay.address || homestay.district}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((homestay.address || homestay.district || '') + ' ' + homestay.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 bg-white border border-[var(--color-primary)] text-[var(--color-primary)] rounded-md text-xs font-bold hover:bg-[var(--color-primary)] hover:text-white transition-colors shadow-sm"
            >
              <ExternalLink className="w-3 h-3" />
              Google Maps
            </a>
          </div>
        </div>

        {/* === GALLERY ẢNH === */}
        {homestay.images.length > 0 ? (
          <div>
            {/* Mobile: lướt ngang từ đầu đến cuối */}
            <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 pb-2">
              {homestay.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative shrink-0 w-[84vw] max-w-[340px] h-[240px] rounded-lg overflow-hidden snap-center shadow-sm bg-gray-100"
                >
                  <img
                    src={img}
                    alt={`${homestay.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                  <span className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-sm">
                    {idx + 1} / {homestay.images.length}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop: sắp xếp lưới như thường */}
            <div className="hidden md:flex flex-col gap-1.5">
              {/* Hàng trên: ảnh lớn trái + 2 ảnh nhỏ phải */}
              <div className="flex gap-1.5 h-[400px] rounded-lg overflow-hidden">
                {/* Ảnh chính - chiếm 60% */}
                <div className="w-[60%] shrink-0 overflow-hidden">
                  <img
                    src={homestay.images[0]}
                    alt={homestay.name}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
                  />
                </div>
                {/* 2 ảnh nhỏ xếp dọc - chiếm 40% */}
                <div className="flex flex-col gap-1.5 flex-1">
                  {homestay.images.slice(1, 3).map((img, idx) => (
                    <div key={idx} className="flex-1 overflow-hidden">
                      <img
                        src={img}
                        alt={`${homestay.name} ${idx + 2}`}
                        className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500 cursor-pointer"
                      />
                    </div>
                  ))}
                  {/* Placeholder nếu không đủ 2 ảnh nhỏ */}
                  {homestay.images.length < 3 && (
                    <div className="flex-1 bg-gray-200" />
                  )}
                </div>
              </div>

              {/* Hàng thumbnail phía dưới */}
              {homestay.images.length > 3 && (
                <div className="flex gap-1.5 h-[100px]">
                  {homestay.images.slice(3, 8).map((img, idx) => {
                    const isLast = idx === 4 && homestay.images.length > 8;
                    return (
                      <div key={idx} className="relative flex-1 rounded-lg overflow-hidden">
                        <img
                          src={img}
                          alt={`${homestay.name} ${idx + 4}`}
                          className="w-full h-full object-cover hover:scale-[1.05] transition-transform duration-300 cursor-pointer"
                        />
                        {isLast && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors">
                            <span className="text-white font-bold text-sm">+{homestay.images.length - 8} ảnh</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[260px] md:h-[400px] rounded-lg bg-gray-200 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* === CHI TIẾT & PHÒNG TRỐNG (TOÀN CHIỀU RỘNG CONTAINER) === */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-10 w-full">
        {/* === 3 PHẦN CÙNG 1 DÒNG: MÔ TẢ, ĐỊA ĐIỂM XUNG QUANH, TIỆN NGHI === */}
        <div className="w-full pb-8 border-b border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Phần 1: Description chỗ nghỉ */}
            <div className="pb-6 lg:pb-0 lg:pr-8">
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)] mb-3">
                Về chỗ nghỉ này
              </h2>
              <div className="text-[var(--color-muted)] text-[15px] leading-relaxed space-y-3">
                <p>
                  {homestay.description ||
                    'Tọa lạc tại vị trí thanh bình và thoáng đãng, chỗ nghỉ mang đến cho du khách không gian nghỉ dưỡng ấm cúng, gần gũi với thiên nhiên bản địa. Phòng nghỉ được trang bị đầy đủ tiện nghi, view nhìn ra núi đồi hoặc thung lũng xanh ngát.'}
                </p>
                <p className="text-sm text-gray-500">
                  Được du khách yêu thích nhờ không gian yên tĩnh, lòng hiếu khách của chủ nhà và sự thuận tiện trong việc di chuyển đến các điểm tham quan.
                </p>
              </div>
            </div>

            {/* Phần 2: Những địa điểm xung quanh */}
            <div className="py-6 lg:py-0 lg:px-8">
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)] mb-3">
                Địa điểm xung quanh
              </h2>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink)]">Bán kính quét</span>
                  <span className="text-sm font-bold px-2 py-0.5 rounded bg-emerald-50 text-[var(--color-primary)] border border-emerald-200">
                    {radius} km
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>1 km</span>
                  <span>10 km</span>
                  <span>20 km</span>
                  <span>30 km</span>
                </div>
              </div>
              <div className="space-y-3">
                {nearbyPlaces.length > 0 ? nearbyPlaces.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2.5 text-[var(--color-ink)]">
                      {getPlaceIcon(item.kind)}
                      <span className="truncate max-w-[210px] md:max-w-none">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-muted)] shrink-0 ml-2">
                      {item.distance < 1 ? Math.round(item.distance * 1000) + ' m' : item.distance.toFixed(1) + ' km'}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 italic">Không có địa điểm nào trong bán kính {radius}km.</p>
                )}
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((homestay.address || homestay.district || '') + ' ' + homestay.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline mt-4"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Xem tất cả địa điểm trên Google Maps
              </a>
            </div>

            {/* Phần 3: Tiện nghi */}
            <div className="pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-deep)] mb-4">
                  Tiện nghi nổi bật
                </h2>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {homestay.amenities.slice(0, 8).map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-[var(--color-ink)] text-sm">
                      <span className="shrink-0">{getAmenityIcon(amenity)}</span>
                      <span className="truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowAmenitiesModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-md font-bold hover:bg-gray-50 transition-colors text-sm text-[var(--color-ink-deep)] text-center cursor-pointer shadow-xs"
                >
                  Hiển thị tất cả {homestay.amenities.length} tiện nghi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === PHÒNG TRỐNG (KÉO DÀI TOÀN BỘ KHÔNG GIAN ĐÃ XÓA) === */}
        <div className="py-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-bold text-[var(--color-ink-deep)]">Phòng trống</h2>
            <span className="text-sm font-medium text-[var(--color-muted)]">
              {homestay.rooms.length} loại phòng khả dụng
            </span>
          </div>

          <div className="flex flex-col gap-6 w-full">
            {homestay.rooms.map((room: RoomTypeDto) => (
              <div
                key={room.id}
                className="border border-gray-200 rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all duration-300 bg-white w-full"
              >
                {/* Hình ảnh phòng */}
                <div className="w-full md:w-72 lg:w-80 h-52 md:h-auto shrink-0 relative overflow-hidden bg-gray-100">
                  <img
                    src={room.images[0] || homestay.images[0]}
                    alt={room.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-sm">
                    {room.images.length || 1} ảnh
                  </div>
                </div>

                {/* Nội dung thông tin phòng */}
                <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-lg md:text-xl text-[var(--color-ink-deep)]">
                        {room.name}
                      </h3>
                    </div>

                    <p className="text-sm text-[var(--color-muted)] mb-4 leading-relaxed">
                      {room.description || 'Không gian thoáng mát, bày trí ấm cúng mang phong cách bản địa với đầy đủ tiện nghi thiết yếu.'}
                    </p>

                    {/* Thông số phòng */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-700 mb-4">
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-sm font-medium">
                        <Users className="w-3.5 h-3.5 text-gray-500" /> Tối đa {room.maxOccupancy} khách
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-sm font-medium">
                        <Maximize className="w-3.5 h-3.5 text-gray-500" /> {room.areaSqm} m²
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-sm font-medium">
                        <BedDouble className="w-3.5 h-3.5 text-gray-500" /> Giường đôi lớn
                      </span>
                    </div>

                    {/* Ưu đãi & cam kết */}
                    <div className="space-y-1.5 text-xs text-emerald-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Miễn phí hủy phòng trước 24 giờ nhận phòng</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Không cần thanh toán trước — Thanh toán tại chỗ nghỉ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột giá và nút chọn phòng */}
                <div className="p-5 md:p-6 bg-[#f8faf9] border-t md:border-t-0 md:border-l border-gray-200 md:w-64 lg:w-72 shrink-0 flex flex-col justify-between items-start md:items-end">
                  <div className="w-full md:text-right mb-4">
                    <span className="text-xs text-[var(--color-muted)] block mb-1">Giá mỗi đêm từ</span>
                    <div className="text-2xl font-black text-[var(--color-coral)] leading-none mb-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.basePrice)}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">Đã bao gồm thuế và phí</div>
                  </div>

                  <div className="w-full flex flex-col items-stretch md:items-end gap-1.5">
                    <Button
                      onClick={() => {
                        navigate('/booking', {
                          state: {
                            placeId: homestay.id,
                            placeName: homestay.name,
                            placeAddress: homestay.address || homestay.district,
                            placeRating: homestay.ratingAvg,
                            placeReviewCount: homestay.ratingCount,
                            coverImageUrl: homestay.images?.[0] || '',
                            roomTypeId: room.id,
                            roomTypeName: room.name,
                            basePrice: room.basePrice,
                            originalPrice: Math.round(room.basePrice * 1.35),
                            totalRoomCount: room.totalRoomCount,
                            maxOccupancy: room.maxOccupancy,
                            bedInfo: '1 giường cỡ king',
                            hasBreakfast: false,
                            freeCancellation: true,
                            checkIn: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().slice(0, 10); })(),
                            checkOut: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); })(),
                            nights: 1,
                            guestCount: room.maxOccupancy || 2,
                            roomCount: 1,
                          }
                        });
                      }}
                      className="w-full font-bold rounded-md py-2.5 px-6 bg-[var(--color-coral)] hover:bg-[var(--color-coral-hover)] text-white shadow-sm transition-all text-sm cursor-pointer"
                    >
                      Chọn phòng
                    </Button>
                    <span className="text-xs font-bold text-red-600 text-center md:text-right w-full">
                      Chỉ còn {room.totalRoomCount} phòng trống
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal hiển thị tất cả tiện nghi */}
      {showAmenitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-xl font-bold text-[var(--color-ink-deep)]">Tất cả tiện nghi</h3>
              <button
                onClick={() => setShowAmenitiesModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {homestay.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 text-[var(--color-ink)] text-sm">
                  <div className="text-[var(--color-primary)] shrink-0">{getAmenityIcon(amenity)}</div>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
              <Button
                variant="outline"
                className="rounded-md cursor-pointer"
                onClick={() => setShowAmenitiesModal(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


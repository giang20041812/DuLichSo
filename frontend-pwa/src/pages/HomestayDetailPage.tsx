import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, User } from 'lucide-react';
import { PlaceDetail } from '../types/homestay';
import { RoomTypeItem } from '../types/room';
import { fetchPlaceDetail, fetchPlaceRooms } from '../services/placeService';
import HomestayGallery from '../components/homestay/HomestayGallery';
import HomestayHeaderInfo from '../components/homestay/HomestayHeaderInfo';
import HomestayStorySection from '../components/homestay/HomestayStorySection';
import HomestayAmenitiesSection from '../components/homestay/HomestayAmenitiesSection';
import HomestayRoomSection from '../components/homestay/HomestayRoomSection';
import HomestayPoliciesSection from '../components/homestay/HomestayPoliciesSection';
import HomestayLocationSection from '../components/homestay/HomestayLocationSection';
import HomestayContactSection from '../components/homestay/HomestayContactSection';
import HomestayStickyBar from '../components/homestay/HomestayStickyBar';

export default function HomestayDetailPage() {
  const { slug = 'ban-lim-mong-eco-lodge' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const roomSectionRef = useRef<HTMLDivElement>(null);

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [rooms, setRooms] = useState<RoomTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState('homestay');

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchPlaceDetail(slug), fetchPlaceRooms(slug)])
      .then(([placeData, roomsData]) => {
        if (isMounted) {
          setPlace(placeData);
          setRooms(roomsData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load place detail:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleScrollToRooms = () => {
    roomSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || !place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Đang tải thông tin homestay...</p>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'homestay', label: 'Homestay' },
    { id: 'camping', label: 'Camping' },
    { id: 'village', label: 'Bản làng' },
    { id: 'cuisine', label: 'Ẩm thực' },
    { id: 'trekking', label: 'Trekking' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24 text-slate-900">
      {/* Top Brand & Actions Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center font-black text-sm shadow-xs">
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
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-3 space-y-4">
        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryTab(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategoryTab === cat.id
                  ? 'bg-[#0F3E2E] text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb & Back button */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-700 hover:text-slate-950 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại danh sách kết quả
          </button>
          <span className="text-[11px] text-slate-400 truncate max-w-[50%]">
            Homestay &gt; {place.regionName || 'Yên Bái'} &gt; {place.name}
          </span>
        </div>

        {/* Gallery Section */}
        <HomestayGallery media={place.media} categoryTag={place.categoryName} />

        {/* Header Information Card */}
        <HomestayHeaderInfo
          name={place.name}
          address={place.address}
          verifiedGpsText={place.verifiedGpsText}
          priceRefMin={place.priceRefMin}
          priceUnitNote={place.priceUnitNote}
          onCheckAvailability={handleScrollToRooms}
        />

        <hr className="border-slate-200/70" />

        {/* Story Section */}
        <HomestayStorySection description={place.description} />

        <hr className="border-slate-200/70" />

        {/* Amenities Section */}
        <HomestayAmenitiesSection amenities={place.amenities} />

        <hr className="border-slate-200/70" />

        {/* Room Types Section */}
        <div ref={roomSectionRef}>
          <HomestayRoomSection rooms={rooms} onSelectRoom={handleScrollToRooms} />
        </div>

        <hr className="border-slate-200/70" />

        {/* Policies Section */}
        <HomestayPoliciesSection profile={place.homestayProfile} />

        <hr className="border-slate-200/70" />

        {/* Location & Mini Map Section */}
        <HomestayLocationSection
          slug={place.slug}
          name={place.name}
          latitude={place.latitude}
          longitude={place.longitude}
          accessNote={place.accessNote}
        />

        <hr className="border-slate-200/70" />

        {/* Public Contact Section */}
        <HomestayContactSection contacts={place.contacts} />
      </main>

      {/* Fixed Sticky Action Bar */}
      <HomestayStickyBar
        price={place.priceRefMin}
        unitNote={place.priceUnitNote}
        onCheckAvailability={handleScrollToRooms}
      />
    </div>
  );
}

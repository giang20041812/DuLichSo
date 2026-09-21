import { MapPin, Navigation, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HomestayLocationSectionProps {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  accessNote?: string;
}

export default function HomestayLocationSection({
  slug,
  name,
  latitude,
  longitude,
  accessNote = 'Đường bê tông liên thôn, dốc vừa phải, ô tô 16 chỗ vào tận sân. Có biển chỉ dẫn từ đường QL32 vào 2km.'
}: HomestayLocationSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
        <MapPin className="w-5 h-5 text-emerald-700" />
        <h2>Vị trí & Cách di chuyển</h2>
      </div>

      {/* Mini Map Preview Card */}
      <div 
        onClick={() => navigate(`/homestay/${slug}/map`)}
        className="relative h-44 sm:h-48 w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs cursor-pointer group bg-emerald-50"
      >
        {/* Stylized Mountainous Map Graphic / OSM Layer Preview */}
        <div className="absolute inset-0 bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px] bg-emerald-50/80 flex items-center justify-center">
          <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-emerald-200 via-teal-100 to-sky-100" />
          
          {/* Topographic Lines simulation */}
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50%" cy="50%" r="80" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="130" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M 0,100 Q 150,50 300,120 T 600,100" fill="none" stroke="#10b981" strokeWidth="2" />
          </svg>

          {/* Central Pin */}
          <div className="relative z-10 flex flex-col items-center group-hover:scale-105 transition-transform duration-200">
            <div className="px-3 py-1.5 rounded-xl bg-white shadow-md border border-emerald-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block line-clamp-1">{name}</span>
                <span className="text-[10px] text-slate-500 block">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-xs" />
          </div>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span className="px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1 shadow-xs">
            Bấm để xem bản đồ
          </span>
        </div>
      </div>

      {/* Road Access Note */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs sm:text-sm text-emerald-950">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {accessNote}
        </p>
      </div>

      {/* Button to Full Screen Map */}
      <button
        type="button"
        onClick={() => navigate(`/homestay/${slug}/map`)}
        className="w-full py-3 px-4 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <Navigation className="w-4 h-4 text-sky-700" />
        Mở bản đồ toàn màn hình (QA UC - 03)
      </button>
    </section>
  );
}

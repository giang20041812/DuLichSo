import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, User, FlaskConical } from 'lucide-react';
import { MapContextData, MapViewerScenario } from '../types/integrations/google-maps';
import { fetchMapContext } from '../services/placeService';
import InteractiveMapView from '../components/map/InteractiveMapView';
import MapSlideUpSheet from '../components/map/MapSlideUpSheet';

export default function FullScreenMapPage() {
  const { slug = 'ban-lim-mong-eco-lodge' } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [mapContext, setMapContext] = useState<MapContextData | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCENARIO_1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchMapContext(slug)
      .then((data) => {
        if (isMounted) {
          setMapContext(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load map context:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading || !mapContext) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Đang khởi tạo bản đồ toàn màn hình...</p>
        </div>
      </div>
    );
  }

  const fallbackScenario: MapViewerScenario = {
    id: 'SCENARIO_1',
    code: 'MAP-DEF-01',
    label: '1. Mặc định',
    targetName: mapContext.placeName,
    latitude: mapContext.coordinates.latitude,
    longitude: mapContext.coordinates.longitude,
    zoomLevel: 14,
  };

  const currentScenario: MapViewerScenario =
    mapContext.scenarios.find((s) => s.id === activeScenarioId) || mapContext.scenarios[0] || fallbackScenario;

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-slate-100">
      {/* Top Header Bar */}
      <header className="relative z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
              Full Screen Map Viewer
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveScenarioId('SCENARIO_1')}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              title="Định vị về mục tiêu chính"
              aria-label="Định vị về mục tiêu chính"
            >
              <Crosshair className="w-4 h-4" />
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

        {/* QA Test Scenarios & Presets Bar */}
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
              Kịch bản kiểm thử nghiệm thu (QA UC-03)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 font-mono text-[10px] font-bold">
              {currentScenario.code}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {mapContext.scenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveScenarioId(sc.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeScenarioId === sc.id
                    ? 'bg-[#0F3E2E] text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Map Viewport */}
      <main className="flex-1 relative w-full h-full">
        <InteractiveMapView
          centerLat={currentScenario.latitude}
          centerLng={currentScenario.longitude}
          placeName={currentScenario.targetName}
          zoomLevel={currentScenario.zoomLevel}
          pois={mapContext.pois}
        />

        {/* Slide-Up Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
          <MapSlideUpSheet
            placeName={currentScenario.targetName}
            address={mapContext.address}
            latitude={currentScenario.latitude}
            longitude={currentScenario.longitude}
            altitudeMeters={currentScenario.altitudeMeters || mapContext.altitudeMeters}
            accessNote={currentScenario.accessNote || mapContext.accessNote}
            verificationBadge={mapContext.verificationBadge}
            onBackToDetail={() => navigate(`/homestay/${slug}`)}
          />
        </div>
      </main>
    </div>
  );
}

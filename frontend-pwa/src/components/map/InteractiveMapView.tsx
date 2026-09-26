import { MapPoiItem } from '../../types/integrations/google-maps';
import VietmapView from './VietmapView';
import type { VietmapMarkerItem } from '@/types/integrations/vietmap';

interface InteractiveMapViewProps {
  centerLat: number;
  centerLng: number;
  placeName: string;
  pois?: MapPoiItem[];
  zoomLevel?: number;
  onMarkerSelect?: (poi: MapPoiItem | null) => void;
}

export default function InteractiveMapView({
  centerLat = 21.85,
  centerLng = 104.08,
  placeName,
  pois = [],
  zoomLevel = 14,
  onMarkerSelect
}: InteractiveMapViewProps) {
  // Convert pois to VietmapMarkerItem format
  const vietmapMarkers: VietmapMarkerItem[] = [
    {
      id: 'main-place',
      name: placeName,
      latitude: centerLat,
      longitude: centerLng,
      isMain: true,
      kind: 'HOMESTAY',
      displayMode: 'name' as const,
    },
    ...pois.map((poi, idx): VietmapMarkerItem => ({
      id: `poi-${idx}`,
      name: poi.name,
      latitude: poi.latitude,
      longitude: poi.longitude,
      district: poi.category,
      kind: poi.category,
      category: poi.category,
      displayMode: 'name' as const,
    }))
  ];

  return (
    <div className="relative w-full h-full">
      <VietmapView
        centerLat={centerLat}
        centerLng={centerLng}
        zoomLevel={zoomLevel}
        markers={vietmapMarkers}
        className="w-full h-full min-h-screen"
        onMarkerClick={(m) => {
          if (m.id === 'main-place') {
            onMarkerSelect?.(null);
          } else {
            const foundPoi = pois.find(p => p.name === m.name);
            onMarkerSelect?.(foundPoi || null);
          }
        }}
      />
    </div>
  );
}


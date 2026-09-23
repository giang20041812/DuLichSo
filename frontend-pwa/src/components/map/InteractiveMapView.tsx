import { MapPoiItem } from '../../types/integrations/google-maps';
import OpenStreetMapView, { OsmMarkerItem } from './OpenStreetMapView';

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
  // Convert pois to OsmMarkerItem format
  const osmMarkers: OsmMarkerItem[] = [
    {
      id: 'main-place',
      name: placeName,
      latitude: centerLat,
      longitude: centerLng,
    },
    ...pois.map((poi, idx) => ({
      id: `poi-${idx}`,
      name: poi.name,
      latitude: poi.latitude,
      longitude: poi.longitude,
      district: poi.category,
    }))
  ];

  return (
    <div className="relative w-full h-full">
      <OpenStreetMapView
        centerLat={centerLat}
        centerLng={centerLng}
        zoomLevel={zoomLevel}
        markers={osmMarkers}
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

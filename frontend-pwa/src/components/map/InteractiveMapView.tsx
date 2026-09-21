import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Plus, Minus, Maximize2 } from 'lucide-react';
import { MapPoiItem } from '../../types/integrations/google-maps';

interface InteractiveMapViewProps {
  centerLat: number;
  centerLng: number;
  placeName: string;
  pois?: MapPoiItem[];
  zoomLevel?: number;
  onMarkerSelect?: (poi: MapPoiItem | null) => void;
}

type MapLayerType = 'terrain' | 'satellite' | 'streets';

export default function InteractiveMapView({
  centerLat,
  centerLng,
  placeName,
  pois = [],
  zoomLevel = 15,
  onMarkerSelect
}: InteractiveMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('terrain');

  const getTileUrl = (type: MapLayerType) => {
    switch (type) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'terrain':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false
      });

      const initialLayer = L.tileLayer(getTileUrl(activeLayer), {
        maxZoom: 19
      }).addTo(map);

      activeTileLayerRef.current = initialLayer;
      const markerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = markerGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center & zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], zoomLevel, { animate: true });
    }
  }, [centerLat, centerLng, zoomLevel]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const group = layerGroupRef.current;
    group.clearLayers();

    // 1. Primary Homestay Pin (custom HTML pin matching image 4)
    const primaryIcon = L.divIcon({
      className: 'custom-primary-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
          <div style="background: white; padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; white-space: nowrap; margin-bottom: 4px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; display: flex; items-center; gap: 4px;">
              <span style="color: #ea580c;">📍</span> ${placeName}
            </div>
            <div style="font-size: 9px; color: #64748b;">${centerLat.toFixed(6)}° N, ${centerLng.toFixed(6)}° E</div>
          </div>
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #0F3E2E; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; position: relative;">
            <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: #ea580c; border: 2px solid white;"></div>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0F3E2E; margin-top: -1px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const primaryMarker = L.marker([centerLat, centerLng], { icon: primaryIcon });
    primaryMarker.on('click', () => onMarkerSelect?.(null));
    group.addLayer(primaryMarker);

    // 2. Surrounding POI Pins
    pois.forEach((poi) => {
      let bg = '#3b82f6';
      let iconSvg = '🏪';
      if (poi.category === 'ATTRACTION') {
        bg = '#a855f7';
        iconSvg = '📷';
      } else if (poi.category === 'SERVICE') {
        bg = '#ec4899';
        iconSvg = '♨️';
      }

      const poiIcon = L.divIcon({
        className: 'custom-poi-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="background: white; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.12); border: 1px solid #f1f5f9; font-size: 10px; font-weight: 600; color: #1e293b; margin-bottom: 2px; white-space: nowrap;">
              ${poi.name}
            </div>
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${bg}; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 12px;">
              ${iconSvg}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const poiMarker = L.marker([poi.latitude, poi.longitude], { icon: poiIcon });
      poiMarker.on('click', () => onMarkerSelect?.(poi));
      group.addLayer(poiMarker);
    });
  }, [centerLat, centerLng, placeName, pois, onMarkerSelect]);

  // Handle Layer Toggle
  const toggleLayer = () => {
    if (!mapInstanceRef.current) return;
    const nextLayer: MapLayerType = activeLayer === 'terrain' ? 'satellite' : activeLayer === 'satellite' ? 'streets' : 'terrain';
    setActiveLayer(nextLayer);

    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }
    const newLayer = L.tileLayer(getTileUrl(nextLayer), { maxZoom: 19 }).addTo(mapInstanceRef.current);
    activeTileLayerRef.current = newLayer;
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.setView([centerLat, centerLng], zoomLevel, { animate: true });
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleLayer}
          className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          title={`Đổi kiểu bản đồ (hiện tại: ${activeLayer})`}
          aria-label="Đổi kiểu bản đồ"
        >
          <Layers className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          title="Phóng to"
          aria-label="Phóng to"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          title="Thu nhỏ"
          aria-label="Thu nhỏ"
        >
          <Minus className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          title="Định vị về trung tâm"
          aria-label="Định vị về trung tâm"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

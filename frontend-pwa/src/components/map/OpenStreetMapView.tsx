import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface OsmMarkerItem {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  price?: number;
  coverImageUrl?: string;
  district?: string;
  address?: string;
  ratingScore?: number;
  url?: string;
  isMain?: boolean;
  kind?: string;
  distance?: number;
}

interface OpenStreetMapViewProps {
  centerLat: number;
  centerLng: number;
  zoomLevel?: number;
  markers?: OsmMarkerItem[];
  className?: string;
  onMarkerClick?: (marker: OsmMarkerItem) => void;
}

export default function OpenStreetMapView({
  centerLat = 21.85,
  centerLng = 104.08,
  zoomLevel = 13,
  markers = [],
  className = "w-full h-full min-h-[350px] rounded-lg overflow-hidden",
  onMarkerClick
}: OpenStreetMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map is already initialized on this container
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoomLevel,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add OpenStreetMap Standard Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], zoomLevel);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update center when props change
  useEffect(() => {
    if (mapInstanceRef.current && centerLat && centerLng) {
      mapInstanceRef.current.setView([centerLat, centerLng], zoomLevel);
    }
  }, [centerLat, centerLng, zoomLevel]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    markers.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      const position: [number, number] = [item.latitude, item.longitude];
      bounds.extend(position);

      const formattedPrice = item.price 
        ? `${(item.price / 1000).toLocaleString('vi-VN')}k`
        : '';

      const isMainHomestay = item.isMain ?? (item.price !== undefined);
      const bgColor = isMainHomestay ? '#048c73' : (item.kind === 'FOOD' ? '#ea580c' : item.kind === 'ATTRACTION' ? '#0284c7' : '#0d9488');
      const iconSymbol = isMainHomestay ? '🏡' : (item.kind === 'FOOD' ? '🍜' : item.kind === 'ATTRACTION' ? '⛰️' : item.kind === 'TRANSPORT' ? '🚌' : '📍');

      // Create Custom Leaflet DivIcon with Eco Tropical Glow styling
      const markerHtml = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transform: translate(-50%, -100%);
          z-index: ${isMainHomestay ? '1000' : '500'};
        ">
          <div style="
            background: ${bgColor};
            color: white;
            font-size: ${isMainHomestay ? '12px' : '11px'};
            font-weight: 700;
            padding: ${isMainHomestay ? '3px 8px' : '2px 6px'};
            border-radius: 6px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            border: 2px solid white;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>${iconSymbol}</span>
            <span>${formattedPrice || (item.name.length > 20 ? item.name.slice(0, 18) + '...' : item.name)}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid ${bgColor};
            margin-top: -1px;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'osm-custom-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const popupHtml = `
        <div style="max-width: 220px; font-family: sans-serif; padding: 2px;">
          ${item.coverImageUrl ? `
            <img 
              src="${item.coverImageUrl}" 
              alt="${item.name}" 
              style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" 
            />
          ` : ''}
          <div style="font-weight: 700; font-size: 13px; color: #0a2e26; line-height: 1.3; margin-bottom: 3px;">
            ${item.name}
          </div>
          ${item.address || item.district ? `
            <div style="font-size: 11px; color: #59766e; margin-bottom: 4px;">
              📍 ${item.address || item.district}
            </div>
          ` : ''}
          ${item.distance !== undefined ? `
            <div style="font-size: 11px; font-weight: 600; color: #048c73; margin-bottom: 4px;">
              Khoảng cách: ${item.distance < 1 ? Math.round(item.distance * 1000) + ' m' : item.distance.toFixed(1) + ' km'}
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            ${item.price ? `
              <div style="font-weight: 800; font-size: 13px; color: #ea580c;">
                ${item.price.toLocaleString('vi-VN')} đ<span style="font-size: 10px; font-weight: normal; color: #666;">/đêm</span>
              </div>
            ` : '<div></div>'}
            ${item.url ? `
              <a 
                href="${item.url}" 
                style="
                  display: inline-block;
                  background: #048c73;
                  color: white;
                  font-size: 10px;
                  font-weight: 700;
                  padding: 4px 8px;
                  border-radius: 4px;
                  text-decoration: none;
                "
              >
                Xem chi tiết
              </a>
            ` : ''}
          </div>
        </div>
      `;

      const leafletMarker = L.marker(position, { icon: customIcon })
        .bindPopup(popupHtml, { maxWidth: 240, className: 'osm-custom-popup' });

      leafletMarker.on('click', () => {
        onMarkerClick?.(item);
      });

      if (markersLayerRef.current) {
        markersLayerRef.current.addLayer(leafletMarker);
      }
    });

    // Auto-fit bounds if multiple markers exist
    if (markers.length > 1 && bounds.isValid() && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [markers, onMarkerClick]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] z-10" />
    </div>
  );
}

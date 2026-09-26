import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, KeyRound } from 'lucide-react';
import type { VietmapMarkerItem, VietmapViewProps } from '@/types/integrations/vietmap';

export type { VietmapMarkerItem, VietmapViewProps };

interface CategoryStyle {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  svgIcon: string;
  badgeBg: string;
  badgeText: string;
}

function getMarkerCategoryStyle(item: VietmapMarkerItem): CategoryStyle {
  const rawKind = (item.kind || item.category || '').toUpperCase();

  // 1. Homestay / Chỗ nghỉ: Solid Deep Forest Teal
  if (item.isMain || rawKind === 'HOMESTAY' || rawKind.includes('LODGE') || rawKind.includes('RESORT') || rawKind.includes('HOTEL')) {
    return {
      label: 'Chỗ nghỉ',
      bgColor: '#048C73',
      textColor: '#FFFFFF',
      borderColor: item.isMain ? '#F59E0B' : '#036855',
      shadowColor: 'rgba(4, 140, 115, 0.4)',
      svgIcon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      badgeBg: '#EDFBF7',
      badgeText: '#048C73',
    };
  }

  // 2. Ẩm thực / Nhà hàng: Solid Warm Crimson Coral
  if (rawKind === 'FOOD' || rawKind === 'RESTAURANT' || rawKind === 'CUISINE' || rawKind.includes('ĂN') || rawKind.includes('QUÁN')) {
    return {
      label: 'Ẩm thực',
      bgColor: '#DC2626',
      textColor: '#FFFFFF',
      borderColor: '#B91C1C',
      shadowColor: 'rgba(220, 38, 38, 0.4)',
      svgIcon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v14a2 2 0 0 1-2 2H9"/><line x1="6" y1="2" x2="6" y2="22"/></svg>`,
      badgeBg: '#FEF2F2',
      badgeText: '#DC2626',
    };
  }

  // 3. Danh thắng / Check-in: Solid Royal Sapphire Blue
  if (rawKind === 'ATTRACTION' || rawKind === 'DESTINATION' || rawKind === 'EXPERIENCE' || rawKind.includes('CẢNH') || rawKind.includes('THẮNG')) {
    return {
      label: 'Thắng cảnh',
      bgColor: '#2563EB',
      textColor: '#FFFFFF',
      borderColor: '#1D4ED8',
      shadowColor: 'rgba(37, 99, 235, 0.4)',
      svgIcon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`,
      badgeBg: '#EFF6FF',
      badgeText: '#2563EB',
    };
  }

  // 4. Di chuyển / Phương tiện: Solid Amber Gold
  if (rawKind === 'TRANSPORT' || rawKind === 'BUS' || rawKind === 'STATION' || rawKind.includes('XE') || rawKind.includes('BẾN')) {
    return {
      label: 'Di chuyển',
      bgColor: '#D97706',
      textColor: '#FFFFFF',
      borderColor: '#B45309',
      shadowColor: 'rgba(217, 119, 6, 0.4)',
      svgIcon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.2 6 18.2 6H5.8C4.8 6 3.9 6.8 3.6 7.8L2.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
      badgeBg: '#FFFBEB',
      badgeText: '#D97706',
    };
  }

  // 5. Chợ / Mua sắm: Solid Rich Purple
  if (rawKind === 'MARKET' || rawKind === 'SHOPPING' || rawKind.includes('CHỢ') || rawKind.includes('TẠP HOÁ') || rawKind.includes('MUA SẮM')) {
    return {
      label: 'Chợ / Mua sắm',
      bgColor: '#7C3AED',
      textColor: '#FFFFFF',
      borderColor: '#6D28D9',
      shadowColor: 'rgba(124, 58, 237, 0.4)',
      svgIcon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
      badgeBg: '#F5F3FF',
      badgeText: '#7C3AED',
    };
  }

  // 6. Dịch vụ / Khoáng nóng / Tiện ích: Solid Dark Slate
  if (rawKind === 'SERVICE' || rawKind === 'UTILITY' || rawKind === 'HOT_SPRING' || rawKind.includes('KHOÁNG') || rawKind.includes('SPA')) {
    return {
      label: 'Dịch vụ',
      bgColor: '#0F172A',
      textColor: '#FFFFFF',
      borderColor: '#334155',
      shadowColor: 'rgba(15, 23, 42, 0.4)',
      svgIcon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      badgeBg: '#F1F5F9',
      badgeText: '#0F172A',
    };
  }

  // Mặc định: Solid Neutral Gray-Green
  return {
    label: 'Địa điểm',
    bgColor: '#475569',
    textColor: '#FFFFFF',
    borderColor: '#334155',
    shadowColor: 'rgba(71, 85, 105, 0.4)',
    svgIcon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    badgeBg: '#F8FAFC',
    badgeText: '#475569',
  };
}

export default function VietmapView({
  centerLat = 21.85,
  centerLng = 104.08,
  zoomLevel = 13,
  markers = [],
  className = "w-full h-full min-h-[350px] rounded-lg overflow-hidden",
  onMarkerClick
}: VietmapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY as string | undefined)?.trim() || '';
  const [hasTileError, setHasTileError] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoomLevel,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Tải VietMap Raster Tiles
      // Sử dụng VietMap Tile endpoint với API Key
      if (vietmapApiKey) {
        const tileUrl = `https://maps.vietmap.vn/tm/{z}/{x}/{y}.png?apikey=${encodeURIComponent(vietmapApiKey)}`;
        const vietmapTileLayer = L.tileLayer(tileUrl, {
          attribution: '&copy; <a href="https://maps.vietmap.vn" target="_blank" rel="noopener noreferrer">VietMap</a> contributors',
          maxZoom: 19,
        });

        vietmapTileLayer.on('tileerror', () => {
          setHasTileError(true);
        });

        vietmapTileLayer.addTo(map);
      } else {
        // Fallback: Nếu chưa có VietMap key, hiển thị nền bản đồ trung lập
        // Tuyệt đối không dùng OSM để tránh vi phạm chủ quyền Hoàng Sa - Trường Sa
        setHasTileError(false);
      }

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
  }, [vietmapApiKey]);

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

      const isMainHomestay = Boolean(item.isMain);
      const catStyle = getMarkerCategoryStyle(item);

      // Resolve tag display label (Tên homestay/dịch vụ hoặc giá theo displayMode)
      let displayTagText = item.name;
      if (item.tagText) {
        displayTagText = item.tagText;
      } else if (item.displayMode === 'price' && item.price) {
        displayTagText = `${(item.price / 1000).toLocaleString('vi-VN')}k`;
      } else {
        displayTagText = item.name;
      }

      // Truncate length if needed
      const maxLen = isMainHomestay ? 26 : 20;
      const formattedLabel = displayTagText.length > maxLen
        ? `${displayTagText.slice(0, maxLen - 2)}...`
        : displayTagText;

      // Custom Pin Marker: Biểu tượng location pin chuẩn + nhãn tên nằm cạnh pin (không nằm trong pin)
      const pinSize = isMainHomestay ? 32 : 26;
      const innerIconSize = isMainHomestay ? 16 : 13;
      const markerHtml = `
        <div class="vietmap-modern-marker-wrapper" style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transform: translate(-${pinSize / 2}px, -100%);
          z-index: ${isMainHomestay ? '1000' : '500'};
          white-space: nowrap;
          pointer-events: auto;
        ">
          <!-- 1. Biểu tượng Location Pin sắc nét -->
          <div class="vietmap-pin-badge" style="
            position: relative;
            width: ${pinSize}px;
            height: ${pinSize}px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${catStyle.bgColor};
            color: ${catStyle.textColor};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid ${isMainHomestay ? '#F59E0B' : '#FFFFFF'};
            box-shadow: 0 4px 10px ${catStyle.shadowColor};
            transition: transform 0.18s ease;
          ">
            <span style="
              transform: rotate(45deg);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: ${innerIconSize}px;
              height: ${innerIconSize}px;
            ">
              ${catStyle.svgIcon}
            </span>
          </div>

          <!-- 2. Nhãn tên / giá nằm cạnh (bên phải) biểu tượng Location -->
          <div class="vietmap-pin-label" style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #FFFFFF;
            color: #0F172A;
            border: 1px solid #E2E8F0;
            border-left: 3px solid ${catStyle.bgColor};
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
            padding: ${isMainHomestay ? '3px 8px' : '2px 6px'};
            border-radius: 4px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${isMainHomestay ? '11.5px' : '10.5px'};
            font-weight: ${isMainHomestay ? '700' : '600'};
            line-height: 1.25;
            letter-spacing: -0.01em;
            transform: translateY(-${pinSize / 3}px);
            pointer-events: auto;
          ">
            <span>${formattedLabel}</span>
            ${isMainHomestay ? `<span style="font-size: 8.5px; background: #F59E0B; color: #FFFFFF; padding: 0.5px 3.5px; border-radius: 2px; font-weight: 700;">Chính</span>` : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'vietmap-custom-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const popupHtml = `
        <div style="max-width: 230px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2px;">
          ${item.coverImageUrl ? `
            <div style="position: relative; overflow: hidden; border-radius: 4px; margin-bottom: 7px;">
              <img 
                src="${item.coverImageUrl}" 
                alt="${item.name}" 
                style="width: 100%; height: 110px; object-fit: cover; display: block;" 
              />
              <div style="
                position: absolute; 
                top: 5px; 
                left: 5px; 
                background: ${catStyle.bgColor}; 
                color: white; 
                font-size: 10px; 
                font-weight: 700; 
                padding: 2px 6px; 
                border-radius: 3px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.25);
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <span style="display: flex; align-items: center;">${catStyle.svgIcon}</span> ${catStyle.label}
              </div>
            </div>
          ` : `
            <div style="
              display: inline-flex; 
              align-items: center; 
              gap: 4px; 
              background: ${catStyle.badgeBg}; 
              color: ${catStyle.badgeText}; 
              font-size: 10px; 
              font-weight: 700; 
              padding: 2px 6px; 
              border-radius: 3px; 
              margin-bottom: 6px;
              border: 1px solid ${catStyle.borderColor}33;
            ">
              <span style="display: flex; align-items: center;">${catStyle.svgIcon}</span> ${catStyle.label}
            </div>
          `}

          <div style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.35; margin-bottom: 4px;">
            ${item.name}
          </div>

          ${item.address || item.district ? `
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px; display: flex; align-items: start; gap: 3px;">
              <span style="color: ${catStyle.bgColor}; flex-shrink: 0; font-size: 11px;">📍</span>
              <span style="overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                ${item.address || item.district}
              </span>
            </div>
          ` : ''}

          ${item.distance !== undefined ? `
            <div style="font-size: 11px; font-weight: 600; color: #048c73; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>
              <span>Khoảng cách: ${item.distance < 1 ? Math.round(item.distance * 1000) + ' m' : item.distance.toFixed(1) + ' km'}</span>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
            ${item.price ? `
              <div style="font-weight: 800; font-size: 13px; color: #ea580c;">
                ${item.price.toLocaleString('vi-VN')} đ<span style="font-size: 10px; font-weight: 600; color: #64748b;">/đêm</span>
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
                  box-shadow: 0 2px 4px rgba(4,140,115,0.2);
                "
              >
                Xem chi tiết →
              </a>
            ` : ''}
          </div>
        </div>
      `;

      const leafletMarker = L.marker(position, { icon: customIcon })
        .bindPopup(popupHtml, { maxWidth: 250, className: 'vietmap-custom-popup' });

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
      {/* Cảnh báo chưa có API Key */}
      {!vietmapApiKey && (
        <div className="absolute top-3 left-3 right-3 z-[1000] p-3 rounded-md bg-amber-500/95 text-white backdrop-blur-xs shadow-md border border-amber-600/30 flex items-start gap-2.5 text-xs">
          <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Chưa cấu hình API Key VietMap (VITE_VIETMAP_API_KEY)</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Vui lòng mở file <code className="bg-black/20 px-1 py-0.5 rounded font-mono">.env</code> và nhập API Key của <strong>Tilemap Consumer</strong> từ VietMap Console để hiển thị bản đồ nền.
            </p>
          </div>
        </div>
      )}

      {/* Cảnh báo lỗi tải Tile (Do nhầm API key của Services Consumer) */}
      {hasTileError && vietmapApiKey && (
        <div className="absolute top-3 left-3 right-3 z-[1000] p-3 rounded-md bg-rose-600/95 text-white backdrop-blur-xs shadow-md border border-rose-700/30 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Lỗi tải bản đồ nền VietMap (Kiểm tra API Key)</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Nếu bạn thấy thông báo <em>"This consumer only has APIs enabled..."</em>, nghĩa là bạn đang dùng API Key của dịch vụ APIs (Search/Route).
              Hãy vào VietMap Console &gt; Consumers, tạo/chọn consumer loại <strong>Tilemap</strong> và copy API Key đó vào <code className="bg-black/20 px-1 py-0.5 rounded font-mono">VITE_VIETMAP_API_KEY</code>.
            </p>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] z-10 bg-slate-100" />
    </div>
  );
}

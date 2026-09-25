import { useMemo, useState } from 'react';
import { X, MapPin, Navigation, Utensils, Car, Compass, Package, Phone } from 'lucide-react';
import OpenStreetMapView, { OsmMarkerItem } from '@/components/map/OpenStreetMapView';
import { BookingServiceItemDto } from '@/types/booking';
import { NearbyPlaceDto } from '@/types/homestay';

interface BookingServicesMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  placeAddress?: string;
  placeLat?: number | null;
  placeLng?: number | null;
  serviceItems?: BookingServiceItemDto[];
  nearbyPlaces?: NearbyPlaceDto[];
}

export default function BookingServicesMapModal({
  isOpen,
  onClose,
  placeName,
  placeAddress,
  placeLat,
  placeLng,
  serviceItems = [],
  nearbyPlaces = [],
}: BookingServicesMapModalProps) {
  const [selectedServiceCode, setSelectedServiceCode] = useState<string | null>(null);

  // Tâm bản đồ: Ưu tiên tọa độ homestay
  const centerLat = placeLat && placeLat !== 0 ? placeLat : 21.84912;
  const centerLng = placeLng && placeLng !== 0 ? placeLng : 104.09245;

  // Ghép dịch vụ với NearbyPlace tương ứng để lấy thông tin tọa độ, khoảng cách
  const mappedServices = useMemo(() => {
    return serviceItems.map((svc, index) => {
      // Tìm theo serviceCode dạng NEARBY_KIND_ID
      let matchedPlace: NearbyPlaceDto | undefined;
      if (svc.serviceCode && svc.serviceCode.startsWith('NEARBY_')) {
        const parts = svc.serviceCode.split('_');
        const lastPart = parts[parts.length - 1];
        const idNum = lastPart ? parseInt(lastPart, 10) : NaN;
        if (!isNaN(idNum)) {
          matchedPlace = nearbyPlaces.find((p) => p.id === idNum);
        }
      }

      // Nếu không thấy qua ID, tìm theo tên gần đúng
      if (!matchedPlace) {
        matchedPlace = nearbyPlaces.find(
          (p) =>
            svc.serviceName.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(svc.serviceName.toLowerCase())
        );
      }

      return {
        key: svc.serviceCode || `svc-${index}`,
        service: svc,
        place: matchedPlace,
      };
    });
  }, [serviceItems, nearbyPlaces]);

  // Tạo danh sách markers cho bản đồ
  const markers: OsmMarkerItem[] = useMemo(() => {
    const list: OsmMarkerItem[] = [];

    // 1. Marker của Homestay (Trung tâm, isMain = true)
    list.push({
      id: 'homestay-main',
      name: placeName,
      latitude: centerLat,
      longitude: centerLng,
      isMain: true,
      address: placeAddress || 'Điểm lưu trú chính',
      tagText: 'Chỗ nghỉ',
      kind: 'HOMESTAY',
    });

    // 2. Markers của các dịch vụ tư vấn đã chọn có tọa độ
    mappedServices.forEach((item, index) => {
      const p = item.place;
      if (p && p.latitude && p.longitude) {
        list.push({
          id: item.key,
          name: item.service.serviceName,
          latitude: p.latitude,
          longitude: p.longitude,
          address: p.address || undefined,
          distance: p.distance,
          kind: p.kind,
          tagText: getKindBadgeText(p.kind),
          isMain: false,
        });
      } else {
        // Nếu không có tọa độ chính xác của điểm nearby, tạo tọa độ lân cận homestay nhẹ để người dùng vẫn thấy
        const angle = (index * 2 * Math.PI) / Math.max(1, mappedServices.length);
        const radius = 0.003; // ~300m
        list.push({
          id: item.key,
          name: item.service.serviceName,
          latitude: centerLat + Math.sin(angle) * radius,
          longitude: centerLng + Math.cos(angle) * radius,
          address: 'Dịch vụ đối tác trong khu vực bản địa',
          kind: 'PARTNER',
          tagText: 'Dịch vụ tư vấn',
          isMain: false,
        });
      }
    });

    return list;
  }, [placeName, centerLat, centerLng, placeAddress, mappedServices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-4 pt-20 sm:pt-24 pb-8 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)] border border-gray-200 my-auto sm:my-0">
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                Bản đồ dịch vụ &amp; điểm tư vấn đã chọn
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {placeName} • {markers.length - 1} dịch vụ đính kèm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Map + Services List Sidebar */}
        <div className="flex-1 min-h-[380px] sm:min-h-[460px] grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Cột bản đồ OpenStreetMap */}
          <div className="md:col-span-2 relative h-[300px] md:h-full bg-slate-100 border-b md:border-b-0 md:border-r border-gray-200">
            <OpenStreetMapView
              centerLat={centerLat}
              centerLng={centerLng}
              zoomLevel={15}
              markers={markers}
              className="w-full h-full"
            />
            {/* Chú thích map overlay góc trái dưới */}
            <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-gray-200/80 shadow-xs flex items-center gap-3 text-[11px] font-medium text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#048C73] inline-block border border-white shadow-2xs"></span>
                <span>Homestay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] inline-block border border-white shadow-2xs"></span>
                <span>Dịch vụ đã chọn</span>
              </div>
            </div>
          </div>

          {/* Cột danh sách dịch vụ */}
          <div className="flex flex-col bg-slate-50/60 overflow-hidden h-[240px] md:h-full">
            <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Danh sách dịch vụ ({mappedServices.length})
              </span>
              <span className="text-[11px] text-[var(--color-primary)] font-medium">
                Vị trí thực tế
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {/* Homestay marker item */}
              <div className="p-2.5 bg-white rounded-md border border-[#048C73]/30 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-sm bg-[#048C73]/10 text-[#048C73]">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {placeName}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                  {placeAddress || 'Chỗ nghỉ chính'}
                </p>
              </div>

              {/* Danh sách các dịch vụ tư vấn */}
              {mappedServices.map((item) => {
                const isSelected = selectedServiceCode === item.key;
                const p = item.place;

                return (
                  <div
                    key={item.key}
                    onClick={() => setSelectedServiceCode(item.key)}
                    className={`p-2.5 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-xs'
                        : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 p-1 rounded-sm bg-orange-50 text-orange-600 shrink-0">
                        {getKindIcon(p?.kind)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">
                            {item.service.serviceName}
                          </span>
                        </div>

                        {p?.distance !== undefined && (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--color-primary)] font-medium mt-0.5">
                            <Navigation className="w-3 h-3" />
                            <span>
                              Cách homestay {formatDistance(p.distance)}
                            </span>
                          </div>
                        )}

                        {item.service.note && (
                          <p className="text-[11px] text-gray-500 mt-1 italic line-clamp-2">
                            "{item.service.note}"
                          </p>
                        )}

                        {p?.contacts && p.contacts.length > 0 && p.contacts[0]?.value && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{p.contacts[0]?.value}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">
            Dữ liệu địa điểm thực tế từ cơ sở dữ liệu Đi Du Lịch.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-slate-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function getKindIcon(kind?: string) {
  if (!kind) return <Compass className="w-3.5 h-3.5" />;
  const k = kind.toUpperCase();
  if (k.includes('FOOD') || k.includes('RESTAURANT') || k.includes('CUISINE')) {
    return <Utensils className="w-3.5 h-3.5" />;
  }
  if (k.includes('TRANSPORT')) {
    return <Car className="w-3.5 h-3.5" />;
  }
  if (k.includes('RENTAL')) {
    return <Package className="w-3.5 h-3.5" />;
  }
  return <MapPin className="w-3.5 h-3.5" />;
}

function getKindBadgeText(kind?: string): string {
  if (!kind) return 'Dịch vụ tư vấn';
  const k = kind.toUpperCase();
  if (k.includes('RESTAURANT') || k.includes('FOOD') || k.includes('CUISINE')) return 'Ẩm thực';
  if (k.includes('TRANSPORT')) return 'Phương tiện';
  if (k.includes('RENTAL')) return 'Thuê đồ & Dụng cụ';
  if (k.includes('ATTRACTION')) return 'Điểm trải nghiệm';
  if (k.includes('PHOTO')) return 'Check-in';
  return 'Dịch vụ tư vấn';
}

function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
}

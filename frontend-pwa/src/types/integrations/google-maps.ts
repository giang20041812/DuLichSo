// Integration types for Google Maps / Geolocation according to official spec

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapPoiItem {
  id: number;
  name: string;
  category: 'HOMESTAY' | 'ATTRACTION' | 'SERVICE' | 'RESTAURANT' | 'MARKET';
  latitude: number;
  longitude: number;
  distanceKm?: number;
  note?: string;
  address?: string;
}

export interface MapViewerScenario {
  id: string;
  code: string; // e.g. "MAP-CUS-01"
  label: string; // e.g. "1. Chuẩn: Bản Lìm Mông"
  targetName: string;
  latitude: number;
  longitude: number;
  zoomLevel: number;
  altitudeMeters?: number;
  accessNote?: string;
  isPrimary?: boolean;
}

export interface MapContextData {
  placeId: number;
  placeSlug: string;
  placeName: string;
  regionName?: string;
  address?: string;
  coordinates: GeoCoordinates;
  altitudeMeters?: number;
  accessNote?: string;
  verificationBadge: string;
  pois: MapPoiItem[];
  scenarios: MapViewerScenario[];
}

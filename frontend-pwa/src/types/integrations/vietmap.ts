// VietMap Integration Types — DuLichSo Project
// Dữ liệu bản đồ số Việt Nam khẳng định chủ quyền lãnh thổ & biển đảo Hoàng Sa, Trường Sa

export interface VietmapMarkerItem {
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
  category?: string;
  distance?: number;
  displayMode?: 'name' | 'price' | 'auto';
  tagText?: string;
}

export interface VietmapViewProps {
  centerLat?: number;
  centerLng?: number;
  zoomLevel?: number;
  markers?: VietmapMarkerItem[];
  className?: string;
  onMarkerClick?: (marker: VietmapMarkerItem) => void;
}

export type VietmapTileStyle = 'street' | 'satellite';

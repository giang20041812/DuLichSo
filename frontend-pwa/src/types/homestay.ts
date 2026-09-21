// Types for Homestay & Place Detail Module matching backend-api DTOs

export type PlaceOperationStatus = 'OPERATING' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';
export type PlaceVerificationStatus = 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OFFICIAL_VERIFIED';
export type ContactChannel = 'PHONE' | 'EMAIL' | 'ZALO' | 'FACEBOOK' | 'WEBSITE';
export type AmenityValue = 'YES' | 'NO' | 'OPTIONAL' | 'UNVERIFIED';
export type HighlightType = 'PRO' | 'CON' | 'TIP';

export interface PlaceMediaItem {
  id: number;
  publicUrl: string;
  role: 'COVER' | 'GALLERY' | 'MENU' | 'AVATAR';
  caption?: string;
  sortOrder?: number;
}

export interface PlaceAmenityItem {
  id: number;
  code: string;
  name: string;
  icon?: string;
  value: AmenityValue;
  note?: string;
}

export interface PlaceContactItem {
  id: number;
  channel: ContactChannel;
  value: string;
  isPublic: boolean;
  sortOrder: number;
}

export interface PlaceHighlightItem {
  id: number;
  type: HighlightType;
  content: string;
}

export interface CancellationPolicySummary {
  id: number;
  name: string;
  description: string;
}

export interface HomestayProfileDetail {
  placeId: number;
  checkInFrom: string; // e.g. "14:00"
  checkOutUntil: string; // e.g. "12:00"
  houseRules?: string;
  surchargeNote?: string;
  currentPolicy?: CancellationPolicySummary;
}

export interface PlaceDetail {
  id: number;
  slug: string;
  name: string;
  categoryKind: string;
  categoryName?: string;
  regionName?: string;
  address?: string;
  latitude: number;
  longitude: number;
  accessNote?: string;
  priceRefMin?: number;
  priceRefMax?: number;
  priceUnitNote?: string;
  operationStatus: PlaceOperationStatus;
  verification: PlaceVerificationStatus;
  ratingAvg?: number;
  ratingCount: number;
  description?: string;
  altitudeMeters?: number;
  verifiedGpsText?: string;
  
  // Rich embedded objects
  media: PlaceMediaItem[];
  amenities: PlaceAmenityItem[];
  contacts: PlaceContactItem[];
  highlights: PlaceHighlightItem[];
  homestayProfile?: HomestayProfileDetail;
}

export interface HomestayDto {
  id: string;
  name: string;
  coverImageUrl: string;
  images?: string[];
  description?: string;
  
  // Location
  district?: string;
  distanceFromCenter?: string;
  
  // Rating
  ratingScore: number;
  ratingText: string;
  reviewCount: number;
  
  // Badges
  isGenius?: boolean;
  promotionalBadge?: string;
  
  // Room Info
  roomType: string;
  bedInfo: string;
  
  // Policies
  freeCancellation?: boolean;
  noPrepayment?: boolean;
  scarcityMessage?: string; // e.g. "Chúng tôi còn 2 với giá này"
  
  // Pricing
  originalPrice?: number;
  price: number;
  priceDetails?: string; // e.g. "Giá cho 1 đêm, 2 người lớn"
  taxesAndFeesIncluded?: boolean;
}

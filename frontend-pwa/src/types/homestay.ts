// Types for Homestay & Place Detail Module matching backend-api DTOs

export type PlaceOperationStatus = 'OPERATING' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';
export type PlaceVerificationStatus = 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OFFICIAL_VERIFIED';
export type ContactChannel = 'PHONE' | 'EMAIL' | 'ZALO' | 'FACEBOOK' | 'WEBSITE' | 'TIKTOK' | 'YOUTUBE' | 'GOOGLE_MAPS' | 'OTHER';
export type AmenityValue = 'YES' | 'NO' | 'OPTIONAL' | 'UNVERIFIED';
export type HighlightType = 'PRO' | 'CON' | 'TIP' | 'PAIN_POINT';

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

export interface HomestayServiceOffer {
  id: number; name: string; description: string | null; price: number | null; priceUnit: string | null; active: boolean;
}
export type HomestayServiceInput = Omit<HomestayServiceOffer, 'id'>;

export interface CancellationPolicySummary {
  id: number;
  name: string;
  description: string;
}

export interface HomestayProfileDetail {
  placeId: number;
  checkInFrom: string | null; // e.g. "14:00"
  checkOutUntil: string | null; // e.g. "12:00"
  houseRules?: string | null;
  surchargeNote?: string | null;
  childrenPolicy?: string | null;
  petsPolicy?: string | null;
  guestPolicy?: string | null;
  currentPolicy?: CancellationPolicySummary | null;
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
  isSuitableByTime?: boolean;
  suitableDateStart?: string;
  suitableDateEnd?: string;
  
  // Rich embedded objects
  media: PlaceMediaItem[];
  amenities: PlaceAmenityItem[];
  contacts: PlaceContactItem[];
  highlights: PlaceHighlightItem[];
  homestayProfile?: HomestayProfileDetail | null;
  services?: HomestayServiceOffer[];
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

  // Real Contacts & Location for List View
  address?: string;
  latitude?: number;
  longitude?: number;
  contacts?: PlaceContactItem[];
  amenities?: string[];
  isSuitableByTime?: boolean;
  suitableDateStart?: string;
  suitableDateEnd?: string;
}

import { RoomTypeDto } from './room';
export type { RoomTypeDto };


export interface HomestayDetailDto {
  id: number;
  name: string;
  description: string;
  kind: string;
  address: string;
  district?: string;
  latitude: number;
  longitude: number;
  priceRefMin: number;
  priceRefMax: number;
  ratingAvg: number;
  ratingCount: number;
  isSuitableByTime?: boolean;
  suitableDateStart?: string;
  suitableDateEnd?: string;
  attributes: Record<string, unknown>;
  
  images: string[];
  amenities: string[];
  rooms: RoomTypeDto[];
  contacts?: PlaceContactItem[];
  highlights?: PlaceHighlightItem[];
}

export interface NearbyPlaceDto {
  id: number;
  name: string;
  kind: string;
  distance: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  contacts?: PlaceContactItem[];
}

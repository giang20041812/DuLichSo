export type CategoryKind = 
  | 'ATTRACTION' 
  | 'HOMESTAY' 
  | 'RESTAURANT' 
  | 'CUISINE'
  | 'PHOTO'
  | 'RENTAL'
  | 'TRANSPORT' 
  | 'SERVICE'
  | 'CULTURE';

export interface CategoryDto {
  id: number;
  kind: CategoryKind;
  slug: string;
  name: string;
  description: string;
}

export interface PlaceSummaryDto {
  id: number;
  slug: string;
  name: string;
  regionName: string;
  coverImageUrl: string;
  description: string;
  priceRefMin: number;
  ratingAvg: number;
  ratingCount: number;
  attributesJson: string;
  kind: CategoryKind;
  priceUnitNote?: string;
  
  // Virtual fields enriched by backend
  tagBadge?: string;
  statsText?: string;
  amenities?: string[];
  highlights?: string[];
  durationText?: string;
}

export interface HomeResponseDto {
  categories: CategoryDto[];
  featuredDestinations: PlaceSummaryDto[];
  homestays: PlaceSummaryDto[];
  featuredTours: PlaceSummaryDto[];
  specialties?: PlaceSummaryDto[];
}

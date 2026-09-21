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

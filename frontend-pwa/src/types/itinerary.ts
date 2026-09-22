// Types for Itinerary and Cultural Experiences module

export interface ExperienceDetail {
  id: number;
  slug: string;
  title: string;
  categoryTag: string; // e.g. "TRẢI NGHIỆM VĂN HÓA"
  subCategoryTag: string; // e.g. "TRẢI NGHIỆM BẢN ĐỊA"
  seasonalTag: string; // e.g. "Mùa lúa chín - Thu hoạch"
  address: string;
  mapCode?: string; // e.g. "UC-03"
  
  priceRef: number;
  priceUnit: string; // e.g. "người"
  priceBadge: string; // e.g. "Phi thương mại (Phase 1)"
  priceNotice: string;
  
  description: string;
  duration: string;
  bestSeason: string;
  targetAudience: string;
  giftIncluded: string;
  languages: string;
  
  locationTag: string; // e.g. "Tọa độ MAP-CUS-01"
  locationName: string;
  accessNote: string;
  latitude: number;
  longitude: number;
  
  hostName: string;
  hostRole: string;
  hostPhone: string;
  hostWorkingHours: string;
  
  images: string[];
}

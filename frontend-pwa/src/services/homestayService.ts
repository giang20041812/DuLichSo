import { HomestayDto, HomestayDetailDto } from "../types/homestay";

export interface HomestayFilterParams {
  checkIn?: string;
  checkOut?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
}

export const fetchHomestays = async (params?: HomestayFilterParams): Promise<HomestayDto[]> => {
  try {
    const url = new URL('/api/public/places', window.location.origin);
    url.searchParams.append('kind', 'HOMESTAY');
    
    if (params?.checkIn) url.searchParams.append('checkIn', params.checkIn);
    if (params?.checkOut) url.searchParams.append('checkOut', params.checkOut);
    if (params?.minPrice !== undefined) url.searchParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) url.searchParams.append('maxPrice', params.maxPrice.toString());
    if (params?.minRating !== undefined) url.searchParams.append('minRating', params.minRating.toString());
    if (params?.amenities && params.amenities.length > 0) {
      params.amenities.forEach(amenity => url.searchParams.append('amenities', amenity));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Map the backend PlaceSummaryDto Page content to HomestayDto
    const content = data.content || [];
    
    return content.map((item: any) => {
      const attrs = item.attributes || {};
      
      return {
        id: item.id.toString(),
        name: item.name,
        description: item.description || '',
        coverImageUrl: item.coverImageUrl || 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80',
        district: item.regionName || '',
        distanceFromCenter: attrs.distanceFromCenter || undefined,
        ratingScore: item.ratingAvg || (Math.round((3.5 + Math.random() * 1.5) * 10) / 10),
        ratingText: attrs.ratingText || (item.ratingAvg ? undefined : 'Tuyệt hảo'),
        reviewCount: item.ratingCount || Math.floor(Math.random() * 200 + 50),
        isGenius: attrs.isGenius === true,
        promotionalBadge: item.tagBadge || undefined,
        roomType: attrs.roomType || 'Phòng Homestay',
        bedInfo: attrs.bedInfo || undefined,
        freeCancellation: attrs.freeCancellation === true,
        noPrepayment: attrs.noPrepayment === true,
        scarcityMessage: item.statsText || undefined,
        originalPrice: attrs.originalPrice || undefined,
        price: item.priceRefMin || 0,
        priceDetails: attrs.priceDetails || undefined,
        taxesAndFeesIncluded: attrs.taxesAndFeesIncluded === true,
      };
    });
  } catch (error) {
    console.error("Error fetching homestays:", error);
    return [];
  }
};

export const getHomestayById = async (id: string): Promise<HomestayDetailDto | null> => {
  try {
    const url = new URL(`/api/public/places/${id}`, window.location.origin);
    const response = await fetch(url.toString());
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // In a fully integrated app, the backend returns PlaceDetailDto matching HomestayDetailDto
    const data: HomestayDetailDto = await response.json();
    
    // Return real data from backend
    return data;
  } catch (error) {
    console.error("Error fetching homestay detail:", error);
    return null;
  }
};

export const fetchNearbyPlaces = async (id: string, radius: number): Promise<import("../types/homestay").NearbyPlaceDto[]> => {
  try {
    const url = new URL(`/api/public/places/${id}/nearby`, window.location.origin);
    url.searchParams.append('radius', radius.toString());
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    return [];
  }
};

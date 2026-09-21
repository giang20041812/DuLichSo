import { HomestayDto } from "../types/homestay";

export interface HomestayFilterParams {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
}

export const fetchHomestays = async (params?: HomestayFilterParams): Promise<HomestayDto[]> => {
  try {
    const url = new URL('http://localhost:8080/api/public/places');
    url.searchParams.append('kind', 'HOMESTAY');
    
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
        ratingScore: item.ratingAvg || (Math.round((8 + Math.random() * 2) * 10) / 10),
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

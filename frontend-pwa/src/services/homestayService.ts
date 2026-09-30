import { HomestayDto, HomestayDetailDto, PublicAmenityItem } from "../types/homestay";
import { apiOrigin } from '@/lib/apiBase';

export interface HomestayFilterParams {
  checkIn?: string;
  checkOut?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
  province?: string;
  district?: string;
  ward?: string;
  attractions?: string[];
  keyword?: string;
  page?: number;
  sort?: 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface PlaceSummaryApiItem {
  id: number;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  regionName?: string | null;
  attributes?: Record<string, unknown> | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  googleRating?: number | null;
  priceRefMin?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tagBadge?: string | null;
  statsText?: string | null;
  contacts?: HomestayDto['contacts'];
  amenities?: string[];
  operationStatus?: HomestayDto['operationStatus'];
  operationStatusReason?: string | null;
  availableForSelectedDates?: boolean;
}

const readPageResponse = (value: unknown): PageResponse<PlaceSummaryApiItem> => {
  if (!value || typeof value !== 'object') throw new Error('Phản hồi tìm kiếm không hợp lệ.');
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.content) || typeof data.totalElements !== 'number' || typeof data.totalPages !== 'number') {
    throw new Error('Phản hồi tìm kiếm không hợp lệ.');
  }
  return {
    content: data.content as PlaceSummaryApiItem[],
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    number: typeof data.number === 'number' ? data.number : 0,
    size: typeof data.size === 'number' ? data.size : 12,
  };
};

/** Danh mục tiện ích đang có ở ít nhất một homestay công khai — dùng cho bộ lọc tìm kiếm. */
export const fetchHomestayAmenities = async (): Promise<PublicAmenityItem[]> => {
  const url = new URL('/api/public/places/amenities', apiOrigin());
  url.searchParams.append('kind', 'HOMESTAY');
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Không tải được danh mục tiện ích (HTTP ${response.status}).`);
  const raw: unknown = await response.json();
  if (!Array.isArray(raw)) throw new Error('Danh mục tiện ích không hợp lệ.');
  return raw.filter((item): item is PublicAmenityItem =>
    !!item && typeof item === 'object'
    && typeof (item as { code?: unknown }).code === 'string'
    && typeof (item as { name?: unknown }).name === 'string'
    && ((item as { scope?: unknown }).scope === 'PLACE' || (item as { scope?: unknown }).scope === 'ROOM'));
};

export const fetchHomestays = async (params?: HomestayFilterParams): Promise<PageResponse<HomestayDto>> => {
    const url = new URL('/api/public/places', apiOrigin());
    url.searchParams.append('kind', 'HOMESTAY');
    
    if (params?.checkIn) url.searchParams.append('checkIn', params.checkIn);
    if (params?.checkOut) url.searchParams.append('checkOut', params.checkOut);
    if (params?.minPrice !== undefined) url.searchParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) url.searchParams.append('maxPrice', params.maxPrice.toString());
    if (params?.minRating !== undefined) url.searchParams.append('minRating', params.minRating.toString());
    if (params?.province) url.searchParams.append('province', params.province);
    if (params?.district) url.searchParams.append('district', params.district);
    if (params?.ward) url.searchParams.append('ward', params.ward);
    if (params?.attractions && params.attractions.length > 0) {
      url.searchParams.append('attractions', params.attractions.join(','));
    }
    if (params?.keyword) {
      const keyword = params.keyword.trim();
      if (keyword) url.searchParams.append('keyword', keyword);
    }
    if (params?.amenities && params.amenities.length > 0) {
      params.amenities.forEach(amenity => url.searchParams.append('amenities', amenity));
    }
    url.searchParams.append('page', String(params?.page ?? 0));
    url.searchParams.append('size', '12');
    url.searchParams.append('sort', params?.sort ?? 'recommended');

    const response = await fetch(url.toString());
    if (!response.ok) {
      let message = `Không thể tải danh sách Homestay (HTTP ${response.status}).`;
      try {
        const body: unknown = await response.json();
        if (body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string') {
          message = (body as { message: string }).message;
        }
      } catch { /* Giữ thông báo mặc định khi server không trả JSON. */ }
      throw new Error(message);
    }
    const raw: unknown = await response.json();
    const data = readPageResponse(raw);
    return {
      ...data,
      content: data.content.map((item) => {
      const attrs = item.attributes || {};
      
      return {
        id: item.id.toString(),
        name: item.name,
        description: item.description || '',
        coverImageUrl: item.coverImageUrl || '',
        district: item.regionName || '',
        distanceFromCenter: typeof attrs.distanceFromCenter === 'string' ? attrs.distanceFromCenter : undefined,
        ratingScore: item.ratingAvg || 0,
        ratingText: typeof attrs.ratingText === 'string' ? attrs.ratingText : '',
        reviewCount: item.ratingCount || 0,
        googleRating: item.googleRating ?? null,
        isGenius: attrs.isGenius === true,
        promotionalBadge: item.tagBadge || undefined,
        roomType: typeof attrs.roomType === 'string' ? attrs.roomType : 'Phòng Homestay',
        bedInfo: typeof attrs.bedInfo === 'string' ? attrs.bedInfo : '',
        freeCancellation: attrs.freeCancellation === true,
        noPrepayment: attrs.noPrepayment === true,
        scarcityMessage: item.statsText || undefined,
        originalPrice: typeof attrs.originalPrice === 'number' ? attrs.originalPrice : undefined,
        price: item.priceRefMin || 0,
        priceDetails: typeof attrs.priceDetails === 'string' ? attrs.priceDetails : undefined,
        taxesAndFeesIncluded: attrs.taxesAndFeesIncluded === true,
        address: item.address || undefined,
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        contacts: item.contacts || [],
        amenities: item.amenities || [],
        operationStatus: item.operationStatus,
        operationStatusReason: item.operationStatusReason,
        availableForSelectedDates: item.availableForSelectedDates,
      };
      }),
    };
};

export const getHomestayById = async (id: string): Promise<HomestayDetailDto | null> => {
  try {
    const url = new URL(`/api/public/places/${id}`, apiOrigin());
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
    const url = new URL(`/api/public/places/${id}/nearby`, apiOrigin());
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

/** Khoảng cách lái xe theo mạng đường bộ; OSRM trả về mét trong ma trận khoảng cách. */
export async function fetchDrivingDistances(
  origin: { latitude: number; longitude: number },
  destinations: Array<{ id: number; latitude?: number; longitude?: number }>,
): Promise<Map<number, number>> {
  const valid = destinations.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  if (valid.length === 0) return new Map();
  const coordinates = [`${origin.longitude},${origin.latitude}`, ...valid.map((item) => `${item.longitude},${item.latitude}`)].join(';');
  try {
    const response = await fetch(`https://router.project-osrm.org/table/v1/driving/${coordinates}?sources=0&annotations=distance`);
    if (!response.ok) return new Map();
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('distances' in data)) return new Map();
    const distances = (data as { distances?: unknown }).distances;
    if (!Array.isArray(distances) || !Array.isArray(distances[0])) return new Map();
    const result = new Map<number, number>();
    valid.forEach((item, index) => {
      const meters = distances[0][index + 1];
      if (typeof meters === 'number' && Number.isFinite(meters)) result.set(item.id, meters / 1000);
    });
    return result;
  } catch {
    return new Map();
  }
}

export const fetchPlaceReviews = async (id: string): Promise<import("../types/review").ReviewDto[]> => {
  try {
    const url = new URL(`/api/public/places/${id}/reviews`, apiOrigin());
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching place reviews:", error);
    return [];
  }
};

export const fetchRegionalDestinations = async (id: string, limit: number = 4): Promise<import("../types/homestay").HomestayDto[]> => {
  try {
    const url = new URL(`/api/public/places/${id}/destinations`, apiOrigin());
    url.searchParams.append('limit', limit.toString());
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const content = await response.json();
    return (content || []).map((item: any) => ({
      id: item.id?.toString(),
      name: item.name,
      description: item.description || '',
      coverImageUrl: item.coverImageUrl || '',
      district: item.regionName || item.address || '',
      ratingScore: item.ratingAvg || 0,
      ratingText: '',
      reviewCount: item.ratingCount || 0,
      price: item.priceRefMin || 0,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      roomType: 'Điểm tham quan',
      bedInfo: '',
      suitableDateStart: item.suitableDateStart,
      suitableDateEnd: item.suitableDateEnd,
    }));
  } catch (error) {
    console.error("Error fetching regional destinations:", error);
    return [];
  }
};

export interface PublicRegionWardDto {
  id?: number;
  name: string;
}

export interface PublicRegionDistrictDto {
  id?: number;
  name: string;
  wards: PublicRegionWardDto[];
}

export interface PublicRegionDto {
  id?: number;
  province?: string;
  name?: string;
  districts?: PublicRegionDistrictDto[];
  wards?: PublicRegionWardDto[];
}

export const fetchPublicRegions = async (): Promise<PublicRegionDto[]> => {
  try {
    const url = new URL('/api/public/places/regions', apiOrigin());
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching public regions:", error);
    return [];
  }
};


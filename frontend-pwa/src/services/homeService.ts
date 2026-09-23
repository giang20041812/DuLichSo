import axios from 'axios';
import { HomeResponseDto, PlaceSummaryDto } from '../types/home';
import { FestivalDto } from '../types/festival';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const enrichPlace = (p: PlaceSummaryDto): PlaceSummaryDto => ({
  ...p,
  tagBadge: p.tagBadge || 'Đề xuất',
  statsText: p.statsText || 'Khám phá ngay',
  amenities: p.amenities && p.amenities.length > 0 ? p.amenities : ['Wi-fi miễn phí', 'Gần trung tâm', 'Cảnh quan đẹp'],
  highlights: p.highlights && p.highlights.length > 0 ? p.highlights : ['Trải nghiệm tuyệt vời', 'Dịch vụ tận tâm', 'Giá tốt'],
  durationText: p.durationText || 'Trong ngày',
  ratingAvg: p.ratingAvg || 4.8,
  ratingCount: p.ratingCount || 120
});

export const fetchHomeData = async (): Promise<HomeResponseDto> => {
  try {
    const response = await axios.get<HomeResponseDto>(`${API_BASE_URL}/public/home`);
    const data = response.data;

    let featuredDestinations = data.featuredDestinations || [];
    let homestays = data.homestays || [];

    // Ensure at least 8 destinations
    if (featuredDestinations.length < 8) {
      try {
        const placesRes = await axios.get<PageResponse<PlaceSummaryDto>>(`${API_BASE_URL}/public/places?kind=ATTRACTION&size=20`);
        if (placesRes.data && placesRes.data.content && placesRes.data.content.length > 0) {
          const enriched = placesRes.data.content.map(enrichPlace);
          // Merge unique by id
          const map = new Map<number, PlaceSummaryDto>();
          enriched.forEach(item => map.set(item.id, item));
          featuredDestinations.forEach(item => map.set(item.id, item));
          featuredDestinations = Array.from(map.values());
        }
      } catch (err) {
        console.warn('Could not fetch additional attractions:', err);
      }
    }

    // Ensure at least 8 homestays
    if (homestays.length < 8) {
      try {
        const homestaysRes = await axios.get<PageResponse<PlaceSummaryDto>>(`${API_BASE_URL}/public/places?kind=HOMESTAY&size=20`);
        if (homestaysRes.data && homestaysRes.data.content && homestaysRes.data.content.length > 0) {
          const enriched = homestaysRes.data.content.map(enrichPlace);
          const map = new Map<number, PlaceSummaryDto>();
          enriched.forEach(item => map.set(item.id, item));
          homestays.forEach(item => map.set(item.id, item));
          homestays = Array.from(map.values());
        }
      } catch (err) {
        console.warn('Could not fetch additional homestays:', err);
      }
    }

    // Ensure specialties (CUISINE)
    let specialties = data.specialties || [];
    if (specialties.length < 4) {
      try {
        const foodRes = await axios.get<PageResponse<PlaceSummaryDto>>(`${API_BASE_URL}/public/places?kind=CUISINE&size=10`);
        if (foodRes.data && foodRes.data.content && foodRes.data.content.length > 0) {
          const enriched = foodRes.data.content.map(enrichPlace);
          specialties = enriched;
        }
      } catch (err) {
        console.warn('Could not fetch additional foods:', err);
      }
    }

    return {
      ...data,
      featuredDestinations: featuredDestinations.map(enrichPlace),
      homestays: homestays.map(enrichPlace),
      specialties: specialties
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    throw error;
  }
};

export const fetchFestivals = async (): Promise<FestivalDto[]> => {
  try {
    const res = await axios.get<FestivalDto[]>(`${API_BASE_URL}/public/festivals`);
    return res.data || [];
  } catch (error) {
    console.warn('Could not fetch festivals:', error);
    return [];
  }
};

import axios from 'axios';
import { HomeResponseDto, PlaceSummaryDto } from '../types/home';
import { FestivalDto } from '../types/festival';

const API_BASE_URL = '/api';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const fetchHomeData = async (): Promise<HomeResponseDto> => {
  try {
    const response = await axios.get<HomeResponseDto>(`${API_BASE_URL}/public/home`);
    const data = response.data;

    let featuredDestinations = data.featuredDestinations || [];
    let homestays = data.homestays || [];

    // Ensure at least 8 destinations if backend had fewer in featured
    if (featuredDestinations.length < 8) {
      try {
        const placesRes = await axios.get<PageResponse<PlaceSummaryDto>>(`${API_BASE_URL}/public/places?kind=ATTRACTION&size=20`);
        if (placesRes.data && placesRes.data.content && placesRes.data.content.length > 0) {
          const map = new Map<number, PlaceSummaryDto>();
          placesRes.data.content.forEach(item => map.set(item.id, item));
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
          const map = new Map<number, PlaceSummaryDto>();
          homestaysRes.data.content.forEach(item => map.set(item.id, item));
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
          specialties = foodRes.data.content;
        }
      } catch (err) {
        console.warn('Could not fetch additional foods:', err);
      }
    }

    return {
      ...data,
      featuredDestinations,
      homestays,
      specialties
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

import { FestivalDto } from '@/types/festival';

export type { FestivalDto };

export const fetchFestivals = async (): Promise<FestivalDto[]> => {
  try {
    const response = await fetch('/api/public/festivals');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (Array.isArray(result)) {
      return result;
    }
    if (result && Array.isArray(result.data)) {
      return result.data;
    }
  } catch (error) {
    console.warn('Lỗi khi fetch festivals từ backend:', error);
  }
  return [];
};

export const fetchFestivalByIdOrSlug = async (identifier: string): Promise<FestivalDto | null> => {
  try {
    const festivals = await fetchFestivals();
    const found = festivals.find(
      (f) => f.slug === identifier || f.id.toString() === identifier
    );
    if (found) return found;
  } catch (error) {
    console.warn('Lỗi khi tìm festival theo slug/id:', error);
  }
  return null;
};

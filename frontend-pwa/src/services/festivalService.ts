import { FestivalDto } from '@/types/festival';

export type { FestivalDto };

export const fetchFestivals = async (): Promise<FestivalDto[]> => {
  const response = await fetch('/api/public/festivals');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: unknown = await response.json();
  if (Array.isArray(result)) {
    return result as FestivalDto[];
  }
  if (typeof result === 'object' && result !== null && 'data' in result) {
    const data = result.data;
    if (Array.isArray(data)) {
      return data as FestivalDto[];
    }
  }

  throw new Error('Invalid festivals response from backend');
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

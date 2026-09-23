export interface FestivalDto {
  id: number | string;
  slug: string;
  name: string;
  seasonNote: string;
  timeRange: string;
  isSuitableByTime?: boolean; // Lễ hội phù hợp theo mùa/thời gian
  suitableDateStart?: string;
  suitableDateEnd?: string;
  isCurrentSeason: boolean; // Gợi ý festival cho thời điểm hiện tại
  nextPeriodStart?: string;
  nextPeriodEnd?: string;
  coreValue: string;
  suitableExperience: string;
  etiquetteDont: string;
  regionName?: string;
  coverImageUrl: string;
  location: string;
  highlightTag: string;
  activities: string[];
}

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

// TODO: verify against docs — cấu trúc này khớp với FestivalDto.java từ backend
// Phản ánh đúng field từ backend FestivalDto

export interface FestivalDto {
  id: number;
  slug: string;
  name: string;
  seasonNote: string;
  coreValue: string;
  suitableExperience: string;
  etiquetteDont: string;
  regionName: string;
  coverImageUrl: string;
  location: string;
  highlightTag: string;
  activities: string[];

  // Trường tính toán
  isSuitableByTime?: boolean;
  isCurrentSeason: boolean;
  nextPeriodStart: string | null; // ISO date string
  nextPeriodEnd: string | null;   // ISO date string
  timeRange: string;
}

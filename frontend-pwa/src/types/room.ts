export interface RoomTypeDto {
  id: number;
  name: string;
  description: string;
  maxOccupancy: number;
  totalRoomCount: number;
  areaSqm: number;
  basePrice: number;
  images: string[];
  bedType?: string;
  hasBreakfast?: boolean;
  freeCancellation?: boolean;
}

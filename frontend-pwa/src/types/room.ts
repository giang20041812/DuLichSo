// Types for Room & Inventory Module matching backend-api DTOs
import { AmenityValue } from './homestay';

export interface RoomBedInfo {
  bedType: string;
  quantity: number;
}

export interface RoomTypeItem {
  id: number;
  placeId: number;
  name: string;
  description?: string;
  maxOccupancy: number;
  totalRoomCount: number;
  privateBathroom: AmenityValue;
  areaSqm?: number;
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
  
  // Dynamic fields
  availableRooms: number;
  badgeText?: string;
  coverImage?: string;
  images?: string[];
  bedDescription?: string;
  features?: string[];
  unitNote?: string; // e.g. "/ đêm" or "/ người"
}

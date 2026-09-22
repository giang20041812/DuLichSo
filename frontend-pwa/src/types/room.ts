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

// Legacy type used by HomestayDetailPage (main branch)
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

export interface NightPriceDetail {
  nightIndex: number;
  dateStr: string;
  priceLabel: string;
  price: number;
  isSpecialRate?: boolean;
}

export type AvailabilityStatus = 'AVAILABLE' | 'NOT_ENOUGH_ROOMS' | 'ONLINE_BOOKING_PAUSED';

export interface RoomAvailabilityItem extends RoomTypeItem {
  availabilityStatus: AvailabilityStatus;
  statusBadgeText: string;
  nightlyPrices?: NightPriceDetail[];
  totalPrice?: number;
  unavailabilityReason?: string;
  pausedNotice?: string;
  imagesCount?: number;
}

export interface AvailabilityFilterParams {
  checkInDate: string; // e.g. "2026-10-15"
  checkOutDate: string; // e.g. "2026-10-17"
  guestsCount: number;
  roomsCount: number;
}

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
  weekendPrice?: number;
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
  weekendPrice?: number;
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

export interface PartnerRoomInput {
  name: string;
  description: string;
  maxOccupancy: number;
  totalRoomCount: number;
  privateBathroom: AmenityValue;
  areaSqm: number | null;
  basePrice: number;
  weekendPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
  viewDescription: string;
  beds: RoomBedInfo[];
  amenityIds: number[];
}
export interface PartnerRoom extends PartnerRoomInput { id: number; placeId: number }
export interface RoomPriceInput { name: string; periodStart: string; periodEnd: string; price: number }
export interface RoomPrice extends RoomPriceInput { id: number }
export interface RoomInventoryInput { startDate: string; endDate: string; totalRooms: number; stopSell: boolean }
export interface RoomInventoryDay {
  stayDate: string; totalRooms: number; heldRooms: number; confirmedRooms: number; availableRooms: number; stopSell: boolean; price: number;
}
export interface RoomQuote { roomTypeId: number; availableRooms: number; suitable: boolean; totalAmount: number; nights: RoomInventoryDay[] }

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
  /** null = chưa có giá, không đặt được. */
  basePrice: number | null;
  weekendPrice?: number | null;
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
  /** null = chưa có giá (dữ liệu nguồn không có giá cụ thể) — không đặt được, hiển thị "Liên hệ". */
  basePrice: number | null;
  weekendPrice?: number | null;
  images: string[];
  amenities?: string[];
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
/** Loại phòng đã lưu: basePrice có thể null khi dữ liệu nạp từ nguồn chưa có giá — NCC cần nhập giá trước khi mở bán. */
export interface PartnerRoom extends Omit<PartnerRoomInput, 'basePrice'> { id: number; placeId: number; basePrice: number | null }
export interface RoomPriceInput { name: string; periodStart: string; periodEnd: string; price: number }
export interface RoomPrice extends RoomPriceInput { id: number }
/** UC-NCC-04 luồng phụ 6: giá trị NCC đã thấy trên lịch, để backend phát hiện dữ liệu đã bị sửa đồng thời. */
export interface RoomInventoryExpectedDay { stayDate: string; totalRooms: number; stopSell: boolean }
export interface RoomInventoryInput { startDate: string; endDate: string; totalRooms: number; stopSell: boolean; reason?: string; expected?: RoomInventoryExpectedDay[] }
export interface RoomInventoryDay {
  stayDate: string; totalRooms: number; heldRooms: number; confirmedRooms: number; availableRooms: number; stopSell: boolean; price: number;
  blockReason: string | null;
}
export interface RoomQuote { roomTypeId: number; availableRooms: number; suitable: boolean; totalAmount: number; nights: RoomInventoryDay[] }
/** Ngừng / mở phục vụ cả Homestay trong khoảng [startDate, endDate) — khớp PartnerRoomDtos.HomestayBlockInput */
export interface HomestayBlockInput { startDate: string; endDate: string; stopSell: boolean; reason?: string }
/** NFR-AUD-02 — khớp PartnerRoomDtos.ChangeLogDto */
export interface HomestayChangeLog {
  id: number; action: string; entityType: 'RoomType' | 'Homestay'; entityId: number; reason: string | null;
  before: Record<string, unknown> | null; after: Record<string, unknown> | null; createdAt: string;
}

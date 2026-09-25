export type PlaceVisibility = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export type PlaceOperationStatus = 'OPERATING' | 'TEMP_CLOSED';

export interface PartnerHomestaySummaryDto {
  id: number;
  code: string;
  slug: string;
  name: string;
  address: string;
  coverImageUrl: string;
  categoryName: string;
  visibility: PlaceVisibility;
  operationStatus: PlaceOperationStatus;
  roomTypesCount: number;
  priceRefMin: number | null;
  priceRefMax: number | null;
  priceUnitNote?: string;
  lastUpdatedText: string;
  auditStatus: 'STANDARD' | 'MAINTENANCE' | 'NEEDS_DATA';
  auditStatusText: string;
  alertNote?: string;
  isReadyToPublish: boolean;
}

export interface PartnerHomestayStatsDto {
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  unpublishedCount: number;
  operatingCount: number;
  tempClosedCount: number;
}

export interface PartnerHomestayPageResponse {
  homestays: PartnerHomestaySummaryDto[];
  stats: PartnerHomestayStatsDto;
  cooperativeName: string;
  providerCode: string;
  isProviderSuspended: boolean;
}

export interface UpdateStatusRequest {
  visibility?: PlaceVisibility;
  operationStatus?: PlaceOperationStatus;
}

export interface PartnerHomestayDetailDto {
  id: number;
  code: string;
  slug: string;
  name: string;
  description: string;
  contactPhone: string;
  contactEmail?: string;
  regionName: string;
  regionId?: number | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  accessNote?: string;
  coverImageUrl: string;
  galleryUrls: string[];
  amenities: string[];
  checkInFrom: string;
  checkOutUntil: string;
  houseRules: string;
  cancellationPolicy: string;
  policyName?: string;
  freeCancelCutoffHours?: number | null;
  refundOnLateCancel?: 'FULL_REFUND' | 'NO_REFUND' | null;
  policyVersion?: number | null;
  surchargeNote?: string;
  childrenPolicy?: string;
  petsPolicy?: string;
  guestPolicy?: string;
  visibility: PlaceVisibility;
  operationStatus: PlaceOperationStatus;
  isReadyToPublish: boolean;
  cooperativeName: string;
  providerCode: string;
  alertNote?: string;
  roomTypesCount?: number;
  roomTypesSummary?: string;
  priceRefMin?: number | null;
  priceRefMax?: number | null;
  pricingSummary?: string;
  availabilitySummary?: string;
  stopSellSummary?: string;
  heroStatusBadge?: string;
}

export interface HomestayOptionsDto {
  regions: { id: number; name: string }[];
  amenities: { id: number; name: string }[];
}

// ---- Ảnh Homestay / loại phòng — khớp PartnerMediaDtos.java ----

export interface MediaDto {
  mediaId: number;
  url: string;
  role: 'COVER' | 'GALLERY';
  caption: string | null;
  sortOrder: number;
}

export interface DirectUploadDto {
  uploadUrl: string;
  imageId: string;
  maxFileBytes: number;
  allowedTypes: string[];
}

// ---- Đăng ký NCC (UC-NCC-08) — khớp ProviderApplicationDtos.java ----

export type ProviderApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProviderRegisterInput {
  businessName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  password: string;
  address: string;
  businessLicenseNo: string;
  description: string;
}

export interface ProviderRegisterResult {
  applicationId: number;
  status: ProviderApplicationStatus;
  message: string;
}

// ---- Phản hồi đánh giá (UC-NCC-10) — khớp PartnerReviewDtos.ReviewDto ----

export interface PartnerReviewDto {
  id: number;
  placeId: number;
  placeName: string;
  bookingCode: string | null;
  guestName: string;
  rating: number;
  content: string | null;
  status: 'VISIBLE' | 'HIDDEN';
  createdAt: string;
  providerReply: string | null;
  providerReplyAt: string | null;
}

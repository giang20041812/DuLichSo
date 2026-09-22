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
  priceRefMin: number;
  priceRefMax: number;
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

export interface QuickCreateHomestayRequest {
  name: string;
  address: string;
  description?: string;
  priceRefMin?: number;
  priceRefMax?: number;
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
  address: string;
  latitude: number;
  longitude: number;
  accessNote?: string;
  coverImageUrl: string;
  galleryUrls: string[];
  amenities: string[];
  checkInFrom: string;
  checkOutUntil: string;
  houseRules: string;
  cancellationPolicy: string;
  visibility: PlaceVisibility;
  operationStatus: PlaceOperationStatus;
  isReadyToPublish: boolean;
  cooperativeName: string;
  providerCode: string;
  alertNote?: string;
  roomTypesCount?: number;
  roomTypesSummary?: string;
  priceRefMin?: number;
  priceRefMax?: number;
  pricingSummary?: string;
  availabilitySummary?: string;
  stopSellSummary?: string;
  heroStatusBadge?: string;
}

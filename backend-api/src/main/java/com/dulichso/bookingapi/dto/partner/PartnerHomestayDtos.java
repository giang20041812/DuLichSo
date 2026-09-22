package com.dulichso.bookingapi.dto.partner;

import com.dulichso.bookingapi.entity.enums.PlaceOperationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class PartnerHomestayDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartnerHomestaySummaryDto {
        private Long id;
        private String code;
        private String slug;
        private String name;
        private String address;
        private String coverImageUrl;
        @Builder.Default
        private String categoryName = "Lưu trú / Homestay";
        private PlaceVisibility visibility;
        private PlaceOperationStatus operationStatus;
        private int roomTypesCount;
        private BigDecimal priceRefMin;
        private BigDecimal priceRefMax;
        private String priceUnitNote;
        private String lastUpdatedText;
        private String auditStatus; // STANDARD, MAINTENANCE, NEEDS_DATA
        private String auditStatusText;
        private String alertNote;
        private boolean isReadyToPublish;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartnerHomestayStatsDto {
        private int totalCount;
        private int publishedCount;
        private int draftCount;
        private int unpublishedCount;
        private int operatingCount;
        private int tempClosedCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartnerHomestayPageResponse {
        private List<PartnerHomestaySummaryDto> homestays;
        private PartnerHomestayStatsDto stats;
        @Builder.Default
        private String cooperativeName = "HỢP TÁC XÃ DU LỊCH CỘNG ĐỒNG LÌM MÔNG";
        @Builder.Default
        private String providerCode = "NCC-TB-0824";
        private boolean isProviderSuspended;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateStatusRequest {
        private PlaceVisibility visibility;
        private PlaceOperationStatus operationStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuickCreateHomestayRequest {
        private String name;
        private String address;
        private String description;
        private BigDecimal priceRefMin;
        private BigDecimal priceRefMax;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartnerHomestayDetailDto {
        private Long id;
        private String code;
        private String slug;
        private String name;
        private String description;
        private String contactPhone;
        private String contactEmail;
        private String regionName;
        private String address;
        private Double latitude;
        private Double longitude;
        private String accessNote;
        private String coverImageUrl;
        private List<String> galleryUrls;
        private List<String> amenities;
        private String checkInFrom;
        private String checkOutUntil;
        private String houseRules;
        private String cancellationPolicy;
        private PlaceVisibility visibility;
        private PlaceOperationStatus operationStatus;
        private boolean isReadyToPublish;
        @Builder.Default
        private String cooperativeName = "HTX Du Lịch Cộng Đồng Lìm Mông";
        @Builder.Default
        private String providerCode = "NCC-TB-0824";
        private String alertNote;

        // Phân hệ nghiệp vụ phòng (Room Management Subsystems)
        private Integer roomTypesCount;
        private String roomTypesSummary;
        private BigDecimal priceRefMin;
        private BigDecimal priceRefMax;
        private String pricingSummary;
        private String availabilitySummary;
        private String stopSellSummary;
        private String heroStatusBadge;
    }
}

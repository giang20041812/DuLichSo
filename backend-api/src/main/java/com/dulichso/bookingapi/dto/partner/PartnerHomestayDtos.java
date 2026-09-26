package com.dulichso.bookingapi.dto.partner;

import com.dulichso.bookingapi.entity.enums.PlaceOperationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dulichso.bookingapi.entity.enums.RefundType;

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
        @lombok.Getter(onMethod_ = @JsonProperty("isReadyToPublish"))
        @lombok.Setter(onMethod_ = @JsonProperty("isReadyToPublish"))
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
        private String cooperativeName;
        private String providerCode;
        @lombok.Getter(onMethod_ = @JsonProperty("isProviderSuspended"))
        @lombok.Setter(onMethod_ = @JsonProperty("isProviderSuspended"))
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
    public static class PartnerHomestayDetailDto {
        private Long id;
        private String code;
        private String slug;
        private String name;
        private String description;
        private String contactPhone;
        private String contactEmail;
        /** Link video review TikTok (dạng https://www.tiktok.com/@kenh/video/123...), lưu thành liên hệ kênh TIKTOK để trang Homestay nhúng video. */
        private String reviewVideoUrl;
        private String regionName;
        private Long regionId;
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
        private String policyName;
        private Integer freeCancelCutoffHours;
        private RefundType refundOnLateCancel;
        private Integer policyVersion;
        private String surchargeNote;
        private String childrenPolicy;
        private String petsPolicy;
        private String guestPolicy;
        private PlaceVisibility visibility;
        private PlaceOperationStatus operationStatus;
        @lombok.Getter(onMethod_ = @JsonProperty("isReadyToPublish"))
        @lombok.Setter(onMethod_ = @JsonProperty("isReadyToPublish"))
        private boolean isReadyToPublish;
        private String cooperativeName;
        private String providerCode;
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

    public record OptionDto(Long id, String name) {}
    public record HomestayOptionsDto(List<OptionDto> regions, List<OptionDto> amenities) {}
}

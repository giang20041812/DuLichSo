package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceOperationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

public class AdminPlaceDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminPlaceSummaryDto {
        private Long id;
        private String slug;
        private String name;
        private CategoryKind kind;
        private Long categoryId;
        private String categoryName;
        private Long providerId;
        private String providerName;
        private Long regionId;
        private String regionName;
        private String address;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private BigDecimal priceRefMin;
        private BigDecimal priceRefMax;
        private PlaceVisibility visibility;
        private PlaceOperationStatus operationStatus;
        private PlaceVerificationStatus verification;
        private LocalDate lastVerifiedAt;
        private BigDecimal ratingAvg;
        private Integer ratingCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminPlaceDetailDto {
        private Long id;
        private String slug;
        private String name;
        private CategoryKind kind;
        private Long categoryId;
        private String categoryName;
        private Long providerId;
        private String providerName;
        private Long regionId;
        private String regionName;
        private String address;
        private String description;
        private String accessNote;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private BigDecimal priceRefMin;
        private BigDecimal priceRefMax;
        private String priceUnitNote;
        private PlaceVisibility visibility;
        private PlaceOperationStatus operationStatus;
        private PlaceVerificationStatus verification;
        private LocalDate lastVerifiedAt;
        private BigDecimal ratingAvg;
        private Integer ratingCount;
        private Map<String, Object> attributes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePlaceVerificationRequest {
        @NotNull(message = "Trạng thái xác thực không được để trống")
        private PlaceVerificationStatus verification;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePlaceVisibilityRequest {
        @NotNull(message = "Trạng thái hiển thị không được để trống")
        private PlaceVisibility visibility;
        private String reason;
    }
}

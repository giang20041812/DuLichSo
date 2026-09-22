package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.ContactChannel;
import com.dulichso.bookingapi.entity.enums.HighlightType;
import com.dulichso.bookingapi.entity.enums.PlaceOperationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceDetailDto {
    private Long id;
    private String slug;
    private String name;
    private CategoryKind kind;
    private String categoryKind;
    private String categoryName;
    private String regionName;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String accessNote;
    private BigDecimal priceRefMin;
    private BigDecimal priceRefMax;
    private String priceUnitNote;
    private PlaceOperationStatus operationStatus;
    private PlaceVerificationStatus verification;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private String description;
    private Integer altitudeMeters;
    private String verifiedGpsText;
    private Map<String, Object> attributes;

    private List<String> images;
    private List<String> amenities;
    private List<RoomTypeDto> rooms;

    private List<MediaItemDto> media;
    private List<AmenityItemDto> amenityItems;
    private List<ContactItemDto> contacts;
    private List<HighlightItemDto> highlights;
    private HomestayProfileDto homestayProfile;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaItemDto {
        private Long id;
        private String publicUrl;
        private String role;
        private String caption;
        private Integer sortOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AmenityItemDto {
        private Long id;
        private String code;
        private String name;
        private String icon;
        private String value;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContactItemDto {
        private Long id;
        private ContactChannel channel;
        private String value;
        private Boolean isPublic;
        private Integer sortOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HighlightItemDto {
        private Long id;
        private HighlightType type;
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HomestayProfileDto {
        private Long placeId;
        private String checkInFrom;
        private String checkOutUntil;
        private String houseRules;
        private String surchargeNote;
        private PolicyDto currentPolicy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PolicyDto {
        private Long id;
        private String name;
        private String description;
    }
}

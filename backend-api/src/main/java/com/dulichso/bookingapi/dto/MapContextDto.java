package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapContextDto {
    private Long placeId;
    private String placeSlug;
    private String placeName;
    private String regionName;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer altitudeMeters;
    private String accessNote;
    private String verificationBadge;

    private List<PoiDto> pois;
    private List<ScenarioDto> scenarios;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PoiDto {
        private Long id;
        private String name;
        private String category;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private BigDecimal distanceKm;
        private String note;
        private String address;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScenarioDto {
        private String id;
        private String code;
        private String label;
        private String targetName;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Integer zoomLevel;
        private Integer altitudeMeters;
        private String accessNote;
        private Boolean isPrimary;
    }
}

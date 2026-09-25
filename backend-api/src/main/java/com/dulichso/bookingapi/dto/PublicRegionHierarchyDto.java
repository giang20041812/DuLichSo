package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicRegionHierarchyDto {
    private Long id;
    private String name;
    private List<DistrictItem> districts;

    public String getProvince() {
        return name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistrictItem {
        private Long id;
        private String name;
        private List<WardItem> wards;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WardItem {
        private Long id;
        private String name;
    }
}

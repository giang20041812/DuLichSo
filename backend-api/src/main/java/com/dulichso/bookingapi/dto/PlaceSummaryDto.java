package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.CategoryKind;
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
public class PlaceSummaryDto {
    private Long id;
    private String slug;
    private String name;
    private String regionName;
    private String coverImageUrl;
    private String description;
    private BigDecimal priceRefMin;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private java.util.Map<String, Object> attributes;
    private CategoryKind kind;
    
    // Virtual fields that will be parsed from attributes or assigned in service
    private String tagBadge;
    private String statsText;
    private List<String> amenities;
    private List<String> highlights;
    private String durationText;
    
    public PlaceSummaryDto(Long id, String slug, String name, String regionName, String coverImageUrl, 
                           String description, BigDecimal priceRefMin, BigDecimal ratingAvg, Integer ratingCount, 
                           java.util.Map<String, Object> attributes, CategoryKind kind) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.regionName = regionName;
        this.coverImageUrl = coverImageUrl;
        this.description = description;
        this.priceRefMin = priceRefMin;
        this.ratingAvg = ratingAvg;
        this.ratingCount = ratingCount;
        this.attributes = attributes;
        this.kind = kind;
    }
}

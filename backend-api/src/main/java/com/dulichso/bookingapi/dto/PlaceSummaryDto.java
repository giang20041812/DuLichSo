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
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private Boolean isSuitableByTime;
    private java.time.LocalDate suitableDateStart;
    private java.time.LocalDate suitableDateEnd;
    
    // Virtual fields that will be parsed from attributes or assigned in service
    private String categoryName;
    private BigDecimal priceRefMax;
    private String priceUnitNote;
    private String tagBadge;
    private String statsText;
    private List<String> amenities;
    private List<String> highlights;
    private String durationText;
    private List<PlaceDetailDto.ContactItemDto> contacts;
    
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

    public PlaceSummaryDto(Long id, String slug, String name, String regionName, String coverImageUrl, 
                           String description, BigDecimal priceRefMin, BigDecimal ratingAvg, Integer ratingCount, 
                           java.util.Map<String, Object> attributes, CategoryKind kind,
                           BigDecimal latitude, BigDecimal longitude, String address) {
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
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
    }
}

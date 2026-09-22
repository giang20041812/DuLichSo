package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.CategoryKind;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDetailDto {
    private Long id;
    private String name;
    private String description;
    private CategoryKind kind;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal priceRefMin;
    private BigDecimal priceRefMax;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private Map<String, Object> attributes;
    
    private List<String> images;
    private List<String> amenities;
    private List<RoomTypeDto> rooms;
}

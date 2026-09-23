package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.CategoryKind;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyPlaceDto {
    private Long id;
    private String name;
    private CategoryKind kind;
    private Double distance;
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;
    private String address;
    private java.util.List<PlaceDetailDto.ContactItemDto> contacts;
}

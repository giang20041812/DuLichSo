package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomTypeDto {
    private Long id;
    private String name;
    private String description;
    private Integer maxOccupancy;
    private Integer totalRoomCount;
    private BigDecimal areaSqm;
    private BigDecimal basePrice;
    private List<String> images;
}

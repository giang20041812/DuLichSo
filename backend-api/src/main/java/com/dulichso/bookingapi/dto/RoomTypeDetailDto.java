package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.AmenityValue;
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
public class RoomTypeDetailDto {
    private Long id;
    private Long placeId;
    private String name;
    private String description;
    private Integer maxOccupancy;
    private Integer totalRoomCount;
    private AmenityValue privateBathroom;
    private BigDecimal areaSqm;
    private BigDecimal basePrice;
    private String status;

    private Integer availableRooms;
    private String badgeText;
    private String coverImage;
    private List<String> images;
    private String bedDescription;
    private List<String> features;
    private String unitNote;
}

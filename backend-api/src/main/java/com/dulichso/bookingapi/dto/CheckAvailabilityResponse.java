package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckAvailabilityResponse {
    private boolean available;
    private int requestedRooms;
    private int minAvailableRooms;
    private String message;
}

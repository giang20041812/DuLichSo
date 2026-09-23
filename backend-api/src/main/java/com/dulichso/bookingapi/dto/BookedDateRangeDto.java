package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookedDateRangeDto {
    private Long roomTypeId;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer roomCount;
}

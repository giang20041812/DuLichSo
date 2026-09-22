package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponseDto {
    private Long id;
    private String bookingCode;
    private Long placeId;
    private String placeName;
    private String placeAddress;
    private Long roomTypeId;
    private String roomTypeName;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer nights;
    private Integer roomCount;
    private Integer guestCount;
    private String guestName;
    private String guestPhone;
    private String guestEmail;
    private String guestNote;
    private String status;
    private String currency;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime holdExpiresAt;
    private Map<String, Object> policySnapshot;
}

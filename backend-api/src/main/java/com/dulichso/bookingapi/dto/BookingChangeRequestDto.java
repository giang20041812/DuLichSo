package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.BookingChangeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingChangeRequestDto {
    private Long id;
    private Long bookingId;
    private String bookingCode;
    private BookingChangeStatus status;
    private String guestName;
    private String guestPhone;
    private String guestEmail;
    private String guestNote;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer roomCount;
    private Integer guestCount;
    private String reason;
    private String rejectionReason;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}

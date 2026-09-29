package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {
    private Long id;
    private Long placeId;
    private String bookingCode;
    private Byte rating;
    private String content;
    private java.util.List<String> images;
    private String providerReply;
    private LocalDateTime providerReplyAt;
    private String guestName;
    private LocalDateTime createdAt;
    private LocalDateTime editableUntil;
}

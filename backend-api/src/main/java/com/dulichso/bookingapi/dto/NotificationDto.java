package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String templateCode;
    private String channel;
    private String recipientType;
    private String recipientEmail;
    private String recipientPhone;
    private String relatedEntityType;
    private Long relatedEntityId;
    private String bookingCode;
    private String title;
    private String message;
    private String bookingStatus;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private Map<String, Object> payload;
}

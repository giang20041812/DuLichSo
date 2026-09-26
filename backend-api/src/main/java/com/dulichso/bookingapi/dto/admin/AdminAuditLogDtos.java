package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.ActorType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/** DTO tra cứu Audit Log (FR-AD-17) — chỉ đọc. */
public class AdminAuditLogDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditLogDto {
        private Long id;
        private ActorType actor;
        private Long actorId;
        private String actorName;
        private String action;
        private String entityType;
        private Long entityId;
        private String result;
        private String ip;
        private String reason;
        /** Chỉ có ở API chi tiết. */
        private Map<String, Object> beforeData;
        /** Chỉ có ở API chi tiết. */
        private Map<String, Object> afterData;
        private LocalDateTime createdAt;
    }
}

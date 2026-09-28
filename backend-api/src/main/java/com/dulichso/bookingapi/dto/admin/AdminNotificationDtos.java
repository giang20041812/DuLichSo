package com.dulichso.bookingapi.dto.admin;

import java.time.LocalDateTime;
import java.util.List;

/** Thông báo trong ứng dụng dành cho Admin (vd: NCC gửi hồ sơ đăng ký, khách đăng ký mới). */
public final class AdminNotificationDtos {
    private AdminNotificationDtos() {}

    /** {@code target}: mục của cổng quản trị cần mở khi bấm thông báo (vd: "applications", "accounts"). */
    public record NotificationItemDto(Long id, String title, String message, String target, String entityType,
                                      Long entityId, boolean read, LocalDateTime createdAt) {}

    /** {@code unread}: số thông báo chưa đọc trong danh sách gần nhất được trả về. */
    public record NotificationFeedDto(List<NotificationItemDto> items, long unread) {}
}

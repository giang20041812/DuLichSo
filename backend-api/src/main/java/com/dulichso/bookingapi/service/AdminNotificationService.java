package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminNotificationDtos.NotificationFeedDto;
import com.dulichso.bookingapi.dto.admin.AdminNotificationDtos.NotificationItemDto;
import com.dulichso.bookingapi.entity.Notification;
import com.dulichso.bookingapi.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Thông báo của chính Admin đang đăng nhập (mỗi Admin có bản ghi riêng nên đánh dấu đã đọc độc lập nhau).
 * Trạng thái đã đọc lưu trong payload.isRead, cùng quy ước với thông báo của khách.
 */
@Service
@RequiredArgsConstructor
public class AdminNotificationService {
    private final NotificationRepository notifications;

    @Transactional(readOnly = true)
    public NotificationFeedDto feed(Long accountId) {
        if (accountId == null) return new NotificationFeedDto(List.of(), 0);
        List<NotificationItemDto> items = notifications.findTop50ByRecipientAccountIdOrderByCreatedAtDescIdDesc(accountId)
                .stream().map(AdminNotificationService::toDto).toList();
        return new NotificationFeedDto(items, items.stream().filter(i -> !i.read()).count());
    }

    @Transactional
    public void markRead(Long accountId, Long id) {
        if (accountId == null) return;
        notifications.findByIdAndRecipientAccountId(id, accountId).ifPresent(n -> setRead(n, true));
    }

    @Transactional
    public void markAllRead(Long accountId) {
        if (accountId == null) return;
        notifications.findTop50ByRecipientAccountIdOrderByCreatedAtDescIdDesc(accountId).forEach(n -> setRead(n, true));
    }

    private void setRead(Notification n, boolean read) {
        // Sao chép map để Hibernate nhận ra thay đổi của cột JSON.
        Map<String, Object> payload = n.getPayload() == null ? new HashMap<>() : new HashMap<>(n.getPayload());
        payload.put("isRead", read);
        n.setPayload(payload);
        notifications.save(n);
    }

    private static NotificationItemDto toDto(Notification n) {
        Map<String, Object> p = n.getPayload() == null ? Map.of() : n.getPayload();
        return new NotificationItemDto(n.getId(), text(p.get("title")), text(p.get("message")), text(p.get("target")),
                n.getRelatedEntityType(), n.getRelatedEntityId(), Boolean.TRUE.equals(p.get("isRead")), n.getCreatedAt());
    }

    private static String text(Object o) {
        return o == null ? null : o.toString();
    }
}

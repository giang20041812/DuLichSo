package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminNotificationDtos.NotificationFeedDto;
import com.dulichso.bookingapi.entity.Notification;
import com.dulichso.bookingapi.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminNotificationServiceTest {

    @Mock private NotificationRepository repository;
    private AdminNotificationService service;

    @BeforeEach
    void setUp() {
        service = new AdminNotificationService(repository);
    }

    private static Notification notification(long id, boolean read) {
        Map<String, Object> payload = new HashMap<>(Map.of("title", "Hồ sơ đăng ký NCC mới", "message", "NCC A vừa gửi hồ sơ",
                "target", "applications", "isRead", read));
        return Notification.builder().id(id).relatedEntityType("ProviderApplication").relatedEntityId(5L)
                .payload(payload).createdAt(LocalDateTime.now()).build();
    }

    @Test
    @DisplayName("feed: trả thông báo của Admin kèm số chưa đọc")
    void feed_countsUnread() {
        when(repository.findTop50ByRecipientAccountIdOrderByCreatedAtDescIdDesc(1L))
                .thenReturn(List.of(notification(1, false), notification(2, true), notification(3, false)));

        NotificationFeedDto feed = service.feed(1L);

        assertEquals(3, feed.items().size());
        assertEquals(2, feed.unread());
        assertEquals("applications", feed.items().get(0).target());
        assertFalse(feed.items().get(0).read());
        assertTrue(feed.items().get(1).read());
    }

    @Test
    @DisplayName("feed: tài khoản QA không có trong DB thì không có thông báo")
    void feed_noAccount() {
        assertEquals(0, service.feed(null).items().size());
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("markRead: chỉ đánh dấu thông báo thuộc chính Admin đó")
    void markRead_ownNotificationOnly() {
        Notification n = notification(1, false);
        when(repository.findByIdAndRecipientAccountId(1L, 1L)).thenReturn(Optional.of(n));
        when(repository.findByIdAndRecipientAccountId(1L, 2L)).thenReturn(Optional.empty());

        service.markRead(2L, 1L);
        assertEquals(false, n.getPayload().get("isRead"));

        service.markRead(1L, 1L);
        assertEquals(true, n.getPayload().get("isRead"));
        verify(repository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("markAllRead: đánh dấu mọi thông báo gần nhất của Admin")
    void markAllRead() {
        Notification a = notification(1, false), b = notification(2, false);
        when(repository.findTop50ByRecipientAccountIdOrderByCreatedAtDescIdDesc(1L)).thenReturn(List.of(a, b));

        service.markAllRead(1L);

        assertEquals(true, a.getPayload().get("isRead"));
        assertEquals(true, b.getPayload().get("isRead"));
    }
}

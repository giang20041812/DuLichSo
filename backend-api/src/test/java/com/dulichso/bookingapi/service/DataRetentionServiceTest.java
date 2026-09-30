package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.controller.PublicHealthController;
import com.dulichso.bookingapi.entity.enums.ActorType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/** NFR-PRI-02 (lưu giữ dữ liệu) và NFR-AVL-01 (health check). */
@ExtendWith(MockitoExtension.class)
class DataRetentionServiceTest {
    static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 27, 3, 30);

    @Mock EntityManager em;
    @Mock AuditLogService auditLogService;
    @Mock Query auditQuery;
    @Mock Query tokenQuery;
    @Mock Query notificationQuery;

    DataRetentionService service;

    @BeforeEach
    void setup() {
        service = new DataRetentionService(em, auditLogService, 180, 7, 90);
        lenient().when(em.createQuery(contains("AuditLog"))).thenReturn(auditQuery);
        lenient().when(em.createQuery(contains("PasswordResetToken"))).thenReturn(tokenQuery);
        lenient().when(em.createQuery(contains("Notification"))).thenReturn(notificationQuery);
        for (Query q : List.of(auditQuery, tokenQuery, notificationQuery)) lenient().when(q.setParameter(anyString(), any())).thenReturn(q);
    }

    private static String contains(String part) {
        return org.mockito.ArgumentMatchers.contains(part);
    }

    @Test
    @DisplayName("Mỗi loại dữ liệu dùng thời hạn riêng: audit 180 ngày, OTP 7 ngày, thông báo 90 ngày")
    void purge_usesPerTypeRetention() {
        when(auditQuery.executeUpdate()).thenReturn(10);
        when(tokenQuery.executeUpdate()).thenReturn(2);
        when(notificationQuery.executeUpdate()).thenReturn(5);

        DataRetentionService.PurgeResult result = service.purge(NOW);

        assertEquals(new DataRetentionService.PurgeResult(10, 2, 5), result);
        verify(auditQuery).setParameter("cutoff", NOW.minusDays(180));
        verify(tokenQuery).setParameter("cutoff", NOW.minusDays(7));
        verify(notificationQuery).setParameter("cutoff", NOW.minusDays(90));
    }

    @Test
    @DisplayName("Có dữ liệu bị xóa thì ghi một sự kiện SYSTEM vào audit log")
    void purge_recordsSystemEvent() {
        when(auditQuery.executeUpdate()).thenReturn(1);
        when(tokenQuery.executeUpdate()).thenReturn(0);
        when(notificationQuery.executeUpdate()).thenReturn(0);

        service.purge(NOW);

        verify(auditLogService).recordEvent(eq(ActorType.SYSTEM), isNull(), eq("DATA_RETENTION_PURGE"), eq("System"), isNull(),
                eq(AuditLogService.RESULT_SUCCESS), isNull(), any(), anyMap());
    }

    @Test
    @DisplayName("Không có gì để xóa thì không ghi thêm audit log")
    void purge_nothingToDelete_noEvent() {
        when(auditQuery.executeUpdate()).thenReturn(0);
        when(tokenQuery.executeUpdate()).thenReturn(0);
        when(notificationQuery.executeUpdate()).thenReturn(0);

        service.purge(NOW);

        verifyNoInteractions(auditLogService);
    }

    @Test
    @DisplayName("Thời hạn cấu hình sai (< 1 ngày) bị từ chối ngay khi khởi động, tránh xóa nhầm toàn bộ")
    void invalidRetention_rejected() {
        assertThrows(IllegalStateException.class, () -> new DataRetentionService(em, auditLogService, 0, 7, 90));
        assertThrows(IllegalStateException.class, () -> new DataRetentionService(em, auditLogService, 180, -1, 90));
    }

    @Test
    @DisplayName("Health check: 200 khi CSDL phản hồi, 503 khi không")
    void health_reflectsDatabase() {
        Query ok = mock(Query.class);
        when(em.createNativeQuery("SELECT 1")).thenReturn(ok);
        when(ok.getSingleResult()).thenReturn(1);
        PublicHealthController controller = new PublicHealthController(em);
        ResponseEntity<Map<String, Object>> up = controller.health();
        assertEquals(200, up.getStatusCode().value());
        assertEquals("UP", up.getBody().get("status"));

        when(ok.getSingleResult()).thenThrow(new RuntimeException("db down"));
        ResponseEntity<Map<String, Object>> down = controller.health();
        assertEquals(503, down.getStatusCode().value());
        assertEquals("DOWN", down.getBody().get("status"));
        assertFalse(down.getBody().toString().contains("db down"), "Không lộ chi tiết lỗi nội bộ");
    }
}

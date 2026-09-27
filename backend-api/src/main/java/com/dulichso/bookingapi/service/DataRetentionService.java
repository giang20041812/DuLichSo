package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.ActorType;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * NFR-PRI-02: chính sách lưu giữ dữ liệu theo từng loại (không dùng một thời hạn chung).
 * <ul>
 *   <li>Audit log: {@code app.retention.audit-log-days} (mặc định 180 ngày theo NFR-AUD-01).</li>
 *   <li>Mã OTP đặt lại mật khẩu: xóa sau {@code app.retention.password-reset-token-days} ngày kể từ lúc hết hạn (mặc định 7).</li>
 *   <li>Thông báo trong ứng dụng: {@code app.retention.notification-days} (mặc định 90 ngày).</li>
 *   <li>Booking, đánh giá, tài khoản: KHÔNG tự động xóa — phục vụ đối soát và giải quyết tranh chấp; thời hạn cụ thể do pháp chế quyết định.</li>
 * </ul>
 */
@Service
public class DataRetentionService {
    private static final Logger log = LoggerFactory.getLogger(DataRetentionService.class);

    private final EntityManager em;
    private final AuditLogService auditLogService;
    private final int auditLogDays;
    private final int passwordResetTokenDays;
    private final int notificationDays;

    public DataRetentionService(EntityManager em, AuditLogService auditLogService,
                                @Value("${app.retention.audit-log-days:180}") int auditLogDays,
                                @Value("${app.retention.password-reset-token-days:7}") int passwordResetTokenDays,
                                @Value("${app.retention.notification-days:90}") int notificationDays) {
        this.em = em;
        this.auditLogService = auditLogService;
        this.auditLogDays = requirePositive("audit-log-days", auditLogDays);
        this.passwordResetTokenDays = requirePositive("password-reset-token-days", passwordResetTokenDays);
        this.notificationDays = requirePositive("notification-days", notificationDays);
    }

    /** Kết quả một lần dọn dữ liệu. */
    public record PurgeResult(int auditLogs, int passwordResetTokens, int notifications) {}

    @Transactional
    public PurgeResult purge(LocalDateTime now) {
        int audits = em.createQuery("delete from AuditLog a where a.createdAt < :cutoff")
                .setParameter("cutoff", now.minusDays(auditLogDays)).executeUpdate();
        int tokens = em.createQuery("delete from PasswordResetToken t where t.expiresAt < :cutoff")
                .setParameter("cutoff", now.minusDays(passwordResetTokenDays)).executeUpdate();
        int notifications = em.createQuery("delete from Notification n where n.createdAt < :cutoff")
                .setParameter("cutoff", now.minusDays(notificationDays)).executeUpdate();
        PurgeResult result = new PurgeResult(audits, tokens, notifications);
        log.info("Dọn dữ liệu theo chính sách lưu giữ: audit_log={}, password_reset_token={}, notification={}", audits, tokens, notifications);
        if (audits + tokens + notifications > 0) {
            auditLogService.recordEvent(ActorType.SYSTEM, null, "DATA_RETENTION_PURGE", "System", null, AuditLogService.RESULT_SUCCESS, null,
                    "Dọn dữ liệu quá hạn lưu giữ", Map.of("auditLogs", audits, "passwordResetTokens", tokens, "notifications", notifications,
                            "auditLogDays", auditLogDays, "passwordResetTokenDays", passwordResetTokenDays, "notificationDays", notificationDays));
        }
        return result;
    }

    private static int requirePositive(String name, int value) {
        if (value < 1) throw new IllegalStateException("app.retention." + name + " phải >= 1 ngày.");
        return value;
    }
}

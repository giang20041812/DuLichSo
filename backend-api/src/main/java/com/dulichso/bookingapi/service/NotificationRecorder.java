package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Notification;
import com.dulichso.bookingapi.entity.NotificationTemplate;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.RecipientType;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Map;

/**
 * Công bố thông báo trong ứng dụng. Kênh SMS/email cần bộ gửi riêng khi được cấu hình.
 * Thiếu template (DB chưa chạy migration) thì bỏ qua, không làm hỏng nghiệp vụ chính.
 */
@Service @RequiredArgsConstructor @Slf4j
public class NotificationRecorder {
    private final EntityManager em;

    public void toCustomer(String templateCode, String phone, String email, String entityType, Long entityId, Map<String, Object> payload) {
        if ((phone == null || phone.isBlank()) && (email == null || email.isBlank())) return;
        template(templateCode).ifPresent(t -> em.persist(Notification.builder().template(t)
                .channel(com.dulichso.bookingapi.entity.enums.NotificationChannel.IN_APP)
                .status(com.dulichso.bookingapi.entity.enums.NotificationStatus.SENT).sentAt(java.time.LocalDateTime.now())
                .recipientType(RecipientType.CUSTOMER).recipientPhone(blankToNull(phone)).recipientEmail(blankToNull(email))
                .relatedEntityType(entityType).relatedEntityId(entityId).payload(payload).build()));
    }

    /**
     * Thông báo trong ứng dụng cho mọi Admin đang hoạt động (mỗi Admin một bản ghi để tự đánh dấu đã đọc).
     * {@code target} là mục của cổng quản trị cần mở khi bấm thông báo (vd: "applications", "accounts").
     * Lỗi ở đây không được làm hỏng nghiệp vụ chính (đăng ký) nên được nuốt và ghi log.
     */
    public void toAdmins(String templateCode, String entityType, Long entityId, String message, String target) {
        try {
            template(templateCode).ifPresent(t -> {
                java.util.List<Account> admins = em.createQuery("select a from Account a where a.role=:role and a.status=:status", Account.class)
                        .setParameter("role", AccountRole.ADMIN).setParameter("status", AccountStatus.ACTIVE).getResultList();
                for (Account admin : admins) {
                    Map<String, Object> payload = new java.util.HashMap<>();
                    payload.put("title", t.getSubject());
                    payload.put("message", message);
                    payload.put("target", target);
                    payload.put("isRead", false);
                    em.persist(Notification.builder().template(t)
                            .channel(com.dulichso.bookingapi.entity.enums.NotificationChannel.IN_APP)
                            .status(com.dulichso.bookingapi.entity.enums.NotificationStatus.SENT).sentAt(java.time.LocalDateTime.now())
                            .recipientType(RecipientType.ACCOUNT).recipientAccount(admin)
                            .relatedEntityType(entityType).relatedEntityId(entityId).payload(payload).build());
                }
            });
        } catch (RuntimeException ex) {
            log.warn("Không gửi được thông báo {} cho Admin: {}", templateCode, ex.getMessage());
        }
    }

    private java.util.Optional<NotificationTemplate> template(String code) {
        var found = em.createQuery("select t from NotificationTemplate t where t.code=:code and t.isActive=true", NotificationTemplate.class)
                .setParameter("code", code).getResultStream().findFirst();
        if (found.isEmpty()) log.warn("Bỏ qua thông báo: chưa có notification_template {}", code);
        return found;
    }

    private static String blankToNull(String s) {return s == null || s.isBlank() ? null : s.trim();}
}

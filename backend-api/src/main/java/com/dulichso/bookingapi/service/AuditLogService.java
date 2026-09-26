package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.AuditLog;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.repository.AuditLogRepository;
import com.dulichso.bookingapi.security.ClientIp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Service ghi audit log cho mọi thao tác Admin quan trọng và sự kiện bảo mật (đăng nhập, từ chối truy cập).
 * Chạy trong transaction riêng (REQUIRES_NEW) để log không bị rollback
 * cùng với transaction chính nếu có lỗi.
 */
@Service
public class AuditLogService {

    public static final String RESULT_SUCCESS = "SUCCESS";
    public static final String RESULT_FAILURE = "FAILURE";
    public static final String RESULT_DENIED = "DENIED";

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Ghi một bản ghi audit log của thao tác Admin vào DB.
     *
     * @param actorAccountId ID của tài khoản thực hiện hành động
     * @param action         Tên hành động (ví dụ: "SOS_DISPATCHED", "REFUND_APPROVED")
     * @param entityType     Loại entity bị thay đổi (ví dụ: "SosRequest", "Refund")
     * @param entityId       ID của entity bị thay đổi
     * @param reason         Lý do (có thể null)
     * @param beforeMap      Trạng thái trước khi thay đổi (có thể null)
     * @param afterMap       Trạng thái sau khi thay đổi (có thể null)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long actorAccountId,
                       String action,
                       String entityType,
                       Long entityId,
                       String reason,
                       Map<String, Object> beforeMap,
                       Map<String, Object> afterMap) {
        save(ActorType.ADMIN, actorAccountId, action, entityType, entityId, RESULT_SUCCESS, ClientIp.current(),
                reason, beforeMap, afterMap);
    }

    /**
     * Ghi sự kiện bảo mật/xác thực (NFR-SEC-05): đăng nhập, đăng nhập thất bại, từ chối truy cập, đổi quyền.
     * {@code details} không được chứa mật khẩu, token hay OTP; định danh người dùng phải được che bằng {@link #mask}.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(ActorType actor,
                            Long actorId,
                            String action,
                            String entityType,
                            Long entityId,
                            String result,
                            String ip,
                            String reason,
                            Map<String, Object> details) {
        save(actor, actorId, action, entityType, entityId, result, ip, reason, null, details);
    }

    private void save(ActorType actor, Long actorId, String action, String entityType, Long entityId,
                      String result, String ip, String reason,
                      Map<String, Object> beforeMap, Map<String, Object> afterMap) {
        try {
            AuditLog entry = AuditLog.builder()
                    .actor(actor)
                    .actorId(actorId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .result(result)
                    .ip(ip)
                    .reason(reason != null && reason.length() > 500 ? reason.substring(0, 500) : reason)
                    .beforeData(beforeMap)
                    .afterData(afterMap)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception ex) {
            // Không để lỗi audit làm hỏng flow chính
            log.error("Không thể ghi audit log [action={}, entity={}, id={}]: {}",
                    action, entityType, entityId, ex.getMessage());
        }
    }

    /**
     * Che định danh (email/SĐT) trước khi ghi log: "nguyenvan@gmail.com" → "n***@gmail.com", "0912345678" → "*******678".
     */
    public static String mask(String identifier) {
        if (identifier == null || identifier.isBlank()) return "";
        String value = identifier.trim();
        int at = value.indexOf('@');
        if (at > 0) return value.charAt(0) + "***" + value.substring(at);
        if (value.length() <= 3) return "***";
        return "*".repeat(value.length() - 3) + value.substring(value.length() - 3);
    }
}

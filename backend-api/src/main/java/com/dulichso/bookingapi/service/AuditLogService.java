package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.AuditLog;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Service ghi audit log cho mọi thao tác Admin quan trọng.
 * Chạy trong transaction riêng (REQUIRES_NEW) để log không bị rollback
 * cùng với transaction chính nếu có lỗi.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Ghi một bản ghi audit log vào DB.
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
        try {
            AuditLog entry = AuditLog.builder()
                    .actor(ActorType.ADMIN)
                    .actorId(actorAccountId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .reason(reason)
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
}

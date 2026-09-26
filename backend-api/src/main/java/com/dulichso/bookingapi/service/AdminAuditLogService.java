package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminAuditLogDtos.AuditLogDto;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.AuditLog;
import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.AuditLogRepository;
import com.dulichso.bookingapi.repository.TravelerRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * FR-AD-17: tra cứu Audit Log theo thời gian, người thao tác, loại đối tượng, hành động, kết quả, mã đối tượng
 * và xem chi tiết ở chế độ chỉ đọc. Service này không có thao tác ghi/sửa/xóa.
 */
@Service
public class AdminAuditLogService {

    static final int MAX_PAGE_SIZE = 100;

    private final AuditLogRepository auditLogRepository;
    private final AccountRepository accountRepository;
    private final TravelerRepository travelerRepository;

    public AdminAuditLogService(AuditLogRepository auditLogRepository, AccountRepository accountRepository,
                                TravelerRepository travelerRepository) {
        this.auditLogRepository = auditLogRepository;
        this.accountRepository = accountRepository;
        this.travelerRepository = travelerRepository;
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> search(LocalDate from, LocalDate to, ActorType actor, Long actorId, String action,
                                    String entityType, Long entityId, String result, int page, int size) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ: ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        String actionFilter = normalize(action);
        String entityFilter = normalize(entityType);
        String resultFilter = normalize(result);

        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            if (to != null) ps.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (actor != null) ps.add(cb.equal(root.get("actor"), actor));
            if (actorId != null) ps.add(cb.equal(root.get("actorId"), actorId));
            if (actionFilter != null) ps.add(cb.equal(cb.upper(root.get("action")), actionFilter));
            if (entityFilter != null) ps.add(cb.equal(cb.upper(root.get("entityType")), entityFilter));
            if (entityId != null) ps.add(cb.equal(root.get("entityId"), entityId));
            if (resultFilter != null) ps.add(cb.equal(cb.upper(root.get("result")), resultFilter));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<AuditLog> logs = auditLogRepository.findAll(spec, pageable);
        Map<String, String> names = resolveActorNames(logs.getContent());
        // Danh sách không trả before/after (có thể chứa dữ liệu cá nhân); xem ở API chi tiết.
        return logs.map(l -> toDto(l, names, false));
    }

    @Transactional(readOnly = true)
    public AuditLogDto detail(Long id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bản ghi Audit Log với ID: " + id));
        return toDto(log, resolveActorNames(List.of(log)), true);
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    /** Tên người thao tác: ADMIN/PROVIDER tra bảng account, CUSTOMER tra bảng traveler; khóa "TYPE:id" tránh trùng id giữa hai bảng. */
    private Map<String, String> resolveActorNames(List<AuditLog> logs) {
        Set<Long> accountIds = new HashSet<>();
        Set<Long> travelerIds = new HashSet<>();
        for (AuditLog l : logs) {
            if (l.getActorId() == null) continue;
            if (l.getActor() == ActorType.CUSTOMER) travelerIds.add(l.getActorId());
            else if (l.getActor() == ActorType.ADMIN || l.getActor() == ActorType.PROVIDER) accountIds.add(l.getActorId());
        }
        Map<String, String> names = new HashMap<>();
        if (!accountIds.isEmpty()) {
            for (Account a : accountRepository.findAllById(accountIds)) names.put("ACCOUNT:" + a.getId(), a.getFullName());
        }
        if (!travelerIds.isEmpty()) {
            for (Traveler t : travelerRepository.findAllById(travelerIds)) names.put("CUSTOMER:" + t.getId(), t.getFullName());
        }
        return names;
    }

    private AuditLogDto toDto(AuditLog l, Map<String, String> names, boolean withData) {
        String key = (l.getActor() == ActorType.CUSTOMER ? "CUSTOMER:" : "ACCOUNT:") + l.getActorId();
        String actorName = l.getActor() == ActorType.SYSTEM || l.getActorId() == null ? null : names.get(key);
        return AuditLogDto.builder()
                .id(l.getId())
                .actor(l.getActor())
                .actorId(l.getActorId())
                .actorName(actorName)
                .action(l.getAction())
                .entityType(l.getEntityType())
                .entityId(l.getEntityId())
                .result(l.getResult())
                .ip(l.getIp())
                .reason(l.getReason())
                .beforeData(withData ? l.getBeforeData() : null)
                .afterData(withData ? l.getAfterData() : null)
                .createdAt(l.getCreatedAt())
                .build();
    }
}

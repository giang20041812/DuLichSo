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
    /** Kết quả mặc định cho bản ghi cũ chưa có cột result. */
    private static final String LEGACY_RESULT = "SUCCESS";

    private final AuditLogRepository auditLogRepository;
    private final AccountRepository accountRepository;
    private final TravelerRepository travelerRepository;

    public AdminAuditLogService(AuditLogRepository auditLogRepository, AccountRepository accountRepository,
                                TravelerRepository travelerRepository) {
        this.auditLogRepository = auditLogRepository;
        this.accountRepository = accountRepository;
        this.travelerRepository = travelerRepository;
    }

    public Page<AuditLogDto> search(LocalDate from, LocalDate to, ActorType actor, Long actorId, String action,
                                    String entityType, Long entityId, String result, int page, int size) {
        return search(from, to, actor, actorId, action, entityType, entityId, result, null, null, page, size);
    }

    /**
     * @param keyword     tìm nhanh (không phân biệt hoa thường) theo mã hành động, loại đối tượng, lý do, tên/email người
     *                    thao tác, hoặc mã đối tượng khi keyword là số
     * @param actionCodes mã hành động bổ sung để khớp keyword (giao diện tra nhãn tiếng Việt → mã hành động)
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDto> search(LocalDate from, LocalDate to, ActorType actor, Long actorId, String action,
                                    String entityType, Long entityId, String result, String keyword,
                                    List<String> actionCodes, int page, int size) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ: ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        String actionFilter = normalize(action);
        String entityFilter = normalize(entityType);
        String resultFilter = normalize(result);
        String kw = keyword == null || keyword.isBlank() ? null : keyword.trim().toLowerCase(Locale.ROOT);
        List<String> codes = actionCodes == null ? List.of()
                : actionCodes.stream().map(AdminAuditLogService::normalize).filter(java.util.Objects::nonNull).limit(50).toList();

        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (kw != null) {
                String like = "%" + kw.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                List<Predicate> any = new ArrayList<>();
                any.add(cb.like(cb.lower(root.get("action")), like, '\\'));
                any.add(cb.like(cb.lower(root.get("entityType")), like, '\\'));
                any.add(cb.like(cb.lower(root.get("reason")), like, '\\'));
                if (kw.matches("\\d{1,18}")) any.add(cb.equal(root.get("entityId"), Long.parseLong(kw)));
                if (!codes.isEmpty()) any.add(cb.upper(root.get("action")).in(codes));
                // Tên/email người thao tác nằm ở bảng account (ADMIN, PROVIDER) hoặc traveler (CUSTOMER).
                var byAccount = query.subquery(Long.class);
                var acc = byAccount.from(Account.class);
                byAccount.select(acc.<Long>get("id")).where(cb.or(
                        cb.like(cb.lower(acc.get("fullName")), like, '\\'), cb.like(cb.lower(acc.get("email")), like, '\\')));
                any.add(cb.and(root.get("actor").in(ActorType.ADMIN, ActorType.PROVIDER), root.get("actorId").in(byAccount)));
                var byTraveler = query.subquery(Long.class);
                var trav = byTraveler.from(Traveler.class);
                byTraveler.select(trav.<Long>get("id")).where(cb.or(
                        cb.like(cb.lower(trav.get("fullName")), like, '\\'), cb.like(cb.lower(trav.get("email")), like, '\\')));
                any.add(cb.and(cb.equal(root.get("actor"), ActorType.CUSTOMER), root.get("actorId").in(byTraveler)));
                ps.add(cb.or(any.toArray(new Predicate[0])));
            }
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            if (to != null) ps.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (actor != null) ps.add(cb.equal(root.get("actor"), actor));
            if (actorId != null) ps.add(cb.equal(root.get("actorId"), actorId));
            if (actionFilter != null) ps.add(cb.equal(cb.upper(root.get("action")), actionFilter));
            if (entityFilter != null) ps.add(cb.equal(cb.upper(root.get("entityType")), entityFilter));
            if (entityId != null) ps.add(cb.equal(root.get("entityId"), entityId));
            if (resultFilter != null) {
                Predicate matches = cb.equal(cb.upper(root.get("result")), resultFilter);
                // Bản ghi cũ (trước khi có cột result) chưa có kết quả: đó đều là thao tác đã thực hiện thành công.
                ps.add(LEGACY_RESULT.equals(resultFilter) ? cb.or(matches, cb.isNull(root.get("result"))) : matches);
            }
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
                .result(l.getResult() != null ? l.getResult() : LEGACY_RESULT)
                .ip(l.getIp())
                .reason(l.getReason())
                .beforeData(withData ? l.getBeforeData() : null)
                .afterData(withData ? l.getAfterData() : null)
                .createdAt(l.getCreatedAt())
                .build();
    }
}

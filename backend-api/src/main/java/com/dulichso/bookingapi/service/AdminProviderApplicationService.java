package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminProviderApplicationDtos.ApplicationDetailDto;
import com.dulichso.bookingapi.dto.admin.AdminProviderApplicationDtos.ApplicationSummaryDto;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ProviderApplicationRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * FR-AD-16: Admin thẩm định hồ sơ đăng ký NCC. Duyệt → tạo Provider + Account (giữ nguyên mật khẩu đã băm BCrypt trong hồ sơ);
 * từ chối → bắt buộc có lý do. Không ghi đè hồ sơ đã xử lý; kết quả được phản hồi cho NCC và ghi Audit Log.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProviderApplicationService {
    static final String APPROVED_TEMPLATE = "PROVIDER_APPLICATION_APPROVED";
    static final String REJECTED_TEMPLATE = "PROVIDER_APPLICATION_REJECTED";
    private static final String ENTITY = "ProviderApplication";

    private final ProviderApplicationRepository applications;
    private final ProviderRepository providers;
    private final AccountRepository accounts;
    private final AuditLogService auditLogService;
    private final NotificationRecorder notifications;

    public Page<ApplicationSummaryDto> search(ProviderApplicationStatus status, String keyword, LocalDate from, LocalDate to,
                                              String sortDir, int page, int size) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ: ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        String kw = keyword == null || keyword.isBlank() ? null : keyword.trim().toLowerCase(Locale.ROOT);
        Specification<ProviderApplication> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            if (to != null) ps.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (kw != null) {
                String like = "%" + kw.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("businessName")), like, '\\'),
                        cb.like(cb.lower(root.get("contactName")), like, '\\'),
                        cb.like(cb.lower(root.get("contactEmail")), like, '\\'),
                        cb.like(root.get("contactPhone"), like, '\\')));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(direction, "createdAt").and(Sort.by(direction, "id")));
        Page<ProviderApplication> result = applications.findAll(spec, pageable);
        Map<Long, String> reviewers = reviewerNames(result.getContent());
        return result.map(a -> toSummary(a, reviewers));
    }

    public long pendingCount() {
        return applications.countByStatus(ProviderApplicationStatus.PENDING);
    }

    public ApplicationDetailDto detail(Long id) {
        ProviderApplication application = applications.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ đăng ký với ID: " + id));
        return toDetail(application);
    }

    @Transactional
    public ApplicationDetailDto approve(Long id, Long adminAccountId, String note) {
        ProviderApplication application = lockPending(id);
        requireAdmin(adminAccountId);
        // Kiểm tra lại ngay trước khi tạo: trong lúc chờ duyệt SĐT/email có thể đã được cấp cho tài khoản khác.
        if (identifierTaken(application.getContactPhone()) || identifierTaken(application.getContactEmail())) {
            throw new IllegalStateException("Số điện thoại hoặc email của hồ sơ đã thuộc một tài khoản khác, không thể duyệt. Hãy từ chối hồ sơ kèm lý do.");
        }
        Provider provider = providers.save(Provider.builder()
                .name(application.getBusinessName()).contactName(application.getContactName())
                .contactPhone(application.getContactPhone()).contactEmail(application.getContactEmail())
                .address(application.getAddress()).note(application.getDescription())
                .status(ProviderStatus.ACTIVE).build());
        Account account = accounts.save(Account.builder()
                .email(blankToNull(application.getContactEmail()) == null ? null : application.getContactEmail().trim().toLowerCase(Locale.ROOT))
                .phone(application.getContactPhone())
                // Mật khẩu đã được băm BCrypt lúc đăng ký: dùng nguyên, không băm lại.
                .passwordHash(application.getPasswordHash())
                .fullName(application.getContactName())
                .role(AccountRole.PROVIDER).status(AccountStatus.ACTIVE).provider(provider).build());

        finish(application, ProviderApplicationStatus.APPROVED, adminAccountId, note);
        application.setProviderId(provider.getId());
        auditLogService.record(adminAccountId, "PROVIDER_APPLICATION_APPROVED", ENTITY, id, clean(note),
                Map.of("status", ProviderApplicationStatus.PENDING.name()),
                Map.of("status", ProviderApplicationStatus.APPROVED.name(), "providerId", provider.getId(), "accountId", account.getId()));
        notifications.toCustomer(APPROVED_TEMPLATE, application.getContactPhone(), application.getContactEmail(), "provider_application", id,
                Map.of("business_name", application.getBusinessName()));
        return toDetail(application);
    }

    @Transactional
    public ApplicationDetailDto reject(Long id, Long adminAccountId, String reason) {
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Vui lòng nhập lý do từ chối.");
        ProviderApplication application = lockPending(id);
        requireAdmin(adminAccountId);
        finish(application, ProviderApplicationStatus.REJECTED, adminAccountId, reason);
        auditLogService.record(adminAccountId, "PROVIDER_APPLICATION_REJECTED", ENTITY, id, clean(reason),
                Map.of("status", ProviderApplicationStatus.PENDING.name()),
                Map.of("status", ProviderApplicationStatus.REJECTED.name()));
        notifications.toCustomer(REJECTED_TEMPLATE, application.getContactPhone(), application.getContactEmail(), "provider_application", id,
                Map.of("business_name", application.getBusinessName(), "reason", clean(reason)));
        return toDetail(application);
    }

    private ProviderApplication lockPending(Long id) {
        ProviderApplication application = applications.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ đăng ký với ID: " + id));
        if (application.getStatus() != ProviderApplicationStatus.PENDING) {
            throw new IllegalStateException("Hồ sơ đã được xử lý (" + application.getStatus() + "), không thể duyệt hoặc từ chối lại.");
        }
        return application;
    }

    private void requireAdmin(Long adminAccountId) {
        if (adminAccountId == null) throw new IllegalStateException("Không xác định được tài khoản quản trị đang thao tác.");
    }

    private void finish(ProviderApplication application, ProviderApplicationStatus status, Long adminAccountId, String note) {
        application.setStatus(status);
        application.setReviewedBy(adminAccountId);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewNote(clean(note));
    }

    private boolean identifierTaken(String identifier) {
        return blankToNull(identifier) != null && accounts.findByIdentifier(identifier.trim()).isPresent();
    }

    private ApplicationDetailDto toDetail(ProviderApplication a) {
        boolean pending = a.getStatus() == ProviderApplicationStatus.PENDING;
        return new ApplicationDetailDto(toSummary(a, reviewerNames(List.of(a))), a.getDescription(),
                pending && identifierTaken(a.getContactPhone()), pending && identifierTaken(a.getContactEmail()));
    }

    private ApplicationSummaryDto toSummary(ProviderApplication a, Map<Long, String> reviewers) {
        return new ApplicationSummaryDto(a.getId(), a.getBusinessName(), a.getContactName(), a.getContactPhone(), a.getContactEmail(),
                a.getAddress(), a.getBusinessLicenseNo(), a.getStatus(), a.getCreatedAt(), a.getReviewedAt(),
                a.getReviewedBy() == null ? null : reviewers.get(a.getReviewedBy()), a.getReviewNote(), a.getProviderId());
    }

    private Map<Long, String> reviewerNames(List<ProviderApplication> list) {
        List<Long> ids = list.stream().map(ProviderApplication::getReviewedBy).filter(java.util.Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) return Map.of();
        return accounts.findAllById(ids).stream()
                .collect(Collectors.toMap(Account::getId, a -> Optional.ofNullable(a.getFullName()).orElse("Quản trị viên"), (x, y) -> x));
    }

    private static String clean(String text) {
        if (text == null || text.isBlank()) return null;
        String trimmed = text.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}

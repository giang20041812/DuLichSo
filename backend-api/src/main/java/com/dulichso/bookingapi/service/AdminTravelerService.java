package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.repository.TravelerRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Admin quản lý tài khoản khách du lịch (bảng traveler). */
@Service
public class AdminTravelerService {

    private static final Set<String> SORT_FIELDS = Set.of("createdAt", "lastLoginAt", "fullName", "email");

    private final TravelerRepository travelerRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public AdminTravelerService(TravelerRepository travelerRepository, AuditLogService auditLogService,
                                PasswordEncoder passwordEncoder) {
        this.travelerRepository = travelerRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    public record TravelerDto(Long id, String email, String phone, String fullName, String pictureUrl,
                              AccountStatus status, String signupMethod,
                              LocalDateTime lastLoginAt, LocalDateTime createdAt) {}

    /** @param signupMethod GOOGLE (chưa đặt mật khẩu) hoặc EMAIL (có mật khẩu) */
    @Transactional(readOnly = true)
    public Page<TravelerDto> search(AccountStatus status, String keyword, String signupMethod,
                                    LocalDate createdFrom, LocalDate createdTo,
                                    String sortBy, String sortDir, int page, int size) {
        String kw = keyword != null && !keyword.isBlank() ? keyword.trim().toLowerCase() : null;
        Sort sort = Sort.by("asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC,
                SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt");

        Specification<Traveler> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if ("GOOGLE".equalsIgnoreCase(signupMethod)) ps.add(cb.isNull(root.get("passwordHash")));
            if ("EMAIL".equalsIgnoreCase(signupMethod)) ps.add(cb.isNotNull(root.get("passwordHash")));
            if (kw != null) {
                String like = "%" + kw.replace("%", "\\%").replace("_", "\\_") + "%";
                ps.add(cb.or(cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(root.get("phone"), like)));
            }
            if (createdFrom != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom.atStartOfDay()));
            if (createdTo != null) ps.add(cb.lessThan(root.get("createdAt"), createdTo.plusDays(1).atStartOfDay()));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        return travelerRepository.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort))
                .map(this::toDto);
    }

    /** Admin tạo tài khoản khách (đăng ký bằng email + mật khẩu) cho người chưa có tài khoản. */
    @Transactional
    public TravelerDto create(String fullName, String email, String phone, String password, Long callerAccountId) {
        String name = fullName == null ? "" : fullName.trim();
        String mail = email == null ? "" : email.trim().toLowerCase();
        String tel = phone == null || phone.isBlank() ? null : phone.trim();
        if (name.isEmpty()) throw new IllegalArgumentException("Họ tên không được để trống.");
        if (!mail.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw new IllegalArgumentException("Email không đúng định dạng.");
        if (password == null || password.length() < 6) throw new IllegalArgumentException("Mật khẩu tối thiểu 6 ký tự.");
        if (travelerRepository.existsByEmailIgnoreCase(mail)) {
            throw new IllegalArgumentException("Email " + mail + " đã có tài khoản khách.");
        }
        if (tel != null && travelerRepository.existsByPhone(tel)) {
            throw new IllegalArgumentException("Số điện thoại " + tel + " đã có tài khoản khách.");
        }
        Traveler saved = travelerRepository.save(Traveler.builder()
                .fullName(name).email(mail).phone(tel)
                .passwordHash(passwordEncoder.encode(password))
                .status(AccountStatus.ACTIVE)
                .build());
        auditLogService.record(callerAccountId, "CREATE_TRAVELER", "Traveler", saved.getId(),
                "Admin tạo tài khoản khách: " + mail, null, Map.of("email", mail, "fullName", name));
        return toDto(saved);
    }

    @Transactional
    public TravelerDto updateStatus(Long id, AccountStatus status, String reason, Long callerAccountId) {
        Traveler traveler = travelerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khách với ID: " + id));
        if (status != AccountStatus.ACTIVE && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("Vui lòng nhập lý do khi khóa tài khoản.");
        }
        AccountStatus old = traveler.getStatus();
        traveler.setStatus(status);
        Traveler saved = travelerRepository.save(traveler);

        auditLogService.record(callerAccountId, "UPDATE_TRAVELER_STATUS", "Traveler", saved.getId(),
                reason != null && !reason.isBlank() ? reason : "Mở khóa tài khoản khách",
                Map.of("status", old.name()), Map.of("status", saved.getStatus().name()));
        return toDto(saved);
    }

    private TravelerDto toDto(Traveler t) {
        return new TravelerDto(t.getId(), t.getEmail(), t.getPhone(), t.getFullName(), t.getPictureUrl(),
                t.getStatus(), t.getPasswordHash() == null ? "GOOGLE" : "EMAIL", t.getLastLoginAt(), t.getCreatedAt());
    }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminAccountDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AdminAccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public AdminAccountService(AccountRepository accountRepository,
                               PasswordEncoder passwordEncoder,
                               AuditLogService auditLogService) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    private static final java.util.Set<String> ACCOUNT_SORT_FIELDS = java.util.Set.of("createdAt", "lastLoginAt", "fullName", "email");

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AccountDto> getAccounts(
            AccountRole role, AccountStatus status, String keyword,
            com.dulichso.bookingapi.entity.enums.ProviderStatus providerStatus,
            java.time.LocalDate createdFrom, java.time.LocalDate createdTo,
            String sortBy, String sortDir, int page, int size) {

        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim().toLowerCase() : null;
        String sortField = ACCOUNT_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                "asc".equalsIgnoreCase(sortDir)
                        ? org.springframework.data.domain.Sort.Direction.ASC
                        : org.springframework.data.domain.Sort.Direction.DESC,
                sortField);
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort);

        org.springframework.data.jpa.domain.Specification<Account> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> ps = new java.util.ArrayList<>();
            jakarta.persistence.criteria.Join<Object, Object> provider = null;
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                provider = (jakarta.persistence.criteria.Join<Object, Object>) (jakarta.persistence.criteria.Join<?, ?>)
                        root.fetch("provider", jakarta.persistence.criteria.JoinType.LEFT);
            } else if (providerStatus != null) {
                provider = root.join("provider", jakarta.persistence.criteria.JoinType.LEFT);
            }
            if (role != null) ps.add(cb.equal(root.get("role"), role));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (providerStatus != null && provider != null) ps.add(cb.equal(provider.get("status"), providerStatus));
            if (kw != null) {
                String like = "%" + kw.replace("%", "\\%").replace("_", "\\_") + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(root.get("phone"), like)));
            }
            if (createdFrom != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom.atStartOfDay()));
            if (createdTo != null) ps.add(cb.lessThan(root.get("createdAt"), createdTo.plusDays(1).atStartOfDay()));
            return cb.and(ps.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return accountRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public AccountDto getAccountById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với ID: " + id));
        return mapToDto(account);
    }

    @Transactional
    public AccountDto createAdminAccount(CreateAdminAccountRequest request, Long callerAccountId) {
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email " + request.getEmail() + " đã được sử dụng");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank() && accountRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại " + request.getPhone() + " đã được sử dụng");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        Account account = Account.builder()
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .passwordHash(encodedPassword)
                .fullName(request.getFullName().trim())
                .role(AccountRole.ADMIN)
                .status(AccountStatus.ACTIVE)
                .build();

        Account saved = accountRepository.save(account);

        auditLogService.record(
                callerAccountId,
                "CREATE_ADMIN_ACCOUNT",
                "Account",
                saved.getId(),
                "Tạo tài khoản quản trị viên mới: " + saved.getEmail(),
                null,
                Map.of("email", saved.getEmail(), "fullName", saved.getFullName(), "role", saved.getRole().name())
        );

        return mapToDto(saved);
    }

    @Transactional
    public AccountDto updateAccount(Long id, UpdateAccountRequest request, Long callerAccountId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với ID: " + id));

        Map<String, Object> before = Map.of(
                "email", Objects.toString(account.getEmail(), ""),
                "phone", Objects.toString(account.getPhone(), ""),
                "fullName", Objects.toString(account.getFullName(), "")
        );

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equals(account.getEmail()) && accountRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email " + newEmail + " đã được sử dụng");
            }
            account.setEmail(newEmail);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String newPhone = request.getPhone().trim();
            if (!newPhone.equals(account.getPhone()) && accountRepository.existsByPhone(newPhone)) {
                throw new IllegalArgumentException("Số điện thoại " + newPhone + " đã được sử dụng");
            }
            account.setPhone(newPhone);
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            account.setFullName(request.getFullName().trim());
        }

        Account saved = accountRepository.save(account);

        auditLogService.record(
                callerAccountId,
                "UPDATE_ACCOUNT",
                "Account",
                saved.getId(),
                "Cập nhật thông tin tài khoản",
                before,
                Map.of(
                        "email", Objects.toString(saved.getEmail(), ""),
                        "phone", Objects.toString(saved.getPhone(), ""),
                        "fullName", Objects.toString(saved.getFullName(), "")
                )
        );

        return mapToDto(saved);
    }

    @Transactional
    public AccountDto updateAccountStatus(Long id, UpdateAccountStatusRequest request, Long callerAccountId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với ID: " + id));

        // BV-08 / AGENTS.md: Chặn không thể tự khoá chính tài khoản đang đăng nhập
        if (Objects.equals(callerAccountId, id) && request.getStatus() == AccountStatus.INACTIVE) {
            throw new IllegalStateException("Bạn không thể tự vô hiệu hoá tài khoản của chính mình");
        }

        AccountStatus oldStatus = account.getStatus();
        account.setStatus(request.getStatus());
        Account saved = accountRepository.save(account);

        auditLogService.record(
                callerAccountId,
                "UPDATE_ACCOUNT_STATUS",
                "Account",
                saved.getId(),
                request.getReason() != null ? request.getReason() : "Thay đổi trạng thái tài khoản",
                Map.of("status", oldStatus.name()),
                Map.of("status", saved.getStatus().name())
        );

        return mapToDto(saved);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request, Long callerAccountId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với ID: " + id));

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);

        auditLogService.record(
                callerAccountId,
                "RESET_PASSWORD",
                "Account",
                account.getId(),
                request.getReason() != null ? request.getReason() : "Admin đặt lại mật khẩu cho tài khoản",
                null,
                Map.of("email", Objects.toString(account.getEmail(), ""))
        );
    }

    private AccountDto mapToDto(Account a) {
        return AccountDto.builder()
                .id(a.getId())
                .email(a.getEmail())
                .phone(a.getPhone())
                .fullName(a.getFullName())
                .role(a.getRole())
                .status(a.getStatus())
                .providerId(a.getProvider() != null ? a.getProvider().getId() : null)
                .providerName(a.getProvider() != null ? a.getProvider().getName() : null)
                .lastLoginAt(a.getLastLoginAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}

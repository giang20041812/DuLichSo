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

    @Transactional(readOnly = true)
    public List<AccountDto> getAccounts(AccountRole role, AccountStatus status, String keyword) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return accountRepository.searchAccounts(role, status, kw)
                .stream()
                .map(this::mapToDto)
                .toList();
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

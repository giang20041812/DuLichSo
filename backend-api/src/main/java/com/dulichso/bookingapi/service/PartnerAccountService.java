package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerAccountDtos.ChangePasswordRequest;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.entity.enums.ActorType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class PartnerAccountService {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional
    public void changePassword(Long accountId, ChangePasswordRequest request) {
        if (accountId == null) throw new IllegalArgumentException("Phiên đăng nhập không hợp lệ.");
        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản."));
        if (!matches(request.getCurrentPassword(), account.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác.");
        }
        if (matches(request.getNewPassword(), account.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại.");
        }
        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        account.setTokenVersion(account.getTokenVersion() + 1);
        accountRepository.save(account);
        auditLogService.recordEvent(ActorType.PROVIDER, account.getId(), "CHANGE_PASSWORD", "Account", account.getId(),
                AuditLogService.RESULT_SUCCESS, null, "NCC tự đổi mật khẩu",
                Map.of("email", account.getEmail() == null ? "" : account.getEmail()));
    }

    private boolean matches(String plainPassword, String storedHash) {
        if (plainPassword == null || storedHash == null) return false;
        if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
            return passwordEncoder.matches(plainPassword, storedHash);
        }
        return storedHash.equals(plainPassword);
    }
}

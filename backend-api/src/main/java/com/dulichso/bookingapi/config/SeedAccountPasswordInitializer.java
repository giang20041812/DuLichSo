package com.dulichso.bookingapi.config;

import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Đặt mật khẩu cho tài khoản được nạp bằng script SQL (vd: verified_deploy.sql).
 *
 * <p>Script SQL không chứa hash BCrypt nào (hash chép sẵn không kiểm chứng được là của mật khẩu nào). Thay vào đó
 * tài khoản được insert với {@link #PENDING_HASH}; khi ứng dụng khởi động với biến môi trường
 * {@code APP_SEED_INITIAL_PASSWORD}, các tài khoản này được băm bằng chính {@link PasswordEncoder} của hệ thống,
 * nên mật khẩu đăng nhập luôn đúng bằng giá trị đã cấu hình. Chưa cấu hình thì tài khoản không đăng nhập được
 * (marker không phải BCrypt, {@code AccountAuthService} từ chối).
 *
 * <p>Nếu DB chưa có ADMIN nào (DB mới, chưa chạy script), tạo một ADMIN với {@code app.seed.admin-email}.
 * Mật khẩu không bao giờ được ghi ra log.
 */
@Component
@Slf4j
public class SeedAccountPasswordInitializer implements ApplicationRunner {

    /** Giá trị password_hash của tài khoản seed chưa được đặt mật khẩu. Không phải định dạng BCrypt. */
    public static final String PENDING_HASH = "{seed-pending}";
    static final int MIN_LENGTH = 8;

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String initialPassword;
    private final String adminEmail;

    public SeedAccountPasswordInitializer(AccountRepository accountRepository, PasswordEncoder passwordEncoder,
                                          @Value("${app.seed.initial-password:}") String initialPassword,
                                          @Value("${app.seed.admin-email:admin@dulichso.vn}") String adminEmail) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.initialPassword = initialPassword == null ? "" : initialPassword;
        this.adminEmail = adminEmail;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Account> pending = accountRepository.findAllByPasswordHash(PENDING_HASH);
        boolean needsAdmin = accountRepository.countByRole(AccountRole.ADMIN) == 0;
        if (pending.isEmpty() && !needsAdmin) return;

        if (initialPassword.isBlank()) {
            log.warn("[SeedAccount] {} tài khoản seed chưa có mật khẩu{}. Đặt APP_SEED_INITIAL_PASSWORD (tối thiểu {} ký tự) rồi khởi động lại.",
                    pending.size(), needsAdmin ? " và DB chưa có ADMIN" : "", MIN_LENGTH);
            return;
        }
        if (initialPassword.length() < MIN_LENGTH) {
            log.warn("[SeedAccount] APP_SEED_INITIAL_PASSWORD phải có tối thiểu {} ký tự; bỏ qua việc đặt mật khẩu.", MIN_LENGTH);
            return;
        }

        for (Account account : pending) account.setPasswordHash(passwordEncoder.encode(initialPassword));
        accountRepository.saveAll(pending);
        if (!pending.isEmpty()) {
            log.info("[SeedAccount] Đã đặt mật khẩu khởi tạo cho {} tài khoản: {}", pending.size(),
                    pending.stream().map(SeedAccountPasswordInitializer::identifier).collect(Collectors.joining(", ")));
        }

        if (needsAdmin && !accountRepository.existsByEmail(adminEmail)) {
            accountRepository.save(Account.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(initialPassword))
                    .role(AccountRole.ADMIN)
                    .status(AccountStatus.ACTIVE)
                    .fullName("Quản trị viên")
                    .tokenVersion(0)
                    .build());
            log.info("[SeedAccount] DB chưa có ADMIN, đã tạo {}", adminEmail);
        }
    }

    private static String identifier(Account account) {
        return account.getEmail() != null ? account.getEmail() : account.getPhone();
    }
}

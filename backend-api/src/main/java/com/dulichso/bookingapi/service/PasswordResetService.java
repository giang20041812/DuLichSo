package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.PasswordResetToken;
import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.PasswordResetTokenRepository;
import com.dulichso.bookingapi.repository.TravelerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Quên mật khẩu bằng OTP gửi qua email cho tài khoản portal (Admin/NCC) và khách du lịch.
 *
 * Bảo mật:
 *  - Phản hồi yêu cầu luôn giống nhau dù tài khoản có tồn tại hay không (không lộ tài khoản).
 *  - OTP 6 số, chỉ lưu bản băm, hết hạn sau {@code otp-ttl-minutes}, tối đa {@code max-attempts} lần nhập sai.
 *  - Giãn cách giữa hai lần gửi và giới hạn số lần gửi mỗi giờ cho mỗi tài khoản.
 *  - Đổi mật khẩu thành công thì mọi OTP còn lại bị vô hiệu.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    public static final int MIN_PASSWORD_LENGTH = 6;

    /** OTP sai, hết hạn, hết lượt thử hoặc không tồn tại — thông báo chung để không lộ thông tin. */
    public static class InvalidResetException extends RuntimeException {
        public InvalidResetException(String message) { super(message); }
    }

    /** Chủ thể đã xác định: một Account hoặc một Traveler cùng email nhận OTP. */
    record Subject(String type, Long id, String email, String displayName) {}

    private final AccountRepository accountRepository;
    private final TravelerRepository travelerRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final int otpTtlMinutes;
    private final int maxAttempts;
    private final int cooldownSeconds;
    private final int maxPerHour;
    private final boolean logOtp;

    public PasswordResetService(AccountRepository accountRepository,
                                TravelerRepository travelerRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                MailService mailService,
                                @Value("${app.password-reset.otp-ttl-minutes:10}") int otpTtlMinutes,
                                @Value("${app.password-reset.max-attempts:5}") int maxAttempts,
                                @Value("${app.password-reset.cooldown-seconds:60}") int cooldownSeconds,
                                @Value("${app.password-reset.max-per-hour:5}") int maxPerHour,
                                @Value("${app.password-reset.log-otp:false}") boolean logOtp) {
        this.accountRepository = accountRepository;
        this.travelerRepository = travelerRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.otpTtlMinutes = otpTtlMinutes;
        this.maxAttempts = maxAttempts;
        this.cooldownSeconds = cooldownSeconds;
        this.maxPerHour = maxPerHour;
        this.logOtp = logOtp;
    }

    public int getOtpTtlMinutes() {
        return otpTtlMinutes;
    }

    public int getCooldownSeconds() {
        return cooldownSeconds;
    }

    /** Tìm chủ thể theo email/SĐT: ưu tiên tài khoản portal, sau đó khách du lịch (giống luồng đăng nhập). */
    Optional<Subject> resolve(String identifier) {
        String id = identifier == null ? "" : identifier.trim();
        if (id.isEmpty()) return Optional.empty();
        String lowered = id.toLowerCase();

        Optional<Account> account = accountRepository.findByIdentifier(lowered)
                .or(() -> accountRepository.findByIdentifier(id));
        if (account.isPresent()) {
            Account a = account.get();
            String email = a.getEmail();
            if ((email == null || email.isBlank()) && a.getProvider() != null) {
                email = a.getProvider().getContactEmail(); // NCC đăng nhập bằng SĐT: dùng email liên hệ của cơ sở
            }
            return Optional.of(new Subject(PasswordResetToken.SUBJECT_ACCOUNT, a.getId(), email, a.getFullName()));
        }
        Optional<Traveler> traveler = travelerRepository.findByEmailIgnoreCase(id)
                .or(() -> travelerRepository.findByPhone(id));
        return traveler.map(t -> new Subject(PasswordResetToken.SUBJECT_TRAVELER, t.getId(), t.getEmail(), t.getFullName()));
    }

    private boolean isActive(Subject s) {
        if (PasswordResetToken.SUBJECT_ACCOUNT.equals(s.type())) {
            return accountRepository.findById(s.id()).map(a -> a.getStatus() == AccountStatus.ACTIVE).orElse(false);
        }
        return travelerRepository.findById(s.id()).map(t -> t.getStatus() == AccountStatus.ACTIVE).orElse(false);
    }

    /**
     * Phát hành OTP và gửi email. Không ném lỗi và không cho biết kết quả cho người gọi
     * (tránh dò tài khoản); mọi lý do bỏ qua chỉ được ghi log.
     */
    @Transactional
    public void requestReset(String identifier) {
        Optional<Subject> resolved = resolve(identifier);
        if (resolved.isEmpty()) {
            log.info("Yêu cầu quên mật khẩu cho định danh không tồn tại");
            return;
        }
        Subject s = resolved.get();
        if (s.email() == null || s.email().isBlank()) {
            log.warn("Tài khoản {} #{} không có email để gửi OTP", s.type(), s.id());
            return;
        }
        if (!isActive(s)) {
            log.info("Bỏ qua quên mật khẩu: {} #{} đang bị khóa", s.type(), s.id());
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        Optional<PasswordResetToken> last = tokenRepository.findFirstBySubjectTypeAndSubjectIdOrderByIdDesc(s.type(), s.id());
        if (last.isPresent() && last.get().getCreatedAt().isAfter(now.minusSeconds(cooldownSeconds))) {
            log.info("Bỏ qua quên mật khẩu: {} #{} yêu cầu quá nhanh", s.type(), s.id());
            return;
        }
        if (tokenRepository.countBySubjectTypeAndSubjectIdAndCreatedAtAfter(s.type(), s.id(), now.minusHours(1)) >= maxPerHour) {
            log.warn("Bỏ qua quên mật khẩu: {} #{} vượt {} yêu cầu/giờ", s.type(), s.id(), maxPerHour);
            return;
        }

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        tokenRepository.invalidateAll(s.type(), s.id(), now);
        tokenRepository.save(PasswordResetToken.builder()
                .subjectType(s.type()).subjectId(s.id()).email(s.email())
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(now.plusMinutes(otpTtlMinutes))
                .build());

        if (logOtp) {
            log.warn("[DEV] OTP đặt lại mật khẩu cho {} #{}: {}", s.type(), s.id(), otp);
        }
        mailService.sendText(s.email(), "Mã xác nhận đặt lại mật khẩu — Du Lịch Số", buildBody(s.displayName(), otp));
    }

    /**
     * Đặt lại mật khẩu bằng OTP. Nhập sai được đếm và lưu lại ngay cả khi ném lỗi
     * ({@code noRollbackFor}) để không thể thử vô hạn.
     */
    @Transactional(noRollbackFor = InvalidResetException.class)
    public void resetPassword(String identifier, String otp, String newPassword) {
        final String generic = "Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại hoặc yêu cầu mã mới.";
        if (newPassword == null || newPassword.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Mật khẩu mới tối thiểu " + MIN_PASSWORD_LENGTH + " ký tự.");
        }
        Subject s = resolve(identifier).orElseThrow(() -> new InvalidResetException(generic));
        PasswordResetToken token = tokenRepository
                .findFirstBySubjectTypeAndSubjectIdAndUsedAtIsNullOrderByIdDesc(s.type(), s.id())
                .orElseThrow(() -> new InvalidResetException(generic));

        LocalDateTime now = LocalDateTime.now();
        if (token.getExpiresAt().isBefore(now) || token.getAttempts() >= maxAttempts) {
            throw new InvalidResetException(generic);
        }
        if (otp == null || !otp.trim().matches("\\d{6}") || !passwordEncoder.matches(otp.trim(), token.getOtpHash())) {
            token.setAttempts(token.getAttempts() + 1);
            tokenRepository.save(token);
            throw new InvalidResetException(generic);
        }
        if (!isActive(s)) {
            throw new InvalidResetException(generic);
        }

        String hash = passwordEncoder.encode(newPassword);
        if (PasswordResetToken.SUBJECT_ACCOUNT.equals(s.type())) {
            Account a = accountRepository.findById(s.id()).orElseThrow(() -> new InvalidResetException(generic));
            a.setPasswordHash(hash);
            accountRepository.save(a);
        } else {
            Traveler t = travelerRepository.findById(s.id()).orElseThrow(() -> new InvalidResetException(generic));
            t.setPasswordHash(hash);
            travelerRepository.save(t);
        }
        tokenRepository.invalidateAll(s.type(), s.id(), now);
    }

    private String buildBody(String name, String otp) {
        return "Xin chào " + (name != null && !name.isBlank() ? name : "bạn") + ",\n\n"
                + "Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu tài khoản Du Lịch Số.\n\n"
                + "Mã xác nhận của bạn: " + otp + "\n\n"
                + "Mã có hiệu lực trong " + otpTtlMinutes + " phút và chỉ dùng được một lần. "
                + "Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên Du Lịch Số.\n\n"
                + "Nếu không phải bạn yêu cầu, hãy bỏ qua email này — mật khẩu của bạn vẫn an toàn.\n\n"
                + "Trân trọng,\nDu Lịch Số";
    }
}

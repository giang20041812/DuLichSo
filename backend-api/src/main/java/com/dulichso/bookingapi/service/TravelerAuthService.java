package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.FieldErrorDto;
import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.repository.TravelerRepository;
import com.dulichso.bookingapi.security.ClientIp;
import com.dulichso.bookingapi.security.JwtUtils;
import com.dulichso.bookingapi.service.GoogleTokenVerifier.GoogleProfile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Đăng ký / đăng nhập khách du lịch (email + mật khẩu hoặc Google). */
@Service
public class TravelerAuthService {

    private static final String INVALID_CREDENTIALS =
            "Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại Email/Số điện thoại hoặc Mật khẩu.";

    private final TravelerRepository travelerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuditLogService auditLogService;
    private final NotificationRecorder notifications;

    public TravelerAuthService(TravelerRepository travelerRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils,
                               AuditLogService auditLogService, NotificationRecorder notifications) {
        this.travelerRepository = travelerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.auditLogService = auditLogService;
        this.notifications = notifications;
    }

    /** Báo cho các Admin biết có khách du lịch mới đăng ký (không làm hỏng đăng ký nếu gửi thông báo lỗi). */
    private void notifyAdminsNewTraveler(Traveler traveler) {
        String name = traveler.getFullName() != null && !traveler.getFullName().isBlank() ? traveler.getFullName() : traveler.getEmail();
        notifications.toAdmins("ADMIN_NEW_TRAVELER", "Traveler", traveler.getId(),
                "Khách \"" + name + "\" (" + traveler.getEmail() + ") vừa đăng ký tài khoản.", "accounts");
    }

    public record TravelerSession(String token, String email, String fullName, String picture, String phone) {}

    public static class InvalidRegistrationException extends RuntimeException {
        public InvalidRegistrationException(String message) { super(message); }
    }

    public static class TravelerInactiveException extends RuntimeException {
        public TravelerInactiveException() { super("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị hệ thống."); }
    }

    public static class InvalidTravelerCredentialsException extends RuntimeException {
        public InvalidTravelerCredentialsException() { super(INVALID_CREDENTIALS); }
    }

    @Transactional
    public TravelerSession register(String fullName, String email, String phone, String password, String confirmPassword) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        String normalizedPhone = phone == null || phone.isBlank() ? null : phone.trim();
        String trimmedName = fullName == null ? "" : fullName.trim();

        if (trimmedName.length() < 2) {
            throw new InvalidRegistrationException("Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự).");
        }
        if (!normalizedEmail.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
            throw new InvalidRegistrationException("Địa chỉ Email không đúng định dạng.");
        }
        if (normalizedPhone != null && !normalizedPhone.matches("^(0|\\+84)(3|5|7|8|9)[0-9]{8}$")) {
            throw new InvalidRegistrationException("Số điện thoại không đúng định dạng (VD: 0912345678).");
        }
        if (password == null || password.length() < 8) {
            throw new InvalidRegistrationException("Mật khẩu phải chứa ít nhất 8 ký tự.");
        }
        if (confirmPassword != null && !password.equals(confirmPassword)) {
            throw new InvalidRegistrationException("Xác nhận mật khẩu không khớp với mật khẩu đã nhập.");
        }
        // Kiểm tra đủ mọi trường trước khi báo, để khách thấy cùng lúc tất cả thông tin bị trùng.
        List<FieldErrorDto> duplicates = new ArrayList<>();
        if (travelerRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            duplicates.add(new FieldErrorDto("email", "Email này đã được sử dụng"));
        }
        if (normalizedPhone != null && travelerRepository.existsByPhone(normalizedPhone)) {
            duplicates.add(new FieldErrorDto("phone", "Số điện thoại này đã được đăng ký"));
        }
        if (!duplicates.isEmpty()) throw new DuplicateFieldsException(duplicates);

        Traveler traveler = travelerRepository.save(Traveler.builder()
                .email(normalizedEmail)
                .phone(normalizedPhone)
                .fullName(trimmedName)
                .passwordHash(passwordEncoder.encode(password))
                .lastLoginAt(LocalDateTime.now())
                .build());
        notifyAdminsNewTraveler(traveler);
        return session(traveler);
    }

    @Transactional
    public TravelerSession login(String identifier, String password) {
        String id = identifier == null ? "" : identifier.trim();
        Traveler traveler = travelerRepository.findByEmailIgnoreCase(id)
                .or(() -> travelerRepository.findByPhone(id))
                .orElse(null);
        if (traveler == null) {
            loginEvent(null, id, "LOGIN_FAILED", AuditLogService.RESULT_FAILURE, "Tài khoản không tồn tại");
            throw new InvalidTravelerCredentialsException();
        }

        if (traveler.getPasswordHash() == null || password == null
                || !passwordEncoder.matches(password, traveler.getPasswordHash())) {
            loginEvent(traveler, id, "LOGIN_FAILED", AuditLogService.RESULT_FAILURE, "Sai mật khẩu");
            throw new InvalidTravelerCredentialsException();
        }
        if (traveler.getStatus() != AccountStatus.ACTIVE) {
            loginEvent(traveler, id, "LOGIN_BLOCKED", AuditLogService.RESULT_DENIED, "Tài khoản bị vô hiệu hóa");
        }
        assertActive(traveler);
        traveler.setLastLoginAt(LocalDateTime.now());
        loginEvent(traveler, id, "LOGIN_SUCCESS", AuditLogService.RESULT_SUCCESS, null);
        return session(travelerRepository.save(traveler));
    }

    /** NFR-SEC-05: ghi sự kiện xác thực của khách; định danh được che, không ghi mật khẩu/token. */
    private void loginEvent(Traveler traveler, String identifier, String action, String result, String reason) {
        auditLogService.recordEvent(traveler == null ? ActorType.SYSTEM : ActorType.CUSTOMER,
                traveler != null ? traveler.getId() : null, action, "Traveler",
                traveler != null ? traveler.getId() : null, result, ClientIp.current(), reason,
                Map.of("identifier", AuditLogService.mask(identifier)));
    }

    /** Tìm theo email Google đã xác minh, chưa có thì tạo mới. */
    @Transactional
    public TravelerSession loginWithGoogle(GoogleProfile profile) {
        Traveler traveler = travelerRepository.findByEmailIgnoreCase(profile.email())
                .orElseGet(() -> Traveler.builder().email(profile.email().toLowerCase()).build());
        assertActive(traveler);
        boolean isNew = traveler.getId() == null;
        if (traveler.getFullName() == null) traveler.setFullName(profile.fullName());
        traveler.setPictureUrl(profile.picture());
        traveler.setLastLoginAt(LocalDateTime.now());
        Traveler saved = travelerRepository.save(traveler);
        if (isNew) notifyAdminsNewTraveler(saved);
        return session(saved);
    }

    private void assertActive(Traveler t) {
        if (t.getStatus() != AccountStatus.ACTIVE) throw new TravelerInactiveException();
    }

    private TravelerSession session(Traveler t) {
        return new TravelerSession(jwtUtils.generateToken(t.getEmail(), "ROLE_GUEST"), t.getEmail(), t.getFullName(), t.getPictureUrl(), t.getPhone());
    }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.repository.TravelerRepository;
import com.dulichso.bookingapi.security.JwtUtils;
import com.dulichso.bookingapi.service.GoogleTokenVerifier.GoogleProfile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Đăng ký / đăng nhập khách du lịch (email + mật khẩu hoặc Google). */
@Service
public class TravelerAuthService {

    private static final String INVALID_CREDENTIALS =
            "Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại Email/Số điện thoại hoặc Mật khẩu.";

    private final TravelerRepository travelerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public TravelerAuthService(TravelerRepository travelerRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.travelerRepository = travelerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public record TravelerSession(String token, String email, String fullName, String picture) {}

    public static class DuplicateAccountException extends RuntimeException {
        public DuplicateAccountException(String message) { super(message); }
    }

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
    public TravelerSession register(String fullName, String email, String phone, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        String normalizedPhone = phone == null || phone.isBlank() ? null : phone.trim();

        if (fullName == null || fullName.isBlank()) {
            throw new InvalidRegistrationException("Vui lòng nhập họ và tên.");
        }
        if (!normalizedEmail.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new InvalidRegistrationException("Email không hợp lệ.");
        }
        if (password == null || password.length() < 6) {
            throw new InvalidRegistrationException("Mật khẩu tối thiểu 6 ký tự.");
        }
        if (travelerRepository.existsByEmailIgnoreCase(normalizedEmail)
                || (normalizedPhone != null && travelerRepository.existsByPhone(normalizedPhone))) {
            throw new DuplicateAccountException("Email hoặc số điện thoại đã được sử dụng.");
        }

        Traveler traveler = travelerRepository.save(Traveler.builder()
                .email(normalizedEmail)
                .phone(normalizedPhone)
                .fullName(fullName.trim())
                .passwordHash(passwordEncoder.encode(password))
                .lastLoginAt(LocalDateTime.now())
                .build());
        return session(traveler);
    }

    @Transactional
    public TravelerSession login(String identifier, String password) {
        String id = identifier == null ? "" : identifier.trim();
        Traveler traveler = travelerRepository.findByEmailIgnoreCase(id)
                .or(() -> travelerRepository.findByPhone(id))
                .orElseThrow(InvalidTravelerCredentialsException::new);

        if (traveler.getPasswordHash() == null || password == null
                || !passwordEncoder.matches(password, traveler.getPasswordHash())) {
            throw new InvalidTravelerCredentialsException();
        }
        assertActive(traveler);
        traveler.setLastLoginAt(LocalDateTime.now());
        return session(travelerRepository.save(traveler));
    }

    /** Tìm theo email Google đã xác minh, chưa có thì tạo mới. */
    @Transactional
    public TravelerSession loginWithGoogle(GoogleProfile profile) {
        Traveler traveler = travelerRepository.findByEmailIgnoreCase(profile.email())
                .orElseGet(() -> Traveler.builder().email(profile.email().toLowerCase()).build());
        assertActive(traveler);
        if (traveler.getFullName() == null) traveler.setFullName(profile.fullName());
        traveler.setPictureUrl(profile.picture());
        traveler.setLastLoginAt(LocalDateTime.now());
        return session(travelerRepository.save(traveler));
    }

    private void assertActive(Traveler t) {
        if (t.getStatus() != AccountStatus.ACTIVE) throw new TravelerInactiveException();
    }

    private TravelerSession session(Traveler t) {
        return new TravelerSession(jwtUtils.generateToken(t.getEmail(), "ROLE_GUEST"), t.getEmail(), t.getFullName(), t.getPictureUrl());
    }
}

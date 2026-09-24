package com.dulichso.bookingapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Mã OTP đặt lại mật khẩu (chỉ lưu bản băm). Áp dụng cho tài khoản portal (Account) và khách (Traveler). */
@Entity
@Table(name = "password_reset_token")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PasswordResetToken {

    public static final String SUBJECT_ACCOUNT = "ACCOUNT";
    public static final String SUBJECT_TRAVELER = "TRAVELER";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ACCOUNT hoặc TRAVELER. */
    @Column(name = "subject_type", nullable = false, length = 10)
    private String subjectType;

    @Column(name = "subject_id", nullable = false)
    private Long subjectId;

    /** Email mà OTP đã được gửi tới. */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "otp_hash", nullable = false, length = 100)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 0;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

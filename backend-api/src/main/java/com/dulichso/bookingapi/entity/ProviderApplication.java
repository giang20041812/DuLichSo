package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** UC-NCC-08: hồ sơ đăng ký nhà cung cấp. Provider + Account chỉ được tạo khi Admin duyệt. */
@Entity
@Table(name = "provider_application")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProviderApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "business_name", nullable = false)
    private String businessName;
    @Column(name = "contact_name", nullable = false)
    private String contactName;
    @Column(name = "contact_phone", nullable = false, length = 32)
    private String contactPhone;
    @Column(name = "contact_email")
    private String contactEmail;
    @Column(nullable = false, length = 500)
    private String address;
    @Column(name = "business_license_no", length = 64)
    private String businessLicenseNo;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProviderApplicationStatus status = ProviderApplicationStatus.PENDING;
    @Column(name = "review_note", length = 500)
    private String reviewNote;
    @Column(name = "reviewed_by")
    private Long reviewedBy;
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    @Column(name = "provider_id")
    private Long providerId;
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

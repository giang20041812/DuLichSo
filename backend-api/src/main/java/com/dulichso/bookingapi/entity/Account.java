package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "account")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String email;
    @Column(unique = true, length = 32)
    private String phone;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountRole role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id")
    private Provider provider;
    
    @Column(name = "full_name")
    private String fullName;
    /**
     * Cấp quản trị (chỉ áp dụng cho role ADMIN): 1 = cao nhất (toàn quyền), 2 = vận hành, 3 = chỉ xem + kiểm duyệt đánh giá.
     * null với tài khoản không phải ADMIN; ADMIN cũ chưa gán được coi là cấp 1 (xem {@link #effectiveAdminLevel()}).
     */
    // Cột là TINYINT (migration 016): khai báo rõ để ddl-auto=validate không đòi INTEGER.
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.TINYINT)
    @Column(name = "admin_level")
    private Integer adminLevel;
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    /** Tăng khi đổi quyền/khóa/đặt lại mật khẩu/đăng xuất: mọi JWT cũ mang phiên bản khác sẽ bị từ chối. */
    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private int tokenVersion = 0;
    /** Lần hoạt động gần nhất của phiên (dùng để hết phiên do không hoạt động). */
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /** Cấp quản trị hiệu lực: null với ADMIN cũ → cấp 1; không phải ADMIN → null. */
    public Integer effectiveAdminLevel() {
        if (role != AccountRole.ADMIN) return null;
        return adminLevel == null ? 1 : adminLevel;
    }
}

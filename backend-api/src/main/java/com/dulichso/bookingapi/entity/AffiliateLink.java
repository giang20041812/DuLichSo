package com.dulichso.bookingapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Link affiliate do Admin tạo cho người dùng giới thiệu khách.
 * commissionRate: % hoa hồng (ví dụ 0.05 = 5%). Admin bắt buộc nhập.
 */
@Entity
@Table(name = "affiliate_link")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AffiliateLink {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

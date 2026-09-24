package com.dulichso.bookingapi.entity;

import com.dulichso.bookingapi.entity.enums.CommissionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Sổ cái hoa hồng affiliate: mỗi booking qua affiliate link tạo 1 ledger entry.
 */
@Entity
@Table(name = "commission_ledger")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CommissionLedger {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affiliate_link_id", nullable = false)
    private AffiliateLink affiliateLink;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommissionStatus status = CommissionStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}

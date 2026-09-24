package com.dulichso.bookingapi.entity;

import com.dulichso.bookingapi.entity.enums.SosRequestStatus;
import com.dulichso.bookingapi.entity.enums.SosRequestType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Yêu cầu SOS/cứu hộ từ du khách.
 * Khách gửi qua /api/public/sos (không cần đăng nhập).
 * Admin điều phối: gán EmergencyContact, cập nhật status.
 */
@Entity
@Table(name = "sos_request")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SosRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_name", nullable = false, length = 255)
    private String requesterName;

    @Column(name = "requester_phone", nullable = false, length = 32)
    private String requesterPhone;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SosRequestType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SosRequestStatus status = SosRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_contact_id")
    private EmergencyContact assignedContact;

    @Column(name = "dispatch_note", length = 500)
    private String dispatchNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}

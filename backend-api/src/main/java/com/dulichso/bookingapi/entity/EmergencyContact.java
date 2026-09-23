package com.dulichso.bookingapi.entity;

import com.dulichso.bookingapi.entity.enums.EmergencyContactType;
import jakarta.persistence.*;
import lombok.*;

/**
 * Đầu mối liên hệ khẩn cấp: cảnh sát, y tế, cứu hoả, hỗ trợ du lịch.
 * Admin quản lý danh sách này, dùng để dispatch SOS request.
 */
@Entity
@Table(name = "emergency_contact")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EmergencyContact {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmergencyContactType type;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 32)
    private String phone;

    @Column(length = 500)
    private String address;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}

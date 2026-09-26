package com.dulichso.bookingapi.entity;

import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Yêu cầu thay đổi của NCC đối với Homestay đang công khai. Dữ liệu chính thức chỉ được cập nhật
 * khi Admin duyệt (APPROVED); {@code beforeData} là ảnh chụp lúc NCC gửi, {@code payload} là nội dung đề xuất.
 */
@Entity
@Table(name = "partner_change_request")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PartnerChangeRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    // Cột là VARCHAR (không phải ENUM của MySQL) nên phải ép Hibernate dùng kiểu VARCHAR khi kiểm tra schema.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "target_type", nullable = false, length = 16)
    private ChangeTargetType targetType;

    /** Id loại phòng (ROOM_TYPE cập nhật) hoặc id bảng giá (ROOM_PRICE cập nhật/xóa); null khi tạo mới. */
    @Column(name = "target_id")
    private Long targetId;

    /** Loại phòng chứa bảng giá (chỉ dùng cho ROOM_PRICE). */
    @Column(name = "room_type_id")
    private Long roomTypeId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 8)
    private ChangeOperation operation;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private ChangeRequestStatus status = ChangeRequestStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> payload;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_data", columnDefinition = "json")
    private Map<String, Object> beforeData;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by", nullable = false)
    private Account submittedBy;

    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Account reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", length = 500)
    private String reviewNote;
}

package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** FR-NCC-14: yêu cầu khách bổ sung/điều chỉnh thông tin cho một đơn đang chờ xử lý. */
@Entity
@Table(name = "booking_info_request")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingInfoRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false, length = 500)
    private String message;
    @Column(name = "requested_by")
    private Long requestedBy;
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "response_text", length = 1000)
    private String responseText;
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
}

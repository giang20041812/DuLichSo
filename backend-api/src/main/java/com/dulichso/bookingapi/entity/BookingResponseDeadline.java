package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** UC-NCC-06/08 (BOOK-BR-11/12): hạn NCC phải phản hồi đơn, chốt một lần khi hệ thống ghi nhận đơn. */
@Entity
@Table(name = "booking_response_deadline")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingResponseDeadline {
    @Id
    @Column(name = "booking_id")
    private Long bookingId;
    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

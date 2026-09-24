package com.dulichso.bookingapi.entity;

import com.dulichso.bookingapi.entity.enums.BookingNoteKind;
import com.dulichso.bookingapi.entity.enums.BookingNoteOutcome;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Ghi chú giám sát của Admin trên Booking. Chỉ ghi nhận, không thay đổi trạng thái Booking. */
@Entity
@Table(name = "booking_admin_note")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingAdminNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "admin_account_id")
    private Long adminAccountId;

    @Column(name = "admin_name", length = 150)
    private String adminName;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARCHAR)
    @Column(nullable = false, length = 20)
    private BookingNoteKind kind;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARCHAR)
    @Column(length = 20)
    private BookingNoteOutcome outcome;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

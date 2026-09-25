package com.dulichso.bookingapi.entity;

import com.dulichso.bookingapi.entity.enums.BookingChangeStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_change_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingChangeStatus status = BookingChangeStatus.PENDING;

    @Column(name = "guest_name")
    private String guestName;

    @Column(name = "guest_phone", length = 32)
    private String guestPhone;

    @Column(name = "guest_email")
    private String guestEmail;

    @Column(name = "guest_note", columnDefinition = "TEXT")
    private String guestNote;

    @Column(name = "service_items_json", columnDefinition = "json")
    private String serviceItemsJson;

    @Column(name = "check_in")
    private LocalDate checkIn;

    @Column(name = "check_out")
    private LocalDate checkOut;

    @Column(name = "room_count")
    private Integer roomCount;

    @Column(name = "guest_count")
    private Integer guestCount;

    @Column(length = 500)
    private String reason;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

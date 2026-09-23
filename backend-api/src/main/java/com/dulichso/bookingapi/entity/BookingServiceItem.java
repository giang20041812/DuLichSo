package com.dulichso.bookingapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_service_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "service_code", length = 64)
    private String serviceCode;

    @Column(length = 500)
    private String note;

    @Column(name = "is_included", nullable = false)
    @Builder.Default
    private Boolean isIncluded = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

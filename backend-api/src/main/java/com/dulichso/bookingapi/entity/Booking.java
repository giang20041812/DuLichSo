package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.enums.ActorType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "booking")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "booking_code", nullable = false, unique = true, length = 32)
    private String bookingCode;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;
    
    @Column(name = "check_in", nullable = false)
    private LocalDate checkIn;
    @Column(name = "check_out", nullable = false)
    private LocalDate checkOut;
    
    @Column(insertable = false, updatable = false)
    private Integer nights;
    
    @Column(name = "room_count", nullable = false)
    private Integer roomCount;
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;
    
    @Column(name = "guest_name", nullable = false)
    private String guestName;
    @Column(name = "guest_phone", nullable = false, length = 32)
    private String guestPhone;
    @Column(name = "guest_email")
    private String guestEmail;
    @Column(name = "guest_note", columnDefinition = "TEXT")
    private String guestNote;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;
    
    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;
    @Column(name = "payment_deadline_at")
    private LocalDateTime paymentDeadlineAt;
    
    @Column(nullable = false, columnDefinition = "CHAR(3)")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    @Builder.Default
    private String currency = "VND";
    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id")
    private CancellationPolicy policy;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "policy_snapshot", columnDefinition = "json", nullable = false)
    private Map<String, Object> policySnapshot;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
    @Column(name = "closed_at")
    private LocalDateTime closedAt;
    @Column(name = "close_reason", length = 500)
    private String closeReason;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "closed_by_actor")
    private ActorType closedByActor;
    
    @Column(name = "dup_guard", insertable = false, updatable = false)
    private Byte dupGuard;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<BookingServiceItem> serviceItems = new java.util.ArrayList<>();
}

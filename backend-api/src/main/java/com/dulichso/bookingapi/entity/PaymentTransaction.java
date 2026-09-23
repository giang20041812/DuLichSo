package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "payment_transaction")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gateway_id", nullable = false)
    private PaymentGateway gateway;
    
    @Column(name = "external_txn_id", length = 128)
    private String externalTxnId;
    
    @Column(nullable = false)
    private BigDecimal amount;
    @Column(nullable = false, columnDefinition = "CHAR(3)")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    @Builder.Default
    private String currency = "VND";
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.INITIATED;
    
    @Column(name = "initiated_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime initiatedAt = LocalDateTime.now();
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_callback", columnDefinition = "json")
    private Map<String, Object> rawCallback;
    
    @Column(name = "success_guard", insertable = false, updatable = false)
    private Long successGuard;
}

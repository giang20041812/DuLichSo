package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.RefundType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cancellation_policy")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CancellationPolicy {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;
    
    @Column(nullable = false)
    private Integer version;
    @Column(nullable = false)
    private String name;
    @Column(name = "free_cancel_cutoff_hours", nullable = false)
    private Integer freeCancelCutoffHours;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "refund_on_late_cancel", nullable = false)
    private RefundType refundOnLateCancel = RefundType.NO_REFUND;
    
    @Column(name = "content_text", nullable = false, columnDefinition = "TEXT")
    private String contentText;
    
    @Column(name = "effective_from", nullable = false)
    private LocalDateTime effectiveFrom = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Account createdBy;
}

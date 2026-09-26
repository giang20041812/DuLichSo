package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "review")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;
    
    @Column(nullable = false)
    private Byte rating;
    @Column(columnDefinition = "TEXT")
    private String content;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private java.util.List<String> images;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.VISIBLE;
    
    @Column(name = "editable_until", nullable = false)
    private LocalDateTime editableUntil;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    /** UC-NCC-09: phản hồi của nhà cung cấp, hiển thị công khai dưới đánh giá. */
    @Column(name = "provider_reply", columnDefinition = "TEXT")
    private String providerReply;
    @Column(name = "provider_reply_at")
    private LocalDateTime providerReplyAt;
    @Column(name = "provider_reply_by")
    private Long providerReplyBy;

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

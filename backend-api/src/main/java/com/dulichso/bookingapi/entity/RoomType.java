package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_type")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomType {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;
    
    @Column(nullable = false)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "max_occupancy", nullable = false)
    private Integer maxOccupancy;
    @Column(name = "total_room_count", nullable = false)
    private Integer totalRoomCount;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "private_bathroom", nullable = false)
    private AmenityValue privateBathroom = AmenityValue.UNVERIFIED;
    
    @Column(name = "area_sqm", precision = 6, scale = 2)
    private BigDecimal areaSqm;
    
    @Column(name = "base_price")
    private BigDecimal basePrice;
    
    @Column(columnDefinition = "enum('ACTIVE','INACTIVE')", nullable = false)
    private String status = "ACTIVE"; // Kept string for simplicity since it's just 'ACTIVE'/'INACTIVE'
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

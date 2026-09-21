package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_bed")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomBed {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;
    
    @Column(name = "bed_type", nullable = false, length = 32)
    private String bedType;
    @Column(nullable = false)
    private Integer quantity;
}

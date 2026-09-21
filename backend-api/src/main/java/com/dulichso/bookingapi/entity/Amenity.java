package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.AmenityScope;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "amenity")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Amenity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 64)
    private String code;
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AmenityScope scope;
    
    @Column(name = "is_essential", nullable = false)
    private Boolean isEssential = false;
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

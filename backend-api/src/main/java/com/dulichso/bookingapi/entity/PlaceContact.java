package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.ContactChannel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "place_contact")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceContact {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactChannel channel;
    
    @Column(nullable = false, length = 500)
    private String value;
    
    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;
    
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}

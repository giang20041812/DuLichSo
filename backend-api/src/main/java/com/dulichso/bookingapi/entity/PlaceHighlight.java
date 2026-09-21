package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.HighlightType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "place_highlight")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceHighlight {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HighlightType type;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}

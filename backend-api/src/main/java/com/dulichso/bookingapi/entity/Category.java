package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "category")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryKind kind;
    
    @Column(nullable = false, unique = true, length = 191)
    private String slug;
    @Column(nullable = false)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "icon_media_id")
    private MediaAsset iconMedia;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "homestay_guard", insertable = false, updatable = false)
    private Byte homestayGuard;
}

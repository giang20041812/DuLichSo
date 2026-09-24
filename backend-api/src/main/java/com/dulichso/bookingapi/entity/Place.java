package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "place")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Place {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 191)
    private String slug;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
        @JoinColumn(name = "category_id", referencedColumnName = "id", nullable = false),
        @JoinColumn(name = "kind", referencedColumnName = "kind", nullable = false)
    })
    private Category category;
    
    @Column(name = "kind", insertable = false, updatable = false)
    @Enumerated(EnumType.STRING)
    private CategoryKind kind;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id")
    private Provider provider;
    
    @Column(nullable = false)
    private String name;
    @Column(name = "name_norm", nullable = false)
    private String nameNorm;
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;
    
    @Column(length = 500)
    private String address;
    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;
    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;
    @Column(name = "access_note", columnDefinition = "TEXT")
    private String accessNote;
    
    @Column(name = "price_ref_min")
    private BigDecimal priceRefMin;
    @Column(name = "price_ref_max")
    private BigDecimal priceRefMax;
    @Column(name = "price_unit_note", length = 64)
    private String priceUnitNote;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PlaceVisibility visibility = PlaceVisibility.DRAFT;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "operation_status", nullable = false)
    @Builder.Default
    private PlaceOperationStatus operationStatus = PlaceOperationStatus.OPERATING;
    
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    @Column(name = "is_suitable_by_time", nullable = false)
    private Boolean isSuitableByTime = false;
    
    @Column(name = "suitable_date_start")
    private java.time.LocalDate suitableDateStart;

    @Column(name = "suitable_date_end")
    private java.time.LocalDate suitableDateEnd;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    @Builder.Default
    private SourceType sourceType = SourceType.PUBLIC_TRUSTED;
    
    @Column(name = "source_name")
    private String sourceName;
    @Column(name = "source_url", length = 1000)
    private String sourceUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PlaceVerificationStatus verification = PlaceVerificationStatus.UNVERIFIED;
    
    @Column(name = "last_verified_at")
    private LocalDate lastVerifiedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_place_id")
    private Place masterPlace;
    
    @Column(name = "rating_avg", precision = 3, scale = 2)
    private BigDecimal ratingAvg;
    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Integer ratingCount = 0;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", nullable = false)
    private Map<String, Object> attributes;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Account createdBy;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Account updatedBy;
    
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

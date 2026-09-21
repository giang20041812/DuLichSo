package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.MediaRole;
import com.dulichso.bookingapi.entity.keys.PlaceMediaId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "place_media")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceMedia {
    @EmbeddedId
    private PlaceMediaId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("placeId")
    @JoinColumn(name = "place_id")
    private Place place;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("mediaId")
    @JoinColumn(name = "media_id")
    private MediaAsset media;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaRole role = MediaRole.GALLERY;
    
    @Column(length = 500)
    private String caption;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
    
    @Column(name = "cover_guard", insertable = false, updatable = false)
    private Long coverGuard;
}

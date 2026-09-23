package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.MediaRole;
import com.dulichso.bookingapi.entity.keys.RoomTypeMediaId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_type_media")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomTypeMedia {
    @EmbeddedId
    private RoomTypeMediaId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomTypeId")
    @JoinColumn(name = "room_type_id")
    private RoomType roomType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("mediaId")
    @JoinColumn(name = "media_id")
    private MediaAsset media;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MediaRole role = MediaRole.GALLERY;
    
    @Column(length = 500)
    private String caption;
    
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
    
    @Column(name = "cover_guard", insertable = false, updatable = false)
    private Long coverGuard;
}

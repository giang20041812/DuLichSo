package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.keys.RoomAmenityId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_amenity")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomAmenity {
    @EmbeddedId
    private RoomAmenityId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomTypeId")
    @JoinColumn(name = "room_type_id")
    private RoomType roomType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("amenityId")
    @JoinColumn(name = "amenity_id")
    private Amenity amenity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AmenityValue value = AmenityValue.UNVERIFIED;
}

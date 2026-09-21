package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.keys.PlaceAmenityId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "place_amenity")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceAmenity {
    @EmbeddedId
    private PlaceAmenityId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("placeId")
    @JoinColumn(name = "place_id")
    private Place place;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("amenityId")
    @JoinColumn(name = "amenity_id")
    private Amenity amenity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AmenityValue value = AmenityValue.UNVERIFIED;
    
    @Column(columnDefinition = "TEXT")
    private String note;
}

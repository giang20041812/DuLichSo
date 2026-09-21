package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.keys.PlaceTagId;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "place_tag")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceTag {
    @EmbeddedId
    private PlaceTagId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("placeId")
    @JoinColumn(name = "place_id")
    private Place place;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_id")
    private Tag tag;
}

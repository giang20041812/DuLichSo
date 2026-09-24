package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.keys.RoomInventoryDayId;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_inventory_day")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomInventoryDay {
    @EmbeddedId
    private RoomInventoryDayId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomTypeId")
    @JoinColumn(name = "room_type_id")
    private RoomType roomType;
    
    @Column(name = "total_rooms", nullable = false)
    private Integer totalRooms;
    @Column(name = "held_rooms", nullable = false)
    @Builder.Default
    private Integer heldRooms = 0;
    @Column(name = "confirmed_rooms", nullable = false)
    @Builder.Default
    private Integer confirmedRooms = 0;
    @Column(name = "stop_sell", nullable = false)
    @Builder.Default
    private Boolean stopSell = false;
    
    @Column(name = "available_rooms", insertable = false, updatable = false)
    private Integer availableRooms;
    
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

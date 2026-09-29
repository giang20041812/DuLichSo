package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.RoomAmenity;
import com.dulichso.bookingapi.entity.keys.RoomAmenityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomAmenityRepository extends JpaRepository<RoomAmenity, RoomAmenityId> {
    @Query("select ra.amenity.name from RoomAmenity ra where ra.roomType.id = :roomTypeId and ra.value = com.dulichso.bookingapi.entity.enums.AmenityValue.YES order by ra.amenity.sortOrder")
    List<String> findActiveNamesByRoomTypeId(@Param("roomTypeId") Long roomTypeId);
}

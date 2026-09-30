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

    /** Tiện ích cấp phòng (YES) của các loại phòng đang mở bán thuộc chỗ nghỉ công khai có {@code kind}. */
    @Query("SELECT DISTINCT a FROM RoomAmenity ra JOIN ra.amenity a JOIN ra.roomType rt JOIN rt.place p " +
           "WHERE ra.value = com.dulichso.bookingapi.entity.enums.AmenityValue.YES AND a.isActive = true " +
           "AND rt.status = 'ACTIVE' AND p.kind = :kind AND p.isDeleted = false " +
           "AND p.visibility = com.dulichso.bookingapi.entity.enums.PlaceVisibility.PUBLISHED")
    List<com.dulichso.bookingapi.entity.Amenity> findAmenitiesInUseByKind(
            @Param("kind") com.dulichso.bookingapi.entity.enums.CategoryKind kind);
}

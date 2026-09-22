package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.RoomTypeMedia;
import com.dulichso.bookingapi.entity.keys.RoomTypeMediaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomTypeMediaRepository extends JpaRepository<RoomTypeMedia, RoomTypeMediaId> {

    @Query("SELECT rtm.media.publicUrl FROM RoomTypeMedia rtm " +
           "WHERE rtm.roomType.id = :roomTypeId " +
           "ORDER BY CASE WHEN rtm.role = com.dulichso.bookingapi.entity.enums.MediaRole.COVER THEN 0 ELSE 1 END, rtm.sortOrder ASC")
    List<String> findPublicUrlsByRoomTypeId(@Param("roomTypeId") Long roomTypeId);
}

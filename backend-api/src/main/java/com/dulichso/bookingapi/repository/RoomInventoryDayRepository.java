package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.RoomInventoryDay;
import com.dulichso.bookingapi.entity.keys.RoomInventoryDayId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface RoomInventoryDayRepository extends JpaRepository<RoomInventoryDay, RoomInventoryDayId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RoomInventoryDay r WHERE r.id.roomTypeId = :roomTypeId AND r.id.stayDate = :stayDate")
    Optional<RoomInventoryDay> findByIdForUpdate(
            @Param("roomTypeId") Long roomTypeId,
            @Param("stayDate") LocalDate stayDate
    );

    @Query("SELECT r FROM RoomInventoryDay r WHERE r.id.roomTypeId = :roomTypeId AND r.id.stayDate >= :startDate AND r.id.stayDate <= :endDate AND r.stopSell = true")
    java.util.List<RoomInventoryDay> findDisabledDaysByRoomTypeAndDateRange(
            @Param("roomTypeId") Long roomTypeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT r FROM RoomInventoryDay r WHERE r.roomType.place.id = :placeId AND r.id.stayDate >= :startDate AND r.id.stayDate <= :endDate AND r.stopSell = true")
    java.util.List<RoomInventoryDay> findDisabledDaysByPlaceAndDateRange(
            @Param("placeId") Long placeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}

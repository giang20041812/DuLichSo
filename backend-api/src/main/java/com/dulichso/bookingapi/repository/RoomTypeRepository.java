package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from RoomType r where r.id = :id")
    java.util.Optional<RoomType> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);
    List<RoomType> findByPlaceIdAndStatus(Long placeId, String status);
    List<RoomType> findByPlaceId(Long placeId);
    List<RoomType> findByPlaceSlugAndStatus(String slug, String status);
}

package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    List<RoomType> findByPlaceIdAndStatus(Long placeId, String status);
    List<RoomType> findByPlaceId(Long placeId);
    List<RoomType> findByPlaceSlugAndStatus(String slug, String status);
}

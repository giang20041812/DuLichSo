package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.PlaceContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceContactRepository extends JpaRepository<PlaceContact, Long> {

    @Query("SELECT pc FROM PlaceContact pc WHERE pc.place.id = :placeId AND pc.isPublic = true ORDER BY pc.sortOrder ASC")
    List<PlaceContact> findByPlaceIdAndIsPublicTrue(@Param("placeId") Long placeId);

    @Query("SELECT pc FROM PlaceContact pc WHERE pc.place.id IN :placeIds AND pc.isPublic = true ORDER BY pc.sortOrder ASC")
    List<PlaceContact> findByPlaceIdInAndIsPublicTrue(@Param("placeIds") List<Long> placeIds);
}

package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.PlaceHighlight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceHighlightRepository extends JpaRepository<PlaceHighlight, Long> {

    @Query("SELECT ph FROM PlaceHighlight ph WHERE ph.place.id = :placeId AND ph.isPublic = true ORDER BY ph.sortOrder ASC")
    List<PlaceHighlight> findByPlaceIdAndIsPublicTrue(@Param("placeId") Long placeId);
}

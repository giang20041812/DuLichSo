package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.PlaceMedia;
import com.dulichso.bookingapi.entity.keys.PlaceMediaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceMediaRepository extends JpaRepository<PlaceMedia, PlaceMediaId> {

    @Query("""
           SELECT pm.media.publicUrl FROM PlaceMedia pm
           WHERE pm.place.id = :placeId
           ORDER BY CASE WHEN pm.role = com.dulichso.bookingapi.entity.enums.MediaRole.COVER THEN 0 ELSE 1 END, pm.sortOrder ASC
           """)
    List<String> findPublicUrlsByPlaceId(@Param("placeId") Long placeId);

    @Query("""
           SELECT pm FROM PlaceMedia pm
           JOIN FETCH pm.media
           WHERE pm.place.id = :placeId
           ORDER BY CASE WHEN pm.role = com.dulichso.bookingapi.entity.enums.MediaRole.COVER THEN 0 ELSE 1 END, pm.sortOrder ASC
           """)
    List<PlaceMedia> findByPlaceIdWithMedia(@Param("placeId") Long placeId);
}

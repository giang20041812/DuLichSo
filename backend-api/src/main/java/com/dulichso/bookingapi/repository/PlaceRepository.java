package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.dto.PlaceSummaryDto;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long>, JpaSpecificationExecutor<Place> {


    @Query(value = """
            SELECT id, name, kind, latitude, longitude, address,
            ( 6371 * acos( cos( radians(:lat) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( latitude ) ) ) ) AS distance
            FROM place
            WHERE visibility = 'PUBLISHED' AND is_deleted = false AND id != :placeId AND latitude IS NOT NULL AND longitude IS NOT NULL
            AND kind != 'HOMESTAY' AND kind != 'HOTEL'
            HAVING distance <= :radius
            ORDER BY distance
            LIMIT :limit
            """, nativeQuery = true)
    List<NearbyPlaceProjection> findNearbyPlaces(
            @Param("lat") BigDecimal lat,
            @Param("lng") BigDecimal lng,
            @Param("radius") double radius,
            @Param("placeId") Long placeId,
            @Param("limit") int limit);

    Optional<Place> findBySlugAndIsDeletedFalse(String slug);

    @Query(value = """
            SELECT * FROM place 
            WHERE visibility = 'PUBLISHED' AND is_deleted = false 
              AND id != :placeId 
              AND kind = 'ATTRACTION'
              AND (region_id = :regionId OR :regionId IS NULL)
            ORDER BY rating_avg DESC, rating_count DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Place> findRegionalDestinations(
            @Param("placeId") Long placeId,
            @Param("regionId") Long regionId,
            @Param("limit") int limit);
}

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

    @Query("SELECT new com.dulichso.bookingapi.dto.PlaceSummaryDto(" +
           "p.id, p.slug, p.name, r.name, m.publicUrl, p.description, " +
           "p.priceRefMin, p.ratingAvg, p.ratingCount, p.attributes, p.kind) " +
           "FROM Place p " +
           "LEFT JOIN p.region r " +
           "LEFT JOIN PlaceMedia pm ON pm.place.id = p.id AND pm.role = 'COVER' " +
           "LEFT JOIN pm.media m " +
           "WHERE p.visibility = :visibility AND p.isDeleted = false " +
           "AND p.kind IN :kinds " +
           "ORDER BY p.ratingAvg DESC, p.ratingCount DESC")
    List<PlaceSummaryDto> findPlaceSummariesByKinds(
            @Param("visibility") PlaceVisibility visibility,
            @Param("kinds") List<CategoryKind> kinds,
            Pageable pageable);

    @Query(value = "SELECT id, name, kind, " +
            "( 6371 * acos( cos( radians(:lat) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( latitude ) ) ) ) AS distance " +
            "FROM place " +
            "WHERE visibility = 'PUBLISHED' AND is_deleted = false AND id != :placeId AND latitude IS NOT NULL AND longitude IS NOT NULL " +
            "AND kind != 'HOMESTAY' AND kind != 'HOTEL' " +
            "HAVING distance <= :radius " +
            "ORDER BY distance " +
            "LIMIT :limit", nativeQuery = true)
    List<NearbyPlaceProjection> findNearbyPlaces(
            @Param("lat") BigDecimal lat,
            @Param("lng") BigDecimal lng,
            @Param("radius") double radius,
            @Param("placeId") Long placeId,
            @Param("limit") int limit);

    Optional<Place> findBySlugAndIsDeletedFalse(String slug);
}

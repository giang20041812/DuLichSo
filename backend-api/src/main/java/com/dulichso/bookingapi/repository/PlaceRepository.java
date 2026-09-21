package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.dto.PlaceSummaryDto;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

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

    java.util.Optional<Place> findBySlugAndIsDeletedFalse(String slug);
}

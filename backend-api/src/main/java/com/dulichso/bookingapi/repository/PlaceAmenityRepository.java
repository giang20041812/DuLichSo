package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.PlaceAmenity;
import com.dulichso.bookingapi.entity.keys.PlaceAmenityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceAmenityRepository extends JpaRepository<PlaceAmenity, PlaceAmenityId> {

    @Query("SELECT pa.amenity.name FROM PlaceAmenity pa " +
           "WHERE pa.place.id = :placeId")
    List<String> findAmenityNamesByPlaceId(@Param("placeId") Long placeId);

    @Query("SELECT pa FROM PlaceAmenity pa JOIN FETCH pa.amenity " +
           "WHERE pa.place.id IN :placeIds ORDER BY pa.amenity.sortOrder ASC")
    List<PlaceAmenity> findByPlaceIdInWithAmenity(@Param("placeIds") List<Long> placeIds);

    @Query("SELECT pa FROM PlaceAmenity pa JOIN FETCH pa.amenity " +
           "WHERE pa.place.id = :placeId ORDER BY pa.amenity.sortOrder ASC")
    List<PlaceAmenity> findByPlaceIdWithAmenity(@Param("placeId") Long placeId);

    /** Tiện ích (cấp cơ sở) đang được ít nhất một chỗ nghỉ công khai thuộc {@code kind} xác nhận có (YES). */
    @Query("SELECT DISTINCT a FROM PlaceAmenity pa JOIN pa.amenity a JOIN pa.place p " +
           "WHERE pa.value = com.dulichso.bookingapi.entity.enums.AmenityValue.YES AND a.isActive = true " +
           "AND p.kind = :kind AND p.isDeleted = false " +
           "AND p.visibility = com.dulichso.bookingapi.entity.enums.PlaceVisibility.PUBLISHED")
    List<com.dulichso.bookingapi.entity.Amenity> findAmenitiesInUseByKind(
            @Param("kind") com.dulichso.bookingapi.entity.enums.CategoryKind kind);
}


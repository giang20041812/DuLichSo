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
           "WHERE pa.place.id = :placeId ORDER BY pa.amenity.sortOrder ASC")
    List<PlaceAmenity> findByPlaceIdWithAmenity(@Param("placeId") Long placeId);
}

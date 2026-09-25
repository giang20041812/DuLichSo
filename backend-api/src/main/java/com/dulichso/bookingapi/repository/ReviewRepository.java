package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Review;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("""
        SELECT r FROM Review r 
        LEFT JOIN FETCH r.booking b
        WHERE r.place.id = :placeId AND r.status = :status
        ORDER BY r.createdAt DESC
    """)
    List<Review> findByPlaceIdAndStatusWithBooking(
            @Param("placeId") Long placeId,
            @Param("status") ReviewStatus status
    );

    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.booking WHERE r.booking.id = :bookingId")
    java.util.Optional<Review> findByBookingIdWithDetails(@Param("bookingId") Long bookingId);

    boolean existsByBookingId(Long bookingId);
}

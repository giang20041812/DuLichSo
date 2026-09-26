package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Review;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>, JpaSpecificationExecutor<Review> {

    /** Khóa đánh giá khi kiểm duyệt để hai Admin không xử lý chồng nhau. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Review r where r.id = :id")
    java.util.Optional<Review> findByIdForUpdate(@Param("id") Long id);

    /** [số đánh giá, điểm trung bình] của các đánh giá đang hiển thị công khai của một điểm đến. */
    @Query("select count(r), avg(r.rating) from Review r where r.place.id = :placeId and r.status = :status")
    java.util.List<Object[]> visibleRatingStats(@Param("placeId") Long placeId, @Param("status") ReviewStatus status);


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

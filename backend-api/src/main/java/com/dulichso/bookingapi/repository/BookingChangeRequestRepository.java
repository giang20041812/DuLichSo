package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.BookingChangeRequest;
import com.dulichso.bookingapi.entity.enums.BookingChangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingChangeRequestRepository extends JpaRepository<BookingChangeRequest, Long> {

    List<BookingChangeRequest> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    @Query("SELECT r FROM BookingChangeRequest r WHERE r.booking.bookingCode = :bookingCode ORDER BY r.createdAt DESC")
    List<BookingChangeRequest> findByBookingCodeOrderByCreatedAtDesc(@Param("bookingCode") String bookingCode);

    @Query("SELECT r FROM BookingChangeRequest r WHERE r.booking.bookingCode = :bookingCode AND r.status = :status ORDER BY r.createdAt DESC")
    List<BookingChangeRequest> findByBookingCodeAndStatus(@Param("bookingCode") String bookingCode, @Param("status") BookingChangeStatus status);

    @Query("SELECT r FROM BookingChangeRequest r JOIN FETCH r.booking b JOIN FETCH b.place p WHERE (:providerId IS NULL OR b.provider.id = :providerId) ORDER BY r.createdAt DESC")
    List<BookingChangeRequest> findAllWithBookingAndPlace(@Param("providerId") Long providerId);
}

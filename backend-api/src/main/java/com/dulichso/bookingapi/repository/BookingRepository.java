package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingCode(String bookingCode);
    boolean existsByBookingCode(String bookingCode);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b 
        WHERE b.roomType.id = :roomTypeId 
          AND b.status IN (com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.AWAITING_PAYMENT, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.CONFIRMED)
          AND b.checkIn < :endDate 
          AND b.checkOut > :startDate
    """)
    java.util.List<Booking> findActiveBookingsByRoomTypeAndDateRange(
            @org.springframework.data.repository.query.Param("roomTypeId") Long roomTypeId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
    );

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b 
        WHERE b.place.id = :placeId 
          AND b.status IN (com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.AWAITING_PAYMENT, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.CONFIRMED)
          AND b.checkIn < :endDate 
          AND b.checkOut > :startDate
    """)
    java.util.List<Booking> findActiveBookingsByPlaceAndDateRange(
            @org.springframework.data.repository.query.Param("placeId") Long placeId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
    );
}

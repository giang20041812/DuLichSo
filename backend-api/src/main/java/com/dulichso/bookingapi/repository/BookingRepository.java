package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingCode(String bookingCode);
    boolean existsByBookingCode(String bookingCode);
}

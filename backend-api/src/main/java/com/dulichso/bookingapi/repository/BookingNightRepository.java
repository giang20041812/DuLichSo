package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.BookingNight;
import com.dulichso.bookingapi.entity.keys.BookingNightId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingNightRepository extends JpaRepository<BookingNight, BookingNightId> {
    List<BookingNight> findByBookingId(Long bookingId);
}

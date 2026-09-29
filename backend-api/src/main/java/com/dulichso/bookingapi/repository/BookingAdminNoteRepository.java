package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.BookingAdminNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingAdminNoteRepository extends JpaRepository<BookingAdminNote, Long> {

    List<BookingAdminNote> findByBookingIdOrderByCreatedAtDescIdDesc(Long bookingId);
}

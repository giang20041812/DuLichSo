package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.BookingAdminNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingAdminNoteRepository extends JpaRepository<BookingAdminNote, Long> {

    List<BookingAdminNote> findByBookingIdOrderByCreatedAtDescIdDesc(Long bookingId);

    /** Booking mà kết quả giám sát MỚI NHẤT là "cần tiếp tục theo dõi". */
    @Query("""
        SELECT n.booking.id FROM BookingAdminNote n
        WHERE n.kind = com.dulichso.bookingapi.entity.enums.BookingNoteKind.OUTCOME
          AND n.outcome = com.dulichso.bookingapi.entity.enums.BookingNoteOutcome.FOLLOW_UP
          AND n.id = (SELECT MAX(n2.id) FROM BookingAdminNote n2
                      WHERE n2.booking = n.booking
                        AND n2.kind = com.dulichso.bookingapi.entity.enums.BookingNoteKind.OUTCOME)
    """)
    List<Long> findBookingIdsNeedingFollowUp();
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.BookingAdminNote;
import com.dulichso.bookingapi.entity.enums.BookingNoteKind;
import com.dulichso.bookingapi.entity.enums.BookingNoteOutcome;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.BookingAdminNoteRepository;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.BookingStatusHistoryRepository;
import com.dulichso.bookingapi.repository.PaymentTransactionRepository;
import com.dulichso.bookingapi.service.AdminBookingMonitorService.AttentionReason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBookingMonitorServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private BookingStatusHistoryRepository historyRepository;
    @Mock private PaymentTransactionRepository paymentRepository;
    @Mock private BookingAdminNoteRepository noteRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private AdminBookingService bookingService;
    @Mock private AuditLogService auditLogService;

    private AdminBookingMonitorService service;
    private final LocalDateTime now = LocalDateTime.of(2026, 9, 24, 12, 0);

    @BeforeEach
    void setUp() {
        service = new AdminBookingMonitorService(bookingRepository, historyRepository, paymentRepository,
                noteRepository, accountRepository, bookingService, auditLogService);
    }

    private Booking booking(BookingStatus status) {
        return Booking.builder().id(7L).bookingCode("VJ-1").status(status)
                .createdAt(now.minusHours(1)).checkIn(now.toLocalDate().plusDays(3))
                .checkOut(now.toLocalDate().plusDays(4)).build();
    }

    @Test
    @DisplayName("attention: đơn PENDING quá 24h bị đánh dấu, đơn mới thì không")
    void attention_pendingStale() {
        Booking fresh = booking(BookingStatus.PENDING);
        assertTrue(AdminBookingMonitorService.attentionReasons(fresh, false, now).isEmpty());

        Booking stale = booking(BookingStatus.PENDING);
        stale.setCreatedAt(now.minusHours(25));
        assertEquals(List.of(AttentionReason.PENDING_STALE),
                AdminBookingMonitorService.attentionReasons(stale, false, now));
    }

    @Test
    @DisplayName("attention: quá hạn thanh toán và đã qua ngày trả phòng")
    void attention_paymentAndStay() {
        Booking pay = booking(BookingStatus.AWAITING_PAYMENT);
        pay.setPaymentDeadlineAt(now.minusMinutes(1));
        assertEquals(List.of(AttentionReason.PAYMENT_OVERDUE), AdminBookingMonitorService.attentionReasons(pay, false, now));

        pay.setPaymentDeadlineAt(now.plusHours(1));
        assertTrue(AdminBookingMonitorService.attentionReasons(pay, false, now).isEmpty());

        Booking stay = booking(BookingStatus.CONFIRMED);
        stay.setCheckOut(now.toLocalDate().minusDays(1));
        assertEquals(List.of(AttentionReason.STAY_UNRESOLVED), AdminBookingMonitorService.attentionReasons(stay, false, now));
    }

    @Test
    @DisplayName("attention: đơn đã hoàn tất chỉ cần chú ý khi Admin đánh dấu theo dõi")
    void attention_followUpOnly() {
        Booking done = booking(BookingStatus.COMPLETED);
        assertTrue(AdminBookingMonitorService.attentionReasons(done, false, now).isEmpty());
        assertEquals(List.of(AttentionReason.FOLLOW_UP), AdminBookingMonitorService.attentionReasons(done, true, now));
    }

    @Test
    @DisplayName("addNote: nội dung rỗng bị từ chối")
    void addNote_blankRejected() {
        when(bookingRepository.findById(7L)).thenReturn(Optional.of(booking(BookingStatus.PENDING)));
        assertThrows(IllegalArgumentException.class,
                () -> service.addNote(7L, BookingNoteKind.VERIFICATION, null, "   ", 1L));
        verify(noteRepository, never()).save(any());
    }

    @Test
    @DisplayName("addNote: ghi nhận kết quả bắt buộc có hướng xử lý")
    void addNote_outcomeRequiresOutcome() {
        when(bookingRepository.findById(7L)).thenReturn(Optional.of(booking(BookingStatus.PENDING)));
        assertThrows(IllegalArgumentException.class,
                () -> service.addNote(7L, BookingNoteKind.OUTCOME, null, "Đã gọi khách", 1L));
    }

    @Test
    @DisplayName("addNote: xác minh lưu thành công, bỏ qua outcome và ghi audit log")
    void addNote_verificationSaved() {
        when(bookingRepository.findById(7L)).thenReturn(Optional.of(booking(BookingStatus.PENDING)));
        when(noteRepository.save(any(BookingAdminNote.class))).thenAnswer(i -> i.getArgument(0));

        var dto = service.addNote(7L, BookingNoteKind.VERIFICATION, BookingNoteOutcome.FOLLOW_UP,
                "  Khách xác nhận đã chuyển khoản  ", 1L);

        assertEquals("Khách xác nhận đã chuyển khoản", dto.content());
        assertNull(dto.outcome());
        verify(auditLogService).record(eq(1L), eq("BOOKING_MONITOR_VERIFICATION"), eq("Booking"), eq(7L),
                anyString(), isNull(), anyMap());
    }

    @Test
    @DisplayName("detail: đơn không tồn tại báo lỗi rõ ràng")
    void detail_notFound() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.detail(99L));
    }
}

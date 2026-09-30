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

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.*;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.InventoryDto;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.*;
import com.dulichso.bookingapi.repository.BookingNightRepository;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerBookingServiceTest {
    @Mock PartnerHomestayService homestays;
    @Mock BookingRepository bookings;
    @Mock BookingNightRepository nights;
    @Mock RoomTypeRepository rooms;
    @Mock RoomCalendarService calendar;
    @Mock EntityManager em;
    @Mock NotificationRecorder notifications;
    @Mock NotificationService notificationService;
    @Mock ResponseDeadlineService deadlines;
    PartnerBookingService service;
    final UserPrincipal principal = new UserPrincipal(null, "provider@example.test", AccountRole.PROVIDER, null);
    Account account;
    Place place;
    RoomType room;
    Booking booking;

    @BeforeEach void setup() {
        service = new PartnerBookingService(homestays, bookings, nights, rooms, calendar, em, notifications, notificationService, deadlines);
        Provider provider = Provider.builder().id(12L).build();
        account = Account.builder().id(7L).role(AccountRole.PROVIDER).provider(provider).build();
        place = Place.builder().id(21L).name("Homestay A").provider(provider).build();
        room = RoomType.builder().id(3L).place(place).name("Phòng đôi").status("ACTIVE").maxOccupancy(2).totalRoomCount(3).basePrice(new BigDecimal("400000")).build();
        LocalDate checkIn = LocalDate.now().plusDays(5);
        booking = Booking.builder().id(50L).bookingCode("VJ-123456").place(place).roomType(room).provider(provider)
                .checkIn(checkIn).checkOut(checkIn.plusDays(2)).nights(2).roomCount(1).guestCount(2)
                .guestName("Khách").guestPhone("0912345678").status(BookingStatus.PENDING)
                .holdExpiresAt(LocalDateTime.now().plusHours(6)).totalAmount(new BigDecimal("800000")).policySnapshot(new HashMap<>()).build();
        lenient().when(homestays.actor(eq(principal), anyBoolean())).thenReturn(account);
        lenient().when(deadlines.dueAt(any(ResponseDeadlineService.BookingRef.class))).thenReturn(LocalDateTime.now().plusMinutes(60));
        @SuppressWarnings("unchecked") TypedQuery<BookingStatusHistory> history = mock(TypedQuery.class, RETURNS_SELF);
        lenient().when(history.getResultStream()).thenAnswer(i -> Stream.empty());
        lenient().when(em.createQuery(anyString(), eq(BookingStatusHistory.class))).thenReturn(history);
        @SuppressWarnings("unchecked") TypedQuery<BookingInfoRequest> infoRequests = mock(TypedQuery.class, RETURNS_SELF);
        lenient().when(infoRequests.getResultStream()).thenAnswer(i -> Stream.empty());
        lenient().when(em.createQuery(anyString(), eq(BookingInfoRequest.class))).thenReturn(infoRequests);
    }

    @Test void requestInfoKeepsBookingPendingAndNotifiesCustomer() {
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        @SuppressWarnings("unchecked") TypedQuery<Long> open = mock(TypedQuery.class, RETURNS_SELF);
        when(open.getSingleResult()).thenReturn(0L);
        when(em.createQuery(anyString(), eq(Long.class))).thenReturn(open);
        var result = service.requestInfo(principal, 50L, new InfoRequestInput("  Vui lòng cho biết giờ đến dự kiến  "));
        assertEquals(BookingStatus.PENDING, result.status());
        var captor = ArgumentCaptor.forClass(Object.class);
        verify(em).persist(captor.capture());
        BookingInfoRequest saved = (BookingInfoRequest) captor.getValue();
        assertEquals("Vui lòng cho biết giờ đến dự kiến", saved.getMessage());
        assertEquals(7L, saved.getRequestedBy());
        verify(notifications).toCustomer(eq("BOOKING_INFO_REQUESTED"), eq("0912345678"), isNull(), eq("booking"), eq(50L), anyMap());
        verify(calendar, never()).lockedDay(any(), any());
    }

    @Test void secondOpenInfoRequestIsRejected() {
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        @SuppressWarnings("unchecked") TypedQuery<Long> open = mock(TypedQuery.class, RETURNS_SELF);
        when(open.getSingleResult()).thenReturn(1L);
        when(em.createQuery(anyString(), eq(Long.class))).thenReturn(open);
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.requestInfo(principal, 50L, new InfoRequestInput("Thêm thông tin"))).getStatusCode().value());
        verify(em, never()).persist(any());
    }

    private BookingStatusHistory capturedHistory() {
        var captor = ArgumentCaptor.forClass(Object.class);
        verify(em).persist(captor.capture());
        return (BookingStatusHistory) captor.getValue();
    }

    /** Khách thanh toán trực tiếp tại chỗ nghỉ: chấp nhận = xác nhận luôn, phòng chuyển từ đang giữ sang đã xác nhận. */
    private void evaluated(BookingEvaluation.Conclusion conclusion) {
        lenient().when(em.find(BookingEvaluation.class, 50L)).thenReturn(BookingEvaluation.builder().bookingId(50L)
                .conclusion(conclusion).evaluatedAt(LocalDateTime.now().plusSeconds(1)).build());
    }

    @Test void acceptConfirmsBookingAndMovesHeldRoomsToConfirmed() {
        evaluated(BookingEvaluation.Conclusion.MEETS);
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        RoomInventoryDay first = RoomInventoryDay.builder().totalRooms(3).heldRooms(1).confirmedRooms(0).stopSell(false).build();
        RoomInventoryDay second = RoomInventoryDay.builder().totalRooms(3).heldRooms(1).confirmedRooms(0).stopSell(false).build();
        when(calendar.lockedDay(room, booking.getCheckIn())).thenReturn(first);
        when(calendar.lockedDay(room, booking.getCheckIn().plusDays(1))).thenReturn(second);
        var result = service.accept(principal, 50L, new AcceptInput(null, "  Có chuẩn bị nôi cho em bé  "));
        assertEquals(BookingStatus.CONFIRMED, result.status());
        assertFalse(result.canAccept());
        assertNotNull(booking.getConfirmedAt());
        assertEquals(0, first.getHeldRooms());
        assertEquals(1, first.getConfirmedRooms());
        assertEquals(0, second.getHeldRooms());
        assertEquals(1, second.getConfirmedRooms());
        var history = capturedHistory();
        assertEquals(BookingStatus.PENDING, history.getFromStatus());
        assertEquals(BookingStatus.CONFIRMED, history.getToStatus());
        assertEquals(ActorType.PROVIDER, history.getActor());
        assertEquals(7L, history.getActorId());
        assertEquals("Có chuẩn bị nôi cho em bé", history.getReason());
        verify(notifications).toCustomer(eq("BOOKING_ACCEPTED_CUSTOMER"), eq("0912345678"), isNull(), eq("booking"), eq(50L),
                argThat(m -> "VJ-123456".equals(m.get("booking_code")) && String.valueOf(m.get("message")).contains("Có chuẩn bị nôi cho em bé")));
        // Kiểm tra giữ chỗ từng đêm (2 lần) + chuyển sang đã xác nhận (2 lần).
        verify(calendar, times(4)).lockedDay(eq(room), any());
    }

    @Test void acceptAfterDecisionDeadlineIsRejected() {
        when(deadlines.dueAt(any(ResponseDeadlineService.BookingRef.class))).thenReturn(LocalDateTime.now().minusMinutes(1));
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        var ex = assertThrows(ResponseStatusException.class, () -> service.accept(principal, 50L, new AcceptInput(null, null)));
        assertEquals(409, ex.getStatusCode().value());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        verify(em, never()).persist(any());
    }

    @Test void acceptingStoppedOrMissingHeldInventoryIsRejected() {
        evaluated(BookingEvaluation.Conclusion.MEETS);
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        var day=RoomInventoryDay.builder().totalRooms(3).heldRooms(1).confirmedRooms(0).stopSell(true).build();
        when(calendar.lockedDay(eq(room), any())).thenReturn(day);
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.accept(principal,50L,new AcceptInput(null,null))).getStatusCode().value());
        day.setStopSell(false);day.setHeldRooms(0);
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.accept(principal,50L,new AcceptInput(null,null))).getStatusCode().value());
        assertEquals(BookingStatus.PENDING,booking.getStatus());verifyNoInteractions(notifications);
    }

    @Test void anotherProvidersBookingIsNotFound() {
        booking.setProvider(Provider.builder().id(99L).build());
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.reject(principal, 50L, new RejectInput("Hết phòng"))).getStatusCode().value());
        verifyNoInteractions(rooms, calendar);
    }

    @Test void rejectReleasesHeldRoomsForEveryNightAndRecordsReason() {
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        RoomInventoryDay first = RoomInventoryDay.builder().totalRooms(3).heldRooms(2).build();
        RoomInventoryDay second = RoomInventoryDay.builder().totalRooms(3).heldRooms(1).build();
        when(calendar.lockedDay(room, booking.getCheckIn())).thenReturn(first);
        when(calendar.lockedDay(room, booking.getCheckIn().plusDays(1))).thenReturn(second);
        var result = service.reject(principal, 50L, new RejectInput("  Homestay bảo trì  "));
        assertEquals(1, first.getHeldRooms());
        assertEquals(0, second.getHeldRooms());
        assertEquals(BookingStatus.REJECTED, result.status());
        assertEquals("Homestay bảo trì", booking.getCloseReason());
        assertEquals(ActorType.PROVIDER, booking.getClosedByActor());
        assertNotNull(booking.getClosedAt());
        assertEquals("Homestay bảo trì", capturedHistory().getReason());
        verify(notifications).toCustomer(eq("BOOKING_REJECTED_CUSTOMER"), eq("0912345678"), isNull(), eq("booking"), eq(50L),
                argThat(m -> "Homestay bảo trì".equals(m.get("reason"))));
    }

    @Test void onlyPendingBookingsCanBeProcessed() {
        booking.setStatus(BookingStatus.AWAITING_PAYMENT);
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.reject(principal, 50L, new RejectInput("Lý do"))).getStatusCode().value());
        verifyNoInteractions(calendar);
    }

    /** UC-NCC-08 luồng phụ 4: NCC không được tự đổi sản phẩm/giá để chấp nhận. */
    @Test void acceptWithDifferentRoomIsRefusedWithoutTouchingInventory() {
        evaluated(BookingEvaluation.Conclusion.MEETS);
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.accept(principal, 50L, new AcceptInput(4L, null))).getStatusCode().value());
        assertSame(room, booking.getRoomType());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        verifyNoInteractions(calendar);
    }

    /** UC-NCC-07/08: phải có kết quả đánh giá "Đáp ứng" còn hiệu lực trước khi chấp nhận. */
    @Test void acceptRequiresMeetsEvaluationThatIsNotStale() {
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.accept(principal, 50L, new AcceptInput(null, null))).getStatusCode().value());
        evaluated(BookingEvaluation.Conclusion.NEEDS_ADJUSTMENT);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.accept(principal, 50L, new AcceptInput(null, null))).getStatusCode().value());
        when(em.find(BookingEvaluation.class, 50L)).thenReturn(BookingEvaluation.builder().bookingId(50L)
                .conclusion(BookingEvaluation.Conclusion.MEETS).evaluatedAt(LocalDateTime.now().minusHours(1)).build());
        room.setUpdatedAt(LocalDateTime.now());
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.accept(principal, 50L, new AcceptInput(null, null))).getStatusCode().value());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        verifyNoInteractions(calendar);
    }

    private void noOpenInfoRequest() {
        @SuppressWarnings("unchecked") TypedQuery<Long> open = mock(TypedQuery.class, RETURNS_SELF);
        lenient().when(open.getSingleResult()).thenReturn(0L);
        lenient().when(em.createQuery(anyString(), eq(Long.class))).thenReturn(open);
    }

    @Test void evaluationMeetsIsSavedWithoutChangingBookingStatus() {
        noOpenInfoRequest();
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        var result = service.evaluate(principal, 50L, new EvaluationInput(BookingEvaluation.Conclusion.MEETS, null, "  Đủ phòng  "));
        assertEquals(BookingStatus.PENDING, result.status());
        var captor = ArgumentCaptor.forClass(Object.class);
        verify(em).persist(captor.capture());
        BookingEvaluation saved = (BookingEvaluation) captor.getValue();
        assertEquals(BookingEvaluation.Conclusion.MEETS, saved.getConclusion());
        assertEquals("Đủ phòng", saved.getNote());
        assertEquals(7L, saved.getEvaluatedBy());
    }

    @Test void evaluationNeedsSpecialRequestResultAndValidCapacity() {
        noOpenInfoRequest();
        booking.setGuestNote("Cần nôi em bé");
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.evaluate(principal, 50L, new EvaluationInput(BookingEvaluation.Conclusion.MEETS, " ", null))).getStatusCode().value());
        booking.setGuestCount(5);
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        var ex = assertThrows(ResponseStatusException.class,
                () -> service.evaluate(principal, 50L, new EvaluationInput(BookingEvaluation.Conclusion.MEETS, "Có nôi", null)));
        assertEquals("Số khách vượt sức chứa phương án phòng.", ex.getReason());
        verify(em, never()).persist(any());
    }

    @Test void rejectAfterDeadlineIsRefused() {
        when(deadlines.dueAt(any(ResponseDeadlineService.BookingRef.class))).thenReturn(LocalDateTime.now().minusSeconds(1));
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.reject(principal, 50L, new RejectInput("Hết phòng"))).getStatusCode().value());
        verifyNoInteractions(calendar);
    }

    /** UC-NCC-08 luồng phụ 2: quá hạn thì hệ thống chuyển Hết hạn và trả phòng đã giữ đúng một lần. */
    @Test void overduePendingBookingIsExpiredAndHoldReleased() {
        @SuppressWarnings("unchecked") TypedQuery<Booking> pending = mock(TypedQuery.class, RETURNS_SELF);
        when(pending.getResultList()).thenReturn(List.of(booking));
        when(em.createQuery(anyString(), eq(Booking.class))).thenReturn(pending);
        when(deadlines.dueAt(anyCollection())).thenReturn(Map.of(50L, LocalDateTime.now().minusMinutes(5)));
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        RoomInventoryDay first = RoomInventoryDay.builder().totalRooms(3).heldRooms(1).build();
        RoomInventoryDay second = RoomInventoryDay.builder().totalRooms(3).heldRooms(1).build();
        when(calendar.lockedDay(room, booking.getCheckIn())).thenReturn(first);
        when(calendar.lockedDay(room, booking.getCheckIn().plusDays(1))).thenReturn(second);

        assertEquals(1, service.expireOverdue());
        assertEquals(BookingStatus.EXPIRED, booking.getStatus());
        assertEquals(ActorType.SYSTEM, booking.getClosedByActor());
        assertEquals(0, first.getHeldRooms());
        assertEquals(0, second.getHeldRooms());
        assertEquals(ActorType.SYSTEM, capturedHistory().getActor());
        // Chạy lại không trả phòng lần hai.
        assertEquals(0, service.expireOverdue());
        assertEquals(0, first.getHeldRooms());
    }

    @Test void bookingStillWithinDeadlineIsNotExpired() {
        @SuppressWarnings("unchecked") TypedQuery<Booking> pending = mock(TypedQuery.class, RETURNS_SELF);
        when(pending.getResultList()).thenReturn(List.of(booking));
        when(em.createQuery(anyString(), eq(Booking.class))).thenReturn(pending);
        when(deadlines.dueAt(anyCollection())).thenReturn(Map.of(50L, LocalDateTime.now().plusMinutes(5)));
        assertEquals(0, service.expireOverdue());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        verifyNoInteractions(calendar);
    }

    // ---------------------------------------------------------------- vận hành lưu trú

    private void confirmedStay(LocalDate checkIn, int nights) {
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCheckIn(checkIn);
        booking.setCheckOut(checkIn.plusDays(nights));
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
    }

    /** Trả phòng đồng thời hoàn thành đơn; không còn bước Hoàn thành riêng. */
    @Test void checkInOnArrivalDayThenCheckOutCompletesBooking() {
        confirmedStay(LocalDate.now(), 2);
        assertEquals(List.of(StayAction.CHECK_IN), PartnerBookingService.allowedStayActions(booking, LocalDate.now()));
        assertEquals(BookingStatus.CHECKED_IN, service.stayAction(principal, 50L, new StayActionInput(StayAction.CHECK_IN, null)).status());
        var done = service.stayAction(principal, 50L, new StayActionInput(StayAction.CHECK_OUT, "Khách hài lòng"));
        assertEquals(BookingStatus.COMPLETED, done.status());
        assertNotNull(booking.getClosedAt());
        assertEquals(ActorType.PROVIDER, booking.getClosedByActor());
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.stayAction(principal, 50L, new StayActionInput(StayAction.COMPLETE, null))).getStatusCode().value());
        verify(em, times(2)).persist(any(BookingStatusHistory.class));
        verifyNoInteractions(calendar);
    }

    @Test void cannotCheckInBeforeArrivalDayOrSkipSteps() {
        confirmedStay(LocalDate.now().plusDays(3), 2);
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.stayAction(principal, 50L, new StayActionInput(StayAction.CHECK_IN, null))).getStatusCode().value());
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> service.stayAction(principal, 50L, new StayActionInput(StayAction.COMPLETE, null))).getStatusCode().value());
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());
        verify(em, never()).persist(any());
    }

    @Test void pendingBookingHasNoStayActions() {
        assertTrue(PartnerBookingService.allowedStayActions(booking, LocalDate.now()).isEmpty());
    }

    @Test void noShowReleasesRemainingNightsFromToday() {
        LocalDate checkIn = LocalDate.now().minusDays(1);
        confirmedStay(checkIn, 3);
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        RoomInventoryDay today = RoomInventoryDay.builder().totalRooms(3).confirmedRooms(2).build();
        RoomInventoryDay tomorrow = RoomInventoryDay.builder().totalRooms(3).confirmedRooms(1).build();
        when(calendar.lockedDay(room, LocalDate.now())).thenReturn(today);
        when(calendar.lockedDay(room, LocalDate.now().plusDays(1))).thenReturn(tomorrow);

        var result = service.stayAction(principal, 50L, new StayActionInput(StayAction.NO_SHOW, null));

        assertEquals(BookingStatus.NO_SHOW, result.status());
        assertEquals(1, today.getConfirmedRooms());
        assertEquals(0, tomorrow.getConfirmedRooms());
        verify(calendar, never()).lockedDay(room, checkIn);
        assertEquals("Khách không đến nhận phòng.", booking.getCloseReason());
    }

    @Test void stayActionOnAnotherProvidersBookingIsNotFound() {
        confirmedStay(LocalDate.now(), 1);
        booking.setProvider(Provider.builder().id(99L).build());
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.stayAction(principal, 50L, new StayActionInput(StayAction.CHECK_IN, null))).getStatusCode().value());
    }
}

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
    PartnerBookingService service;
    final UserPrincipal principal = new UserPrincipal(null, "provider@example.test", AccountRole.PROVIDER, null);
    Account account;
    Place place;
    RoomType room;
    Booking booking;

    @BeforeEach void setup() {
        service = new PartnerBookingService(homestays, bookings, nights, rooms, calendar, em, notifications);
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
        verifyNoInteractions(calendar);
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

    @Test void acceptMovesToAwaitingPaymentWithFifteenMinuteDeadline() {
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        when(calendar.lockedDay(eq(room), any())).thenReturn(RoomInventoryDay.builder().totalRooms(3).heldRooms(1).confirmedRooms(0).stopSell(false).build());
        var result = service.accept(principal, 50L, new AcceptInput(null, "  Có chuẩn bị nôi cho em bé  "));
        assertEquals(BookingStatus.AWAITING_PAYMENT, result.status());
        assertFalse(result.canAccept());
        long minutes = java.time.Duration.between(LocalDateTime.now(), booking.getPaymentDeadlineAt()).toMinutes();
        assertTrue(minutes >= 14 && minutes <= 15);
        var history = capturedHistory();
        assertEquals(BookingStatus.PENDING, history.getFromStatus());
        assertEquals(BookingStatus.AWAITING_PAYMENT, history.getToStatus());
        assertEquals(ActorType.PROVIDER, history.getActor());
        assertEquals(7L, history.getActorId());
        assertEquals("Có chuẩn bị nôi cho em bé", history.getReason());
        verify(notifications).toCustomer(eq("BOOKING_ACCEPTED_CUSTOMER"), eq("0912345678"), isNull(), eq("booking"), eq(50L),
                argThat(m -> "VJ-123456".equals(m.get("booking_code")) && String.valueOf(m.get("message")).contains("Có chuẩn bị nôi cho em bé")));
        verify(calendar, times(2)).lockedDay(eq(room), any());
    }

    @Test void acceptAfterDecisionDeadlineIsRejected() {
        booking.setHoldExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        var ex = assertThrows(ResponseStatusException.class, () -> service.accept(principal, 50L, new AcceptInput(null, null)));
        assertEquals(409, ex.getStatusCode().value());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        verify(em, never()).persist(any());
    }

    @Test void acceptingStoppedOrMissingHeldInventoryIsRejected() {
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

    @Test void acceptWithAlternativeRoomMovesHoldAndRepricesNights() {
        RoomType larger = RoomType.builder().id(4L).place(place).name("Phòng gia đình").status("ACTIVE").maxOccupancy(4).totalRoomCount(2).build();
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        when(rooms.findLockedById(4L)).thenReturn(Optional.of(larger));
        LocalDate d1 = booking.getCheckIn(), d2 = d1.plusDays(1);
        RoomInventoryDay oldA = RoomInventoryDay.builder().totalRooms(3).heldRooms(1).build();
        RoomInventoryDay oldB = RoomInventoryDay.builder().totalRooms(3).heldRooms(1).build();
        RoomInventoryDay newA = RoomInventoryDay.builder().totalRooms(2).heldRooms(0).confirmedRooms(1).build();
        RoomInventoryDay newB = RoomInventoryDay.builder().totalRooms(2).heldRooms(0).confirmedRooms(0).build();
        when(calendar.lockedDay(room, d1)).thenReturn(oldA);
        when(calendar.lockedDay(room, d2)).thenReturn(oldB);
        when(calendar.lockedDay(larger, d1)).thenReturn(newA);
        when(calendar.lockedDay(larger, d2)).thenReturn(newB);
        when(calendar.calendar(larger, d1, booking.getCheckOut())).thenReturn(List.of(
                new InventoryDto(d1, 2, 1, 1, 0, false, new BigDecimal("600000"), null),
                new InventoryDto(d2, 2, 1, 0, 1, false, new BigDecimal("700000"), null)));
        when(nights.findByBookingId(50L)).thenReturn(List.of());

        service.accept(principal, 50L, new AcceptInput(4L, null));

        assertEquals(0, oldA.getHeldRooms());
        assertEquals(0, oldB.getHeldRooms());
        assertEquals(1, newA.getHeldRooms());
        assertEquals(1, newB.getHeldRooms());
        assertSame(larger, booking.getRoomType());
        assertEquals(new BigDecimal("1300000"), booking.getTotalAmount());
        assertEquals(BookingStatus.AWAITING_PAYMENT, booking.getStatus());
        verify(nights, times(2)).save(any(BookingNight.class));
    }

    @Test void alternativeRoomWithoutFreeRoomsIsRejected() {
        RoomType other = RoomType.builder().id(4L).place(place).status("ACTIVE").maxOccupancy(2).totalRoomCount(1).build();
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        when(rooms.findLockedById(4L)).thenReturn(Optional.of(other));
        when(calendar.lockedDay(eq(room), any())).thenAnswer(i -> RoomInventoryDay.builder().totalRooms(3).heldRooms(1).build());
        when(calendar.lockedDay(other, booking.getCheckIn())).thenReturn(RoomInventoryDay.builder().totalRooms(1).heldRooms(0).confirmedRooms(1).build());
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.accept(principal, 50L, new AcceptInput(4L, null))).getStatusCode().value());
        verify(em, never()).persist(any());
    }

    // ---------------------------------------------------------------- vận hành lưu trú

    private void confirmedStay(LocalDate checkIn, int nights) {
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCheckIn(checkIn);
        booking.setCheckOut(checkIn.plusDays(nights));
        when(bookings.findLockedById(50L)).thenReturn(Optional.of(booking));
    }

    @Test void checkInOnArrivalDayThenCheckOutThenComplete() {
        confirmedStay(LocalDate.now(), 2);
        assertEquals(List.of(StayAction.CHECK_IN), PartnerBookingService.allowedStayActions(booking, LocalDate.now()));
        assertEquals(BookingStatus.CHECKED_IN, service.stayAction(principal, 50L, new StayActionInput(StayAction.CHECK_IN, null)).status());
        assertEquals(BookingStatus.CHECKED_OUT, service.stayAction(principal, 50L, new StayActionInput(StayAction.CHECK_OUT, null)).status());
        var done = service.stayAction(principal, 50L, new StayActionInput(StayAction.COMPLETE, "Khách hài lòng"));
        assertEquals(BookingStatus.COMPLETED, done.status());
        assertNotNull(booking.getClosedAt());
        assertEquals(ActorType.PROVIDER, booking.getClosedByActor());
        verify(em, times(3)).persist(any(BookingStatusHistory.class));
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

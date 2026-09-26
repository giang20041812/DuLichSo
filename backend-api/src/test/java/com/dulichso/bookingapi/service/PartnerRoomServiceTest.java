package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.*;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.keys.RoomInventoryDayId;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerRoomServiceTest {
    @Mock PartnerHomestayService homestays;
    @Mock RoomTypeRepository rooms;
    @Mock RoomCalendarService calendar;
    @Mock EntityManager em;
    @Mock PartnerAuditRecorder audit;
    PartnerRoomService service;
    final UserPrincipal principal = new UserPrincipal(null, "provider@example.test", AccountRole.PROVIDER, null);
    Account account;
    Place place;
    RoomType room;

    @BeforeEach void setup() {
        service = new PartnerRoomService(homestays, rooms, calendar, em, audit);
        Provider provider = Provider.builder().id(12L).build();
        account = Account.builder().id(7L).provider(provider).build();
        place = Place.builder().id(21L).provider(provider).build();
        room = RoomType.builder().id(3L).place(place).name("Phòng đôi").status("ACTIVE").maxOccupancy(2).totalRoomCount(5)
                .basePrice(new BigDecimal("500000")).privateBathroom(AmenityValue.YES).build();
        lenient().when(homestays.actor(eq(principal), anyBoolean())).thenReturn(account);
        lenient().when(homestays.owned(eq(21L), eq(account), anyBoolean())).thenReturn(place);
        lenient().when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
    }

    private RoomInventoryDay day(LocalDate date, int total, int held, int confirmed) {
        return RoomInventoryDay.builder().id(new RoomInventoryDayId(3L, date)).roomType(room).totalRooms(total).heldRooms(held).confirmedRooms(confirmed).build();
    }

    @SuppressWarnings("unchecked")
    private void stubSaveQueries(List<RoomInventoryDay> future) {
        TypedQuery<Long> count = mock(TypedQuery.class, RETURNS_SELF);
        when(count.getSingleResult()).thenReturn(0L);
        when(em.createQuery(anyString(), eq(Long.class))).thenReturn(count);
        TypedQuery<RoomInventoryDay> days = mock(TypedQuery.class, RETURNS_SELF);
        when(days.getResultList()).thenReturn(future);
        when(em.createQuery(anyString(), eq(RoomInventoryDay.class))).thenReturn(days);
        Query delete = mock(Query.class, RETURNS_SELF);
        lenient().when(em.createQuery(anyString())).thenReturn(delete);
        TypedQuery<Object[]> range = mock(TypedQuery.class, RETURNS_SELF);
        lenient().when(range.getSingleResult()).thenReturn(new Object[]{new BigDecimal("500000"), new BigDecimal("500000")});
        lenient().when(em.createQuery(anyString(), eq(Object[].class))).thenReturn(range);
    }

    private RoomInput input(int totalRooms) {
        return new RoomInput("Phòng đôi", null, 2, totalRooms, AmenityValue.YES, null, new BigDecimal("500000"), null,
                "ACTIVE", null, List.of(), List.of());
    }

    @Test void reducingRoomCountShrinksFutureCalendarDaysKeepingBrokenRooms() {
        LocalDate d1 = LocalDate.now().plusDays(1), d2 = LocalDate.now().plusDays(2);
        RoomInventoryDay full = day(d1, 5, 1, 1);
        RoomInventoryDay oneBroken = day(d2, 4, 0, 0);
        stubSaveQueries(List.of(full, oneBroken));

        service.save(principal, 21L, 3L, input(3));

        assertEquals(3, full.getTotalRooms());
        assertEquals(2, oneBroken.getTotalRooms());
        assertEquals(3, room.getTotalRoomCount());
        verify(audit).record(eq(account), eq("ROOM_UPDATE"), eq(PartnerAuditRecorder.ROOM_TYPE), eq(3L), isNull(),
                argThat(m -> Integer.valueOf(5).equals(m.get("totalRoomCount"))), argThat(m -> Integer.valueOf(3).equals(m.get("totalRoomCount"))));
    }

    @Test void cannotReduceBelowRoomsAlreadyBookedOnAFutureDay() {
        stubSaveQueries(List.of(day(LocalDate.now().plusDays(1), 5, 2, 2)));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.save(principal, 21L, 3L, input(3))).getStatusCode().value());
        assertEquals(5, room.getTotalRoomCount());
    }

    @Test void increasingRoomCountOpensTheNewRoomsOnExistingDays() {
        RoomInventoryDay d = day(LocalDate.now().plusDays(1), 5, 0, 0);
        stubSaveQueries(List.of(d));
        service.save(principal, 21L, 3L, input(7));
        assertEquals(7, d.getTotalRooms());
    }

    @Test void stopSellRequiresReasonAndStoresIt() {
        var in = new InventoryInput(LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), 5, true, " ");
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.inventory(principal, 21L, 3L, in)).getStatusCode().value());

        RoomInventoryDay a = day(LocalDate.now().plusDays(1), 5, 0, 0), b = day(LocalDate.now().plusDays(2), 5, 0, 0);
        when(calendar.lockedDay(room, a.getId().getStayDate())).thenReturn(a);
        when(calendar.lockedDay(room, b.getId().getStayDate())).thenReturn(b);
        service.inventory(principal, 21L, 3L, new InventoryInput(a.getId().getStayDate(), LocalDate.now().plusDays(3), 4, false, "Phòng 102 hỏng điều hòa"));
        assertEquals(4, a.getTotalRooms());
        assertEquals("Phòng 102 hỏng điều hòa", b.getBlockReason());
        assertFalse(b.getStopSell());
    }

    @Test void reopeningFullInventoryClearsReason() {
        RoomInventoryDay a = day(LocalDate.now().plusDays(1), 4, 0, 0);
        a.setStopSell(true); a.setBlockReason("Bảo trì");
        when(calendar.lockedDay(room, a.getId().getStayDate())).thenReturn(a);
        service.inventory(principal, 21L, 3L, new InventoryInput(a.getId().getStayDate(), LocalDate.now().plusDays(2), 5, false, null));
        assertFalse(a.getStopSell());
        assertNull(a.getBlockReason());
    }

    @Test void closingHomestayStopsSellingEveryRoomTypeAndCountsBookedDays() {
        RoomType other = RoomType.builder().id(4L).place(place).status("ACTIVE").totalRoomCount(2).build();
        when(rooms.findByPlaceId(21L)).thenReturn(List.of(other, room));
        when(rooms.findLockedById(4L)).thenReturn(Optional.of(other));
        LocalDate date = LocalDate.now().plusDays(1);
        RoomInventoryDay booked = day(date, 5, 0, 1);
        RoomInventoryDay free = RoomInventoryDay.builder().totalRooms(2).build();
        when(calendar.lockedDay(room, date)).thenReturn(booked);
        when(calendar.lockedDay(other, date)).thenReturn(free);

        int bookedDays = service.blockHomestay(principal, 21L, new HomestayBlockInput(date, date.plusDays(1), true, "Nghỉ lễ gia đình"));

        assertEquals(1, bookedDays);
        assertTrue(booked.getStopSell());
        assertTrue(free.getStopSell());
        assertEquals("Nghỉ lễ gia đình", free.getBlockReason());
        assertEquals(1, booked.getConfirmedRooms());
        verify(audit).record(eq(account), eq("HOMESTAY_CLOSE_DAYS"), eq(PartnerAuditRecorder.HOMESTAY), eq(21L), eq("Nghỉ lễ gia đình"), isNull(), anyMap());
    }

    @Test void cannotEditPastCalendar() {
        var past = new HomestayBlockInput(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1), true, "Lý do");
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.blockHomestay(principal, 21L, past)).getStatusCode().value());
        verifyNoInteractions(calendar, audit);
    }
}

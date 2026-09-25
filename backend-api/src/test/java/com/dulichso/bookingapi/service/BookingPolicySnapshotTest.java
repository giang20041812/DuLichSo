package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.CreateBookingRequest;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.RefundType;
import com.dulichso.bookingapi.repository.*;
import com.dulichso.bookingapi.service.impl.BookingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingPolicySnapshotTest {
    @Mock BookingRepository bookings;
    @Mock BookingNightRepository nights;
    @Mock RoomInventoryDayRepository inventory;
    @Mock PlaceRepository places;
    @Mock RoomTypeRepository rooms;
    @Mock HomestayProfileRepository profiles;
    @Mock RoomCalendarService calendar;
    @Mock ReviewRepository reviews;
    @Mock PlaceMediaRepository placeMedia;
    @Mock BookingChangeRequestRepository changeRequests;
    @Mock NotificationService notificationService;
    BookingServiceImpl service;
    CreateBookingRequest request;

    @BeforeEach void setup() {
        service = new BookingServiceImpl(bookings, nights, inventory, places, rooms, profiles, calendar,
                reviews, placeMedia, changeRequests, new com.fasterxml.jackson.databind.ObjectMapper(), notificationService);
        Place place = Place.builder().id(1L).name("Homestay").visibility(com.dulichso.bookingapi.entity.enums.PlaceVisibility.PUBLISHED).provider(Provider.builder().id(2L).build()).build();
        RoomType room = RoomType.builder().id(3L).place(place).status("ACTIVE").basePrice(new BigDecimal("400000")).totalRoomCount(3).build();
        request = CreateBookingRequest.builder().placeId(1L).roomTypeId(3L).roomCount(1).guestCount(2)
                .guestName("Khách").guestPhone("0912345678").checkIn(LocalDate.now().plusDays(5)).checkOut(LocalDate.now().plusDays(6)).build();
        when(places.findById(1L)).thenReturn(Optional.of(place));
        when(rooms.findLockedById(3L)).thenReturn(Optional.of(room));
        when(calendar.quote(eq(room),any(),any(),eq(1),eq(2))).thenReturn(new com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.QuoteDto(3L,3,true,new BigDecimal("400000"),java.util.List.of(new com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.InventoryDto(request.getCheckIn(),3,0,0,3,false,new BigDecimal("400000")))));
        when(inventory.findByIdForUpdate(eq(3L), any())).thenReturn(Optional.of(RoomInventoryDay.builder().totalRooms(3).heldRooms(0).confirmedRooms(0).stopSell(false).build()));
        when(bookings.save(any())).thenAnswer(call -> { Booking b = call.getArgument(0); b.setId(20L); return b; });
    }

    @Test void newBookingReferencesCurrentPolicyAndKeepsIndependentSnapshot() {
        CancellationPolicy policy = CancellationPolicy.builder().id(40L).version(3).name("Chính sách mới")
                .freeCancelCutoffHours(72).refundOnLateCancel(RefundType.NO_REFUND).contentText("Hủy trước 72 giờ").build();
        when(profiles.findById(1L)).thenReturn(Optional.of(HomestayProfile.builder().currentPolicy(policy).build()));
        var response = service.createBooking(request);
        var captured = ArgumentCaptor.forClass(Booking.class);
        verify(bookings).save(captured.capture());
        assertSame(policy, captured.getValue().getPolicy());
        assertEquals(40L, response.getPolicySnapshot().get("policyId"));
        assertEquals(3, response.getPolicySnapshot().get("policyVersion"));
        assertEquals(72, response.getPolicySnapshot().get("freeCancelCutoffHours"));
        assertEquals("NO_REFUND", response.getPolicySnapshot().get("refundType"));
        policy.setContentText("Nội dung thay đổi");
        assertEquals("Hủy trước 72 giờ", response.getPolicySnapshot().get("description"));
    }

    @Test void missingPolicyDoesNotInventFreeCancellation() {
        when(profiles.findById(1L)).thenReturn(Optional.empty());
        assertTrue(service.createBooking(request).getPolicySnapshot().isEmpty());
    }
}

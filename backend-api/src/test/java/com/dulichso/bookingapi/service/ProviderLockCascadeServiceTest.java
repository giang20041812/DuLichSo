package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.RoomInventoryDay;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.BookingStatusHistoryRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ACC-BR-08/09: khi Admin khóa tài khoản đăng nhập của NCC, các Booking PENDING của NCC đó phải tự động
 * chuyển CANCELLED, giải phóng phòng đang giữ (held_rooms) và báo cho khách — Booking đã CONFIRMED không
 * được đụng tới (không nằm trong danh sách PENDING nên tự nhiên đã loại trừ).
 */
@ExtendWith(MockitoExtension.class)
class ProviderLockCascadeServiceTest {

    @Mock
    private BookingRepository bookings;
    @Mock
    private RoomTypeRepository roomTypes;
    @Mock
    private RoomCalendarService calendar;
    @Mock
    private BookingStatusHistoryRepository history;
    @Mock
    private NotificationRecorder notifications;

    private ProviderLockCascadeService service;

    @BeforeEach
    void setUp() {
        service = new ProviderLockCascadeService(bookings, roomTypes, calendar, history, notifications);
    }

    @Test
    @DisplayName("Hủy toàn bộ Booking PENDING của NCC, giải phóng phòng và báo khách; trả về đúng số lượng đã hủy")
    void cancelPendingBookings_releasesRoomsAndNotifies() {
        Provider provider = Provider.builder().id(9L).build();
        RoomType roomType = RoomType.builder().id(2L).build();
        Place place = Place.builder().id(1L).name("Test Homestay").build();

        Booking booking = Booking.builder()
                .id(100L).bookingCode("BK100").status(BookingStatus.PENDING)
                .roomType(roomType).place(place).provider(provider)
                .checkIn(LocalDate.now().plusDays(2)).checkOut(LocalDate.now().plusDays(4))
                .roomCount(1).guestPhone("0900000000").guestEmail("guest@x.vn")
                .build();

        when(bookings.findPendingByProviderId(9L)).thenReturn(List.of(booking));
        when(roomTypes.findLockedById(2L)).thenReturn(Optional.of(roomType));
        RoomInventoryDay day = RoomInventoryDay.builder().heldRooms(3).build();
        when(calendar.lockedDay(eq(roomType), any(LocalDate.class))).thenReturn(day);
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        int cancelled = service.cancelPendingBookings(provider);

        assertEquals(1, cancelled);
        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        // checkIn..checkOut = 2 đêm, mỗi đêm giảm đúng roomCount(1) phòng đang giữ: 3 - 1 - 1 = 1.
        assertEquals(1, day.getHeldRooms(), "held_rooms phải giảm đúng số phòng của booking bị hủy, cho mỗi đêm");
        verify(history, times(1)).save(any());
        verify(notifications, times(1)).toCustomer(
                eq("BOOKING_CANCELLED_PROVIDER_LOCKED"), eq("0900000000"), eq("guest@x.vn"),
                eq("booking"), eq(100L), any(Map.class));
    }

    @Test
    @DisplayName("Một Booking lỗi khi hủy không được chặn các Booking còn lại")
    void cancelPendingBookings_oneFailureDoesNotBlockOthers() {
        Provider provider = Provider.builder().id(9L).build();
        Booking broken = Booking.builder().id(1L).bookingCode("BK1").status(BookingStatus.PENDING)
                .roomType(RoomType.builder().id(2L).build()).checkIn(LocalDate.now()).checkOut(LocalDate.now().plusDays(1))
                .roomCount(1).build();
        Booking ok = Booking.builder().id(2L).bookingCode("BK2").status(BookingStatus.PENDING)
                .roomType(RoomType.builder().id(3L).build()).place(Place.builder().id(1L).build())
                .checkIn(LocalDate.now()).checkOut(LocalDate.now().plusDays(1))
                .roomCount(1).guestPhone("p").guestEmail("e@x.vn").build();

        when(bookings.findPendingByProviderId(9L)).thenReturn(List.of(broken, ok));
        // roomType lookup cho `broken` ném lỗi để mô phỏng một đơn xử lý thất bại
        when(roomTypes.findLockedById(2L)).thenThrow(new RuntimeException("lỗi giả lập"));
        when(roomTypes.findLockedById(3L)).thenReturn(Optional.of(ok.getRoomType()));
        when(calendar.lockedDay(eq(ok.getRoomType()), any(LocalDate.class))).thenReturn(RoomInventoryDay.builder().heldRooms(1).build());
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        int cancelled = service.cancelPendingBookings(provider);

        assertEquals(1, cancelled, "Chỉ đơn hợp lệ được tính là đã hủy, đơn lỗi bị bỏ qua chứ không chặn cả batch");
        assertEquals(BookingStatus.PENDING, broken.getStatus(), "Đơn lỗi giữ nguyên trạng thái để Admin xử lý thủ công");
        assertEquals(BookingStatus.CANCELLED, ok.getStatus());
    }
}

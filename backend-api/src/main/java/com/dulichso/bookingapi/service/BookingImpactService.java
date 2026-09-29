package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.BookingStatusHistory;
import com.dulichso.bookingapi.entity.RoomInventoryDay;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.BookingStatusHistoryRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Hệ quả bắt buộc khi Homestay/phòng/NCC ngừng phục vụ. */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingImpactService {
    private final BookingRepository bookings;
    private final RoomTypeRepository rooms;
    private final RoomCalendarService calendar;
    private final BookingStatusHistoryRepository history;
    private final NotificationRecorder notifications;

    @Transactional
    public int cancelForPlace(Long placeId, LocalDate fromDate, LocalDate toDate, String reason) {
        return cancelAll(bookings.findActiveBookingsByPlaceAndDateRange(placeId, fromDate, toDate), reason);
    }

    @Transactional
    public int cancelForRoomType(Long roomTypeId, LocalDate fromDate, LocalDate toDate, String reason) {
        return cancelAll(bookings.findActiveBookingsByRoomTypeAndDateRange(roomTypeId, fromDate, toDate), reason);
    }

    @Transactional
    public int cancelForProvider(Long providerId, String reason) {
        return cancelAll(bookings.findActiveByProviderId(providerId, LocalDate.now()), reason);
    }

    private int cancelAll(List<Booking> candidates, String reason) {
        int count = 0;
        for (Booking booking : candidates) {
            if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REJECTED) continue;
            cancelOne(booking, reason);
            count++;
        }
        return count;
    }

    private void cancelOne(Booking booking, String reason) {
        RoomType room = rooms.findLockedById(booking.getRoomType().getId()).orElse(null);
        if (room != null) {
            for (LocalDate date = booking.getCheckIn(); date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
                RoomInventoryDay day = calendar.lockedDay(room, date);
                if (booking.getStatus() == BookingStatus.CONFIRMED) {
                    day.setConfirmedRooms(Math.max(0, day.getConfirmedRooms() - booking.getRoomCount()));
                } else {
                    day.setHeldRooms(Math.max(0, day.getHeldRooms() - booking.getRoomCount()));
                }
                day.setUpdatedAt(LocalDateTime.now());
            }
        }

        BookingStatus from = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setClosedAt(LocalDateTime.now());
        booking.setCloseReason(reason);
        booking.setClosedByActor(ActorType.SYSTEM);
        bookings.save(booking);
        history.save(BookingStatusHistory.builder().booking(booking).fromStatus(from).toStatus(BookingStatus.CANCELLED)
                .actor(ActorType.SYSTEM).reason(reason).createdAt(LocalDateTime.now()).build());
        Map<String, Object> payload = new HashMap<>();
        payload.put("booking_code", booking.getBookingCode());
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("bookingStatus", BookingStatus.CANCELLED.name());
        payload.put("isRead", false);
        payload.put("title", "Đơn đặt phòng đã bị hủy");
        payload.put("message", "Đơn đặt phòng đã bị hủy do Homestay/NCC ngừng phục vụ. Lý do: " + reason);
        payload.put("homestay_name", booking.getPlace() != null ? booking.getPlace().getName() : "Homestay");
        try {
            notifications.toCustomer("BOOKING_CANCELLED_PROVIDER_LOCKED", booking.getGuestPhone(), booking.getGuestEmail(),
                    "booking", booking.getId(), payload);
        } catch (RuntimeException ex) {
            // Không rollback việc ngừng phục vụ/hủy đơn chỉ vì kênh thông báo lỗi.
            log.error("Không thể ghi thông báo hủy Booking #{}: {}", booking.getId(), ex.getMessage(), ex);
        }
    }
}

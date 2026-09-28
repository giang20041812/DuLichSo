package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.BookingStatusHistory;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.RoomInventoryDay;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.BookingStatusHistoryRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ACC-BR-07/08/09: hệ quả hệ thống khi Admin khóa tài khoản đăng nhập của NCC (Account, role PROVIDER).
 * <ul>
 *   <li>ACC-BR-07: Homestay của NCC ngừng nhận Booking mới — thực hiện bằng kiểm tra Provider/Account status
 *       ngay trong {@code BookingServiceImpl.createBooking}, không thuộc lớp này.</li>
 *   <li>ACC-BR-08: các Booking đang chờ NCC phê duyệt (PENDING) phải chuyển Đã hủy, giải phóng phòng đang giữ,
 *       và báo kết quả cho khách — thực hiện ở lớp này.</li>
 *   <li>ACC-BR-09: Booking đã xác nhận (CONFIRMED trở lên) KHÔNG bị đụng tới — cố ý chỉ xử lý PENDING.</li>
 * </ul>
 * Tách riêng khỏi AdminAccountService để không làm phình trách nhiệm của service quản lý tài khoản.
 */
@Service
@RequiredArgsConstructor
public class ProviderLockCascadeService {
    private static final Logger log = LoggerFactory.getLogger(ProviderLockCascadeService.class);
    static final String TEMPLATE = "BOOKING_CANCELLED_PROVIDER_LOCKED";

    private final BookingRepository bookings;
    private final RoomTypeRepository roomTypes;
    private final RoomCalendarService calendar;
    private final BookingStatusHistoryRepository history;
    private final NotificationRecorder notifications;

    /** @return số Booking đã bị hủy — dùng để ghi vào audit log của thao tác khóa tài khoản. */
    @Transactional
    public int cancelPendingBookings(Provider provider) {
        List<Booking> pending = bookings.findPendingByProviderId(provider.getId());
        int cancelled = 0;
        for (Booking booking : pending) {
            try {
                cancelOne(booking);
                cancelled++;
            } catch (Exception ex) {
                // Một đơn lỗi không được chặn việc khóa tài khoản hay các đơn còn lại; Admin vẫn thấy đơn này
                // ở trạng thái cũ trong danh sách giám sát và có thể xử lý thủ công.
                log.error("Không thể tự động hủy Booking #{} khi khóa NCC #{}: {}", booking.getId(), provider.getId(), ex.getMessage());
            }
        }
        return cancelled;
    }

    private void cancelOne(Booking booking) {
        RoomType room = roomTypes.findLockedById(booking.getRoomType().getId()).orElse(null);
        if (room != null) {
            for (LocalDate date = booking.getCheckIn(); date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
                RoomInventoryDay day = calendar.lockedDay(room, date);
                day.setHeldRooms(Math.max(0, day.getHeldRooms() - booking.getRoomCount()));
                day.setUpdatedAt(LocalDateTime.now());
            }
        }
        BookingStatus from = booking.getStatus();
        String reason = "Nhà cung cấp tạm ngừng hoạt động, đơn tự động hủy.";
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setClosedAt(LocalDateTime.now());
        booking.setCloseReason(reason);
        booking.setClosedByActor(ActorType.SYSTEM);
        bookings.save(booking);
        history.save(BookingStatusHistory.builder().booking(booking).fromStatus(from).toStatus(BookingStatus.CANCELLED)
                .actor(ActorType.SYSTEM).reason(reason).createdAt(LocalDateTime.now()).build());
        notifyCustomer(booking, reason);
    }

    private void notifyCustomer(Booking booking, String reason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("booking_code", booking.getBookingCode());
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("bookingStatus", BookingStatus.CANCELLED.name());
        payload.put("isRead", false);
        payload.put("title", "Đơn đặt phòng đã bị hủy");
        payload.put("message", reason);
        payload.put("homestay_name", booking.getPlace().getName());
        notifications.toCustomer(TEMPLATE, booking.getGuestPhone(), booking.getGuestEmail(), "booking", booking.getId(), payload);
    }
}

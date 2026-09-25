package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.*;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.InventoryDto;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.keys.BookingNightId;
import com.dulichso.bookingapi.repository.BookingNightRepository;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Nhà cung cấp xử lý đơn đặt phòng: xem chi tiết + kiểm tra, chấp nhận (có thể đổi phương án phòng), từ chối.
 * Chỉ đơn PENDING mới được xử lý; mọi thao tác ghi đều khóa booking và loại phòng trước khi đụng tồn kho.
 */
@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class PartnerBookingService {
    /** BR-50: khách phải thanh toán trong 15 phút kể từ lúc nhà cung cấp chấp nhận. */
    static final Duration PAYMENT_WINDOW = Duration.ofMinutes(15);

    private final PartnerHomestayService homestays;
    private final BookingRepository bookings;
    private final BookingNightRepository bookingNights;
    private final RoomTypeRepository rooms;
    private final RoomCalendarService calendar;
    private final EntityManager em;
    private final NotificationRecorder notifications;

    public BookingDetailDto detail(UserPrincipal principal, Long id) {
        Account actor = homestays.actor(principal, false);
        Booking booking = bookings.findById(id).filter(b -> ownedBy(b, actor)).orElseThrow(PartnerBookingService::notFound);
        return toDetail(booking);
    }

    @Transactional
    public BookingDetailDto accept(UserPrincipal principal, Long id, AcceptInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        requirePending(booking);
        LocalDateTime now = LocalDateTime.now();
        if (booking.getHoldExpiresAt() != null && !booking.getHoldExpiresAt().isAfter(now))
            throw conflict("Đơn đã quá hạn xử lý, không thể chấp nhận. Bạn chỉ có thể từ chối đơn này.");
        if (booking.getCheckIn().isBefore(LocalDate.now()))
            throw conflict("Đã qua ngày nhận phòng, không thể chấp nhận đơn.");

        Long currentId = booking.getRoomType().getId();
        Long targetId = input.roomTypeId() == null ? currentId : input.roomTypeId();
        if (targetId.equals(currentId)) {
            RoomType room = rooms.findLockedById(currentId).orElseThrow(PartnerBookingService::notFound);
            if (!capacityOk(room, booking)) throw bad("Loại phòng hiện tại không đủ sức chứa cho số khách. Hãy chọn phương án phòng khác.");
        } else {
            switchRoom(booking, currentId, targetId);
        }

        BookingStatus from = booking.getStatus();
        booking.setStatus(BookingStatus.AWAITING_PAYMENT);
        booking.setPaymentDeadlineAt(now.plus(PAYMENT_WINDOW));
        String note = trimToNull(input.note());
        history(booking, from, actor, note != null ? note : "Nhà cung cấp chấp nhận đơn đặt phòng");
        flush("Khách đã có một đơn khác còn hiệu lực cho loại phòng và khoảng ngày này.");
        notifyCustomer("BOOKING_ACCEPTED_CUSTOMER", booking, Map.of("payment_deadline", booking.getPaymentDeadlineAt().toString(),
                "room_type", booking.getRoomType().getName(), "message", note == null ? "" : note));
        return toDetail(booking);
    }

    @Transactional
    public BookingDetailDto reject(UserPrincipal principal, Long id, RejectInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        requirePending(booking);
        RoomType room = rooms.findLockedById(booking.getRoomType().getId()).orElseThrow(PartnerBookingService::notFound);
        releaseHold(room, booking);

        String reason = input.reason().trim();
        BookingStatus from = booking.getStatus();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setClosedAt(LocalDateTime.now());
        booking.setCloseReason(reason);
        booking.setClosedByActor(ActorType.PROVIDER);
        history(booking, from, actor, reason);
        flush("Không thể cập nhật đơn đặt phòng.");
        notifyCustomer("BOOKING_REJECTED_CUSTOMER", booking, Map.of("reason", reason));
        return toDetail(booking);
    }

    /** FR-NCC-14: đơn vẫn PENDING và vẫn giữ phòng; phía khách trả lời thuộc module Khách hàng (docs/ncc-handoff.md). Mỗi lúc chỉ một yêu cầu đang mở. */
    @Transactional
    public BookingDetailDto requestInfo(UserPrincipal principal, Long id, InfoRequestInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        requirePending(booking);
        if (booking.getHoldExpiresAt() != null && !booking.getHoldExpiresAt().isAfter(LocalDateTime.now()))
            throw conflict("Đơn đã quá hạn xử lý, không thể yêu cầu bổ sung thông tin.");
        if (openInfoRequest(booking.getId())) throw conflict("Đơn đang có một yêu cầu bổ sung chưa được khách phản hồi.");
        String message = input.message().trim();
        em.persist(BookingInfoRequest.builder().booking(booking).message(message).requestedBy(actor.getId()).createdAt(LocalDateTime.now()).build());
        notifyCustomer("BOOKING_INFO_REQUESTED", booking, Map.of("message", message));
        em.flush();
        return toDetail(booking);
    }

    private boolean openInfoRequest(Long bookingId) {
        return em.createQuery("select count(r) from BookingInfoRequest r where r.booking.id=:id and r.respondedAt is null", Long.class)
                .setParameter("id", bookingId).getSingleResult() > 0;
    }

    private void notifyCustomer(String template, Booking booking, Map<String, Object> extra) {
        Map<String, Object> payload = new HashMap<>(extra);
        payload.put("booking_code", booking.getBookingCode());
        payload.put("homestay_name", booking.getPlace().getName());
        notifications.toCustomer(template, booking.getGuestPhone(), booking.getGuestEmail(), "booking", booking.getId(), payload);
    }

    // ---------------------------------------------------------------- ghi

    /** Chuyển phần giữ chỗ của đơn sang loại phòng khác cùng Homestay và tính lại giá theo bảng giá của loại phòng mới. */
    private void switchRoom(Booking booking, Long currentId, Long targetId) {
        // Khóa theo thứ tự id để hai lượt đổi phòng ngược chiều không deadlock.
        RoomType first = rooms.findLockedById(Math.min(currentId, targetId)).orElseThrow(() -> bad("Không tìm thấy loại phòng."));
        RoomType second = rooms.findLockedById(Math.max(currentId, targetId)).orElseThrow(() -> bad("Không tìm thấy loại phòng."));
        RoomType current = first.getId().equals(currentId) ? first : second;
        RoomType target = first.getId().equals(targetId) ? first : second;

        if (!target.getPlace().getId().equals(booking.getPlace().getId())) throw bad("Loại phòng không thuộc Homestay của đơn.");
        if (!"ACTIVE".equals(target.getStatus())) throw bad("Loại phòng được chọn đang ngừng bán.");
        if (!capacityOk(target, booking)) throw bad("Loại phòng được chọn không đủ sức chứa cho số khách.");

        releaseHold(current, booking);
        int count = booking.getRoomCount();
        for (LocalDate date = booking.getCheckIn(); date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
            RoomInventoryDay day = calendar.lockedDay(target, date);
            if (Boolean.TRUE.equals(day.getStopSell())) throw conflict("Loại phòng được chọn đang ngừng bán ngày " + date + ".");
            int available = day.getTotalRooms() - day.getHeldRooms() - day.getConfirmedRooms();
            if (available < count) throw conflict("Loại phòng được chọn không đủ phòng trống ngày " + date + ".");
            day.setHeldRooms(day.getHeldRooms() + count);
        }

        List<InventoryDto> priced = calendar.calendar(target, booking.getCheckIn(), booking.getCheckOut());
        bookingNights.deleteAll(bookingNights.findByBookingId(booking.getId()));
        bookingNights.flush();
        BigDecimal total = BigDecimal.ZERO;
        for (InventoryDto night : priced) {
            bookingNights.save(BookingNight.builder().id(new BookingNightId(booking.getId(), night.stayDate()))
                    .booking(booking).unitPrice(night.price()).roomCount(count).build());
            total = total.add(night.price());
        }
        booking.setRoomType(target);
        booking.setTotalAmount(total.multiply(BigDecimal.valueOf(count)));
    }

    /** Caller phải khóa RoomType trước. */
    private void releaseHold(RoomType room, Booking booking) {
        for (LocalDate date = booking.getCheckIn(); date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
            RoomInventoryDay day = calendar.lockedDay(room, date);
            day.setHeldRooms(Math.max(0, day.getHeldRooms() - booking.getRoomCount()));
            day.setUpdatedAt(LocalDateTime.now());
        }
    }

    private void history(Booking booking, BookingStatus from, Account actor, String reason) {
        em.persist(BookingStatusHistory.builder().booking(booking).fromStatus(from).toStatus(booking.getStatus())
                .actor(ActorType.PROVIDER).actorId(actor.getId()).reason(reason).createdAt(LocalDateTime.now()).build());
    }

    private void flush(String duplicateMessage) {
        try {
            em.flush();
        } catch (DataIntegrityViolationException | jakarta.persistence.PersistenceException ex) {
            throw conflict(duplicateMessage);
        }
    }

    // ---------------------------------------------------------------- đọc

    private BookingDetailDto toDetail(Booking b) {
        LocalDateTime now = LocalDateTime.now();
        boolean pending = b.getStatus() == BookingStatus.PENDING;
        boolean withinDeadline = b.getHoldExpiresAt() == null || b.getHoldExpiresAt().isAfter(now);
        List<RoomOptionDto> options = pending ? roomOptions(b) : List.of();

        List<NightDto> nights = bookingNights.findByBookingId(b.getId()).stream()
                .sorted(Comparator.comparing(n -> n.getId().getStayDate()))
                .map(n -> new NightDto(n.getId().getStayDate(), n.getUnitPrice(), n.getRoomCount())).toList();
        List<ServiceItemDto> services = b.getServiceItems().stream()
                .filter(s -> !Boolean.FALSE.equals(s.getIsIncluded()))
                .map(s -> new ServiceItemDto(s.getServiceName(), s.getNote())).toList();
        List<InfoRequestDto> infoRequests = infoRequests(em, b.getId());
        List<HistoryDto> history = em.createQuery("select h from BookingStatusHistory h where h.booking.id=:id order by h.createdAt, h.id", BookingStatusHistory.class)
                .setParameter("id", b.getId()).getResultStream()
                .map(h -> new HistoryDto(h.getFromStatus(), h.getToStatus(), h.getActor(), h.getReason(), h.getCreatedAt())).toList();

        return new BookingDetailDto(b.getId(), b.getBookingCode(), b.getStatus(),
                b.getPlace().getId(), b.getPlace().getName(), b.getRoomType().getId(), b.getRoomType().getName(),
                b.getCheckIn(), b.getCheckOut(), b.getNights(), b.getRoomCount(), b.getGuestCount(),
                b.getGuestName(), b.getGuestPhone(), b.getGuestEmail(), b.getGuestNote(),
                b.getTotalAmount(), b.getCurrency(),
                b.getCreatedAt(), b.getHoldExpiresAt(), b.getPaymentDeadlineAt(),
                b.getConfirmedAt(), b.getClosedAt(), b.getCloseReason(),
                b.getPolicySnapshot() == null ? Map.of() : b.getPolicySnapshot(),
                nights, services, history, infoRequests,
                pending ? checks(b, services, infoRequests, withinDeadline) : List.of(), options,
                pending && withinDeadline && !b.getCheckIn().isBefore(LocalDate.now()), pending,
                pending && withinDeadline && infoRequests.stream().allMatch(r -> r.respondedAt() != null));
    }

    /** FR-NCC-13/15/16/17: các kiểm tra tự động trên đơn đang chờ xử lý. */
    private List<CheckDto> checks(Booking b, List<ServiceItemDto> services, List<InfoRequestDto> infoRequests, boolean withinDeadline) {
        List<CheckDto> list = new ArrayList<>();
        boolean hasContact = notBlank(b.getGuestName()) && notBlank(b.getGuestPhone());
        list.add(new CheckDto("CONTACT", "Thông tin người đặt",
                !hasContact ? CheckLevel.FAIL : notBlank(b.getGuestEmail()) ? CheckLevel.OK : CheckLevel.WARN,
                !hasContact ? "Thiếu họ tên hoặc số điện thoại khách." : notBlank(b.getGuestEmail()) ? "Đủ họ tên, số điện thoại và email." : "Có họ tên và số điện thoại, khách không để lại email."));

        boolean future = !b.getCheckIn().isBefore(LocalDate.now());
        list.add(new CheckDto("DATES", "Thời gian lưu trú", future ? CheckLevel.OK : CheckLevel.FAIL,
                future ? b.getNights() + " đêm, từ " + b.getCheckIn() + " đến " + b.getCheckOut() + "." : "Ngày nhận phòng đã qua."));

        RoomType room = b.getRoomType();
        boolean capacity = capacityOk(room, b);
        list.add(new CheckDto("CAPACITY", "Sức chứa loại phòng", capacity ? CheckLevel.OK : CheckLevel.FAIL,
                b.getGuestCount() + " khách / " + b.getRoomCount() + " phòng, tối đa " + room.getMaxOccupancy() + " khách mỗi phòng."));

        list.add(new CheckDto("AVAILABILITY", "Tình trạng phòng", "ACTIVE".equals(room.getStatus()) ? CheckLevel.OK : CheckLevel.WARN,
                "ACTIVE".equals(room.getStatus()) ? "Đã giữ " + b.getRoomCount() + " phòng cho đơn này trên lịch phòng."
                        : "Đã giữ phòng cho đơn nhưng loại phòng hiện đang ngừng bán."));

        boolean hasPolicy = b.getPolicySnapshot() != null && !b.getPolicySnapshot().isEmpty();
        list.add(new CheckDto("PRICE_POLICY", "Giá và chính sách áp dụng", hasPolicy ? CheckLevel.OK : CheckLevel.WARN,
                hasPolicy ? "Giá theo từng đêm và chính sách hủy đã được chốt lúc khách đặt." : "Giá đã chốt nhưng Homestay chưa có chính sách hủy lúc khách đặt."));

        boolean special = notBlank(b.getGuestNote()) || !services.isEmpty();
        list.add(new CheckDto("SPECIAL_REQUEST", "Yêu cầu đặc biệt", special ? CheckLevel.WARN : CheckLevel.OK,
                special ? "Khách có ghi chú hoặc dịch vụ kèm theo, cần xem xét và phản hồi khi chấp nhận." : "Khách không có yêu cầu đặc biệt."));

        if (!infoRequests.isEmpty()) {
            boolean waiting = infoRequests.stream().anyMatch(r -> r.respondedAt() == null);
            list.add(new CheckDto("INFO_REQUEST", "Yêu cầu bổ sung thông tin", waiting ? CheckLevel.WARN : CheckLevel.OK,
                    waiting ? "Đang chờ khách phản hồi yêu cầu bổ sung." : "Khách đã phản hồi yêu cầu bổ sung, xem nội dung bên dưới."));
        }

        list.add(new CheckDto("DEADLINE", "Hạn xử lý", withinDeadline ? CheckLevel.OK : CheckLevel.FAIL,
                b.getHoldExpiresAt() == null ? "Không có hạn giữ chỗ." : (withinDeadline ? "Cần xử lý trước " : "Đã quá hạn lúc ") + b.getHoldExpiresAt() + "."));
        return list;
    }

    /** FR-NCC-15/18: khả năng cung cấp và giá của từng loại phòng trong Homestay cho khoảng ngày của đơn. */
    private List<RoomOptionDto> roomOptions(Booking b) {
        List<RoomOptionDto> list = new ArrayList<>();
        for (RoomType room : rooms.findByPlaceId(b.getPlace().getId())) {
            boolean current = room.getId().equals(b.getRoomType().getId());
            boolean capacity = capacityOk(room, b);
            if (current) {
                // Phòng của đơn đã được giữ sẵn trong held_rooms nên luôn còn đủ cho chính đơn này.
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), true, b.getRoomCount(),
                        capacity, capacity, b.getTotalAmount(), capacity ? null : "Không đủ sức chứa"));
                continue;
            }
            if (!"ACTIVE".equals(room.getStatus())) {
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), false, 0, capacity, false, null, "Đang ngừng bán"));
                continue;
            }
            try {
                var quote = calendar.quote(room, b.getCheckIn(), b.getCheckOut(), b.getRoomCount(), b.getGuestCount());
                String reason = quote.availableRooms() < b.getRoomCount() ? "Không đủ phòng trống" : capacity ? null : "Không đủ sức chứa";
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), false, quote.availableRooms(),
                        capacity, quote.suitable(), quote.totalAmount(), reason));
            } catch (ResponseStatusException ex) {
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), false, 0, capacity, false, null, ex.getReason()));
            }
        }
        list.sort(Comparator.comparing(RoomOptionDto::current).reversed().thenComparing(RoomOptionDto::suitable, Comparator.reverseOrder()));
        return list;
    }

    // ---------------------------------------------------------------- helpers

    /** Công khai để module Khách hàng dùng lại khi hiển thị yêu cầu bổ sung cho khách. */
    static List<InfoRequestDto> infoRequests(EntityManager em, Long bookingId) {
        return em.createQuery("select r from BookingInfoRequest r where r.booking.id=:id order by r.createdAt, r.id", BookingInfoRequest.class)
                .setParameter("id", bookingId).getResultStream()
                .map(r -> new InfoRequestDto(r.getId(), r.getMessage(), r.getCreatedAt(), r.getResponseText(), r.getRespondedAt())).toList();
    }

    private Booking lockedOwned(Long id, Account actor) {
        return bookings.findLockedById(id).filter(b -> ownedBy(b, actor)).orElseThrow(PartnerBookingService::notFound);
    }

    private static boolean ownedBy(Booking b, Account actor) {
        return b.getProvider() != null && b.getProvider().getId().equals(actor.getProvider().getId());
    }

    private static void requirePending(Booking b) {
        if (b.getStatus() != BookingStatus.PENDING) throw conflict("Đơn không còn ở trạng thái chờ xử lý.");
    }

    private static boolean capacityOk(RoomType room, Booking b) {
        return room.getMaxOccupancy() != null && (long) room.getMaxOccupancy() * b.getRoomCount() >= b.getGuestCount();
    }

    private static boolean notBlank(String s) {return s != null && !s.isBlank();}
    private static String trimToNull(String s) {return notBlank(s) ? s.trim() : null;}
    private static ResponseStatusException notFound() {return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt phòng của bạn.");}
    private static ResponseStatusException bad(String text) {return new ResponseStatusException(HttpStatus.BAD_REQUEST, text);}
    private static ResponseStatusException conflict(String text) {return new ResponseStatusException(HttpStatus.CONFLICT, text);}
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.*;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.InventoryDto;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.BookingEvaluation.Conclusion;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.repository.BookingNightRepository;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminBookingService.BookingDto;
import com.dulichso.bookingapi.service.ResponseDeadlineService.BookingRef;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Nhà cung cấp xử lý đơn đặt phòng theo UC-NCC-06 (tiếp nhận, kiểm tra, yêu cầu bổ sung), UC-NCC-07 (đánh giá khả năng
 * đáp ứng) và UC-NCC-08 (chấp nhận / từ chối). Chỉ đơn PENDING, còn trong hạn 120 phút theo khung giờ xử lý mới được
 * quyết định; mọi thao tác ghi đều khóa booking và loại phòng trước khi đụng tồn kho.
 */
@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class PartnerBookingService {
    /** BR-50: khách phải thanh toán trong 15 phút kể từ lúc nhà cung cấp chấp nhận. */
    static final Duration PAYMENT_WINDOW = Duration.ofMinutes(15);
    static final String EXPIRED_REASON = "Nhà cung cấp không phản hồi trong 120 phút xử lý; phòng đã giữ được trả lại.";

    private final PartnerHomestayService homestays;
    private final BookingRepository bookings;
    private final BookingNightRepository bookingNights;
    private final RoomTypeRepository rooms;
    private final RoomCalendarService calendar;
    private final EntityManager em;
    private final NotificationRecorder notifications;
    private final NotificationService notificationService;
    private final ResponseDeadlineService deadlines;

    public BookingDetailDto detail(UserPrincipal principal, Long id) {
        Account actor = homestays.actor(principal, false);
        Booking booking = bookings.findById(id).filter(b -> ownedBy(b, actor))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có quyền xem Booking này."));
        return toDetail(booking);
    }

    /** UC-NCC-06: danh sách đơn kèm hạn phản hồi của các đơn đang chờ. */
    public Page<BookingRowDto> rows(Page<BookingDto> page) {
        List<BookingRef> refs = page.getContent().stream().filter(b -> b.status() == BookingStatus.PENDING)
                .map(b -> new BookingRef(b.id(), b.placeId(), b.createdAt())).toList();
        Map<Long, LocalDateTime> due = deadlines.dueAt(refs);
        LocalDateTime now = LocalDateTime.now();
        return page.map(b -> new BookingRowDto(b, due.get(b.id()), minutesLeft(due.get(b.id()), now)));
    }

    /** UC-NCC-07: lưu kết quả đánh giá. Chưa đổi trạng thái đơn. */
    @Transactional
    public BookingDetailDto evaluate(UserPrincipal principal, Long id, EvaluationInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        requirePending(booking);
        requireWithinDeadline(booking, "Booking đã hết thời hạn xử lý.");
        if (openInfoRequest(booking.getId()))
            throw conflict("Đơn đang chờ khách bổ sung thông tin; hãy đánh giá sau khi khách phản hồi.");
        String special = trimToNull(input.specialRequestResult());
        if (hasSpecialRequest(booking) && special == null)
            throw bad("Vui lòng ghi rõ đáp ứng hoặc không đáp ứng từng yêu cầu đặc biệt của khách.");
        if (input.conclusion() == Conclusion.MEETS) {
            RoomType room = rooms.findLockedById(booking.getRoomType().getId()).orElseThrow(PartnerBookingService::notFound);
            if (!"ACTIVE".equals(room.getStatus()) || !holdStillValid(room, booking))
                throw conflict("Không đủ phòng trong toàn bộ thời gian lưu trú.");
        }
        BookingEvaluation evaluation = em.find(BookingEvaluation.class, booking.getId());
        if (evaluation == null) evaluation = BookingEvaluation.builder().bookingId(booking.getId()).build();
        evaluation.setConclusion(input.conclusion());
        evaluation.setSpecialRequestResult(special);
        evaluation.setNote(trimToNull(input.note()));
        evaluation.setEvaluatedBy(actor.getId());
        evaluation.setEvaluatedAt(LocalDateTime.now());
        if (!em.contains(evaluation)) em.persist(evaluation);
        em.flush();
        return toDetail(booking);
    }

    /** UC-NCC-08 luồng chính: chấp nhận đúng phương án khách đã chọn, sau khi đã đánh giá "Đáp ứng". */
    @Transactional
    public BookingDetailDto accept(UserPrincipal principal, Long id, AcceptInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        requirePending(booking);
        requireWithinDeadline(booking, "Booking đã quá thời hạn phản hồi.");
        LocalDateTime now = LocalDateTime.now();
        if (booking.getCheckIn().isBefore(LocalDate.now()))
            throw conflict("Đã qua ngày nhận phòng, không thể chấp nhận đơn.");
        Long currentId = booking.getRoomType().getId();
        if (input.roomTypeId() != null && !input.roomTypeId().equals(currentId))
            throw bad("Không được tự đổi loại phòng hoặc giá khi chấp nhận. Hãy lưu đánh giá \"Cần điều chỉnh\" và đề xuất cho khách xác nhận.");

        RoomType room = rooms.findLockedById(currentId).orElseThrow(PartnerBookingService::notFound);
        BookingEvaluation evaluation = em.find(BookingEvaluation.class, booking.getId());
        if (evaluation == null || evaluation.getConclusion() != Conclusion.MEETS)
            throw conflict("Cần lưu kết quả đánh giá \"Đáp ứng\" trước khi chấp nhận Booking.");
        if (isStale(evaluation, room))
            throw conflict("Dữ liệu phòng đã thay đổi sau khi đánh giá. Vui lòng kiểm tra lại khả năng đáp ứng.");
        if (!"ACTIVE".equals(room.getStatus())) throw conflict("Không thể xác nhận vì khả năng cung cấp đã thay đổi.");
        for (LocalDate date = booking.getCheckIn(); date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
            RoomInventoryDay day = calendar.lockedDay(room, date);
            if (Boolean.TRUE.equals(day.getStopSell()) || day.getHeldRooms() < booking.getRoomCount()
                    || day.getHeldRooms() + day.getConfirmedRooms() > day.getTotalRooms())
                throw conflict("Không thể xác nhận vì khả năng cung cấp đã thay đổi (ngày " + date + ").");
        }

        BookingStatus from = booking.getStatus();
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(now);
        confirmHold(room, booking);

        String note = trimToNull(input.note());
        if (note == null) note = evaluation.getSpecialRequestResult();
        history(booking, from, actor, note != null ? note : "Nhà cung cấp chấp nhận đơn đặt phòng");
        flush("Khách đã có một đơn khác còn hiệu lực cho loại phòng và khoảng ngày này.");
        notifyCustomer("BOOKING_ACCEPTED_CUSTOMER", booking, Map.of(
                "room_type", booking.getRoomType().getName(), "message", note == null ? "" : note));
        try {
            notificationService.notifyBookingStatusChange(booking, BookingStatus.CONFIRMED, note);
        } catch (Exception ex) {
            // Không để lỗi gửi thông báo làm hỏng giao dịch chính (trạng thái và tồn kho đã cập nhật).
        }
        return toDetail(booking);
    }

    /** UC-NCC-08 luồng phụ 1: từ chối kèm lý do, giải phóng phòng đã giữ đúng một lần. */
    @Transactional
    public BookingDetailDto reject(UserPrincipal principal, Long id, RejectInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        requirePending(booking);
        requireWithinDeadline(booking, "Booking đã quá thời hạn phản hồi.");
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
        try {
            notificationService.notifyBookingStatusChange(booking, BookingStatus.REJECTED, reason);
        } catch (Exception ex) {
            // Không để lỗi gửi thông báo làm hỏng giao dịch chính.
        }
        return toDetail(booking);
    }

    /** UC-NCC-06 luồng phụ 1 (FR-NCC-14): đơn vẫn PENDING và vẫn giữ phòng; không gia hạn. Mỗi lúc chỉ một yêu cầu đang mở. */
    @Transactional
    public BookingDetailDto requestInfo(UserPrincipal principal, Long id, InfoRequestInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        requirePending(booking);
        requireWithinDeadline(booking, "Booking đã quá thời hạn xử lý.");
        if (openInfoRequest(booking.getId())) throw conflict("Đơn đang có một yêu cầu bổ sung chưa được khách phản hồi.");
        String message = input.message().trim();
        em.persist(BookingInfoRequest.builder().booking(booking).message(message).requestedBy(actor.getId()).createdAt(LocalDateTime.now()).build());
        notifyCustomer("BOOKING_INFO_REQUESTED", booking, Map.of("message", message));
        em.flush();
        return toDetail(booking);
    }

    /**
     * UC-NCC-08 luồng phụ 2 (BOOK-BR-11/12): đơn quá hạn phản hồi được chuyển sang Hết hạn và trả lại phòng đã giữ đúng một
     * lần. Gọi định kỳ từ {@link PendingBookingExpiryJob}.
     * @return số đơn đã chuyển sang Hết hạn
     */
    @Transactional
    public int expireOverdue() {
        return expireOverdue(null);
    }

    /**
     * Chuyển ngay các đơn quá hạn của một NCC trước khi NCC xem danh sách/chi tiết, để trạng thái luôn khớp với hạn phản hồi
     * (không phải chờ lượt chạy kế tiếp của tác vụ nền, hoặc khi backend vừa khởi động lại).
     */
    @Transactional
    public int expireOverdueFor(UserPrincipal principal) {
        return expireOverdue(homestays.actor(principal, false).getProvider().getId());
    }

    private int expireOverdue(Long providerId) {
        var query = em.createQuery("select b from Booking b where b.status = :status"
                + (providerId == null ? "" : " and b.provider.id = :provider"), Booking.class).setParameter("status", BookingStatus.PENDING);
        if (providerId != null) query.setParameter("provider", providerId);
        List<Booking> pending = query.getResultList();
        if (pending.isEmpty()) return 0;
        Map<Long, LocalDateTime> due = deadlines.dueAt(pending.stream()
                .map(b -> new BookingRef(b.getId(), b.getPlace().getId(), b.getCreatedAt())).toList());
        LocalDateTime now = LocalDateTime.now();
        int expired = 0;
        for (Booking candidate : pending) {
            LocalDateTime dueAt = due.get(candidate.getId());
            if (dueAt == null || dueAt.isAfter(now)) continue;
            Booking booking = bookings.findLockedById(candidate.getId()).orElse(null);
            if (booking == null || booking.getStatus() != BookingStatus.PENDING) continue;
            RoomType room = rooms.findLockedById(booking.getRoomType().getId()).orElse(null);
            if (room != null) releaseHold(room, booking);
            BookingStatus from = booking.getStatus();
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setClosedAt(now);
            booking.setCloseReason(EXPIRED_REASON);
            booking.setClosedByActor(ActorType.SYSTEM);
            em.persist(BookingStatusHistory.builder().booking(booking).fromStatus(from).toStatus(BookingStatus.EXPIRED)
                    .actor(ActorType.SYSTEM).reason(EXPIRED_REASON).createdAt(now).build());
            notifyCustomer("BOOKING_EXPIRED_CUSTOMER", booking, Map.of("reason", EXPIRED_REASON));
            try {
                notificationService.notifyBookingStatusChange(booking, BookingStatus.EXPIRED, EXPIRED_REASON);
            } catch (Exception ex) {
                // Không để lỗi gửi thông báo chặn việc trả phòng.
            }
            expired++;
        }
        em.flush();
        return expired;
    }

    private boolean openInfoRequest(Long bookingId) {
        return em.createQuery("select count(r) from BookingInfoRequest r where r.booking.id=:id and r.respondedAt is null", Long.class)
                .setParameter("id", bookingId).getSingleResult() > 0;
    }

    /**
     * Vận hành lưu trú (CONFIRMED → CHECKED_IN → COMPLETED, hoặc CONFIRMED → NO_SHOW).
     * Nhận/trả phòng không đổi tồn kho vì phòng đã nằm trong confirmed_rooms; NO_SHOW nhả các đêm từ hôm nay trở đi để bán lại.
     */
    @Transactional
    public BookingDetailDto stayAction(UserPrincipal principal, Long id, StayActionInput input) {
        Account actor = homestays.actor(principal, true);
        Booking booking = lockedOwned(id, actor);
        LocalDate today = LocalDate.now();
        if (!allowedStayActions(booking, today).contains(input.action()))
            throw conflict(switch (input.action()) {
                case CHECK_IN -> "Chỉ nhận phòng được với đơn đã xác nhận, trong khoảng ngày lưu trú.";
                case CHECK_OUT -> "Chỉ trả phòng được với đơn đang lưu trú.";
                case COMPLETE -> "Hành động này đã gộp chung với Trả phòng.";
                case NO_SHOW -> "Chỉ đánh dấu khách không đến với đơn đã xác nhận, từ sau ngày nhận phòng.";
            });
        BookingStatus from = booking.getStatus();
        String note = trimToNull(input.note());
        switch (input.action()) {
            case CHECK_IN -> booking.setStatus(BookingStatus.CHECKED_IN);
            case CHECK_OUT -> {
                booking.setStatus(BookingStatus.COMPLETED);
                booking.setClosedAt(LocalDateTime.now());
                booking.setClosedByActor(ActorType.PROVIDER);
            }
            case COMPLETE -> throw bad("Hành động này đã bị loại bỏ.");
            case NO_SHOW -> {
                RoomType room = rooms.findLockedById(booking.getRoomType().getId()).orElseThrow(PartnerBookingService::notFound);
                LocalDate from0 = booking.getCheckIn().isAfter(today) ? booking.getCheckIn() : today;
                for (LocalDate date = from0; date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
                    RoomInventoryDay day = calendar.lockedDay(room, date);
                    day.setConfirmedRooms(Math.max(0, day.getConfirmedRooms() - booking.getRoomCount()));
                    day.setUpdatedAt(LocalDateTime.now());
                }
                booking.setStatus(BookingStatus.NO_SHOW);
                booking.setClosedAt(LocalDateTime.now());
                booking.setClosedByActor(ActorType.PROVIDER);
                booking.setCloseReason(note != null ? note : "Khách không đến nhận phòng.");
            }
        }
        history(booking, from, actor, note != null ? note : switch (input.action()) {
            case CHECK_IN -> "Khách đã nhận phòng";
            case CHECK_OUT -> "Khách đã trả phòng, hoàn thành đơn";
            case COMPLETE -> "Hoàn thành đơn đặt phòng";
            case NO_SHOW -> "Khách không đến nhận phòng";
        });
        flush("Không thể cập nhật đơn đặt phòng.");
        return toDetail(booking);
    }

    static List<StayAction> allowedStayActions(Booking b, LocalDate today) {
        return switch (b.getStatus()) {
            case CONFIRMED -> {
                List<StayAction> actions = new ArrayList<>();
                if (!today.isBefore(b.getCheckIn()) && today.isBefore(b.getCheckOut())) actions.add(StayAction.CHECK_IN);
                if (today.isAfter(b.getCheckIn())) actions.add(StayAction.NO_SHOW);
                yield actions;
            }
            case CHECKED_IN -> List.of(StayAction.CHECK_OUT);
            default -> List.of();
        };
    }

    private void notifyCustomer(String template, Booking booking, Map<String, Object> extra) {
        Map<String, Object> payload = new HashMap<>(extra);
        payload.put("booking_code", booking.getBookingCode());
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("bookingStatus", booking.getStatus().name());
        payload.put("isRead", false);
        payload.put("title", switch (template) {
            case "BOOKING_INFO_REQUESTED" -> "Chủ nhà cần bổ sung thông tin";
            case "BOOKING_EXPIRED_CUSTOMER" -> "Yêu cầu đặt phòng đã hết hạn";
            default -> booking.getStatus() == BookingStatus.REJECTED ? "Yêu cầu đặt phòng bị từ chối" : "Booking đã được xác nhận";
        });
        String message = template.equals("BOOKING_INFO_REQUESTED") ? String.valueOf(extra.get("message"))
                : booking.getStatus() == BookingStatus.REJECTED || booking.getStatus() == BookingStatus.EXPIRED ? String.valueOf(extra.get("reason"))
                : "Phòng: " + booking.getRoomType().getName() + ". Tổng tiền: " + booking.getTotalAmount()
                    + " VND. Khách hàng vui lòng thanh toán trực tiếp tại chỗ nghỉ. " + extra.getOrDefault("message", "");
        payload.put("message", message);
        payload.put("homestay_name", booking.getPlace().getName());
        notifications.toCustomer(template, booking.getGuestPhone(), booking.getGuestEmail(), "booking", booking.getId(), payload);
    }

    // ---------------------------------------------------------------- ghi

    /** Caller phải khóa RoomType trước. */
    private void releaseHold(RoomType room, Booking booking) {
        for (LocalDate date = booking.getCheckIn(); date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
            RoomInventoryDay day = calendar.lockedDay(room, date);
            day.setHeldRooms(Math.max(0, day.getHeldRooms() - booking.getRoomCount()));
            day.setUpdatedAt(LocalDateTime.now());
        }
    }

    private void confirmHold(RoomType room, Booking booking) {
        for (LocalDate date = booking.getCheckIn(); date.isBefore(booking.getCheckOut()); date = date.plusDays(1)) {
            RoomInventoryDay day = calendar.lockedDay(room, date);
            day.setHeldRooms(Math.max(0, day.getHeldRooms() - booking.getRoomCount()));
            day.setConfirmedRooms(day.getConfirmedRooms() + booking.getRoomCount());
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
        boolean pending = b.getStatus() == BookingStatus.PENDING;
        LocalDateTime dueAt = pending ? dueAt(b) : null;
        boolean withinDeadline = dueAt == null || dueAt.isAfter(LocalDateTime.now());
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

        boolean infoComplete = infoRequests.stream().allMatch(r -> r.respondedAt() != null);
        BookingEvaluation evaluation = pending ? em.find(BookingEvaluation.class, b.getId()) : null;
        boolean stale = evaluation != null && isStale(evaluation, b.getRoomType());
        EvaluationDto evaluationDto = evaluation == null ? null : new EvaluationDto(evaluation.getConclusion(),
                evaluation.getSpecialRequestResult(), evaluation.getNote(), evaluation.getEvaluatedAt(), stale);
        boolean open = pending && withinDeadline;
        boolean canAccept = open && !b.getCheckIn().isBefore(LocalDate.now()) && evaluation != null
                && evaluation.getConclusion() == Conclusion.MEETS && !stale;
        List<InventoryDto> availability = pending ? calendar.calendar(b.getRoomType(), b.getCheckIn(), b.getCheckOut()) : List.of();

        return new BookingDetailDto(b.getId(), b.getBookingCode(), b.getStatus(),
                b.getPlace().getId(), b.getPlace().getName(), b.getRoomType().getId(), b.getRoomType().getName(),
                b.getCheckIn(), b.getCheckOut(), b.getNights(), b.getRoomCount(), b.getGuestCount(),
                b.getGuestName(), b.getGuestPhone(), b.getGuestEmail(), b.getGuestNote(),
                b.getTotalAmount(), b.getCurrency(),
                b.getCreatedAt(), b.getHoldExpiresAt(), b.getPaymentDeadlineAt(),
                b.getConfirmedAt(), b.getClosedAt(), b.getCloseReason(),
                b.getPolicySnapshot() == null ? Map.of() : b.getPolicySnapshot(),
                nights, services, history, infoRequests,
                pending ? checks(b, services, infoRequests, withinDeadline, dueAt) : List.of(), options,
                canAccept, open, open && infoComplete,
                allowedStayActions(b, LocalDate.now()),
                dueAt, minutesLeft(dueAt, LocalDateTime.now()), pending && !withinDeadline, availability, evaluationDto, open && infoComplete);
    }

    private static Long minutesLeft(LocalDateTime dueAt, LocalDateTime now) {
        return dueAt == null ? null : java.time.Duration.between(now, dueAt).toMinutes();
    }

    private LocalDateTime dueAt(Booking b) {
        return deadlines.dueAt(new BookingRef(b.getId(), b.getPlace().getId(), b.getCreatedAt()));
    }

    /** FR-NCC-13/15/16/17: các kiểm tra tự động trên đơn đang chờ xử lý. */
    private List<CheckDto> checks(Booking b, List<ServiceItemDto> services, List<InfoRequestDto> infoRequests, boolean withinDeadline, LocalDateTime dueAt) {
        List<CheckDto> list = new ArrayList<>();
        boolean hasContact = notBlank(b.getGuestName()) && notBlank(b.getGuestPhone());
        list.add(new CheckDto("CONTACT", "Thông tin người đặt",
                !hasContact ? CheckLevel.FAIL : notBlank(b.getGuestEmail()) ? CheckLevel.OK : CheckLevel.WARN,
                !hasContact ? "Thiếu họ tên hoặc số điện thoại khách." : notBlank(b.getGuestEmail()) ? "Đủ họ tên, số điện thoại và email." : "Có họ tên và số điện thoại, khách không để lại email."));

        boolean future = !b.getCheckIn().isBefore(LocalDate.now());
        list.add(new CheckDto("DATES", "Thời gian lưu trú", future ? CheckLevel.OK : CheckLevel.FAIL,
                future ? b.getNights() + " đêm, từ " + b.getCheckIn() + " đến " + b.getCheckOut() + "." : "Ngày nhận phòng đã qua."));

        RoomType room = b.getRoomType();
        list.add(new CheckDto("CAPACITY", "Số khách", CheckLevel.OK,
                b.getGuestCount() + " khách / " + b.getRoomCount() + " phòng; không giới hạn theo sức chứa cấu hình."));

        boolean available = "ACTIVE".equals(room.getStatus()) && holdStillValid(room, b);
        list.add(new CheckDto("AVAILABILITY", "Tình trạng phòng", available ? CheckLevel.OK : CheckLevel.FAIL,
                available ? "Đã giữ " + b.getRoomCount() + " phòng cho đơn này trong toàn bộ thời gian lưu trú."
                        : "Không đủ phòng trong toàn bộ thời gian lưu trú."));

        boolean hasPolicy = b.getPolicySnapshot() != null && !b.getPolicySnapshot().isEmpty();
        list.add(new CheckDto("PRICE_POLICY", "Giá và chính sách áp dụng", hasPolicy ? CheckLevel.OK : CheckLevel.WARN,
                hasPolicy ? "Giá theo từng đêm và chính sách hủy đã được chốt lúc khách đặt." : "Giá đã chốt nhưng Homestay chưa có chính sách hủy lúc khách đặt."));

        boolean special = notBlank(b.getGuestNote()) || !services.isEmpty();
        list.add(new CheckDto("SPECIAL_REQUEST", "Yêu cầu đặc biệt", special ? CheckLevel.WARN : CheckLevel.OK,
                special ? "Khách có ghi chú hoặc dịch vụ kèm theo; cần ghi rõ đáp ứng hay không khi đánh giá." : "Khách không có yêu cầu đặc biệt."));

        if (!infoRequests.isEmpty()) {
            boolean waiting = infoRequests.stream().anyMatch(r -> r.respondedAt() == null);
            list.add(new CheckDto("INFO_REQUEST", "Yêu cầu bổ sung thông tin", waiting ? CheckLevel.WARN : CheckLevel.OK,
                    waiting ? "Đang chờ khách phản hồi yêu cầu bổ sung." : "Khách đã phản hồi yêu cầu bổ sung, xem nội dung bên dưới."));
        }

        list.add(new CheckDto("DEADLINE", "Hạn phản hồi", withinDeadline ? CheckLevel.OK : CheckLevel.FAIL,
                dueAt == null ? "Không có hạn phản hồi." : withinDeadline ? "Cần phản hồi trước " + dueAt + " (120 phút trong khung giờ xử lý)."
                        : "Booking đã quá thời hạn xử lý (hạn " + dueAt + ")."));
        return list;
    }

    /** Phòng của đơn vẫn được giữ đủ và không bị đóng bán trên toàn bộ các đêm. */
    private boolean holdStillValid(RoomType room, Booking b) {
        return calendar.calendar(room, b.getCheckIn(), b.getCheckOut()).stream()
                .allMatch(d -> !d.stopSell() && d.heldRooms() >= b.getRoomCount() && d.heldRooms() + d.confirmedRooms() <= d.totalRooms());
    }

    /**
     * Khả năng cung cấp của các loại phòng khác cùng Homestay — chỉ để NCC tham khảo khi đề xuất điều chỉnh cho khách
     * (UC-NCC-07 luồng phụ 4); không dùng để tự đổi phòng khi chấp nhận.
     */
    private List<RoomOptionDto> roomOptions(Booking b) {
        List<RoomOptionDto> list = new ArrayList<>();
        for (RoomType room : rooms.findByPlaceId(b.getPlace().getId())) {
            boolean current = room.getId().equals(b.getRoomType().getId());
            if (current) {
                boolean available = "ACTIVE".equals(room.getStatus()) && holdStillValid(room, b);
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), true, available ? b.getRoomCount() : 0,
                        true, available, b.getTotalAmount(), available ? null : "Phòng ngừng bán hoặc giữ chỗ không còn hợp lệ"));
                continue;
            }
            if (!"ACTIVE".equals(room.getStatus())) {
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), false, 0, true, false, null, "Đang ngừng bán"));
                continue;
            }
            try {
                var quote = calendar.quote(room, b.getCheckIn(), b.getCheckOut(), b.getRoomCount(), b.getGuestCount());
                String reason = quote.availableRooms() < b.getRoomCount() ? "Không đủ phòng trống" : null;
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), false, quote.availableRooms(),
                        true, quote.suitable(), quote.totalAmount(), reason));
            } catch (ResponseStatusException ex) {
                list.add(new RoomOptionDto(room.getId(), room.getName(), room.getMaxOccupancy(), false, 0, true, false, null, ex.getReason()));
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

    private void requireWithinDeadline(Booking booking, String message) {
        LocalDateTime dueAt = dueAt(booking);
        if (dueAt != null && !dueAt.isAfter(LocalDateTime.now())) throw conflict(message);
    }

    /** UC-NCC-07 luồng phụ 5: dữ liệu loại phòng đổi sau khi đánh giá thì không dùng kết quả cũ để xác nhận. */
    private static boolean isStale(BookingEvaluation evaluation, RoomType room) {
        return room.getUpdatedAt() != null && evaluation.getEvaluatedAt() != null && room.getUpdatedAt().isAfter(evaluation.getEvaluatedAt());
    }

    private static boolean hasSpecialRequest(Booking b) {
        return notBlank(b.getGuestNote()) || b.getServiceItems().stream().anyMatch(s -> !Boolean.FALSE.equals(s.getIsIncluded()));
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

    private static boolean notBlank(String s) {return s != null && !s.isBlank();}
    private static String trimToNull(String s) {return notBlank(s) ? s.trim() : null;}
    private static ResponseStatusException notFound() {return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt phòng của bạn.");}
    private static ResponseStatusException bad(String text) {return new ResponseStatusException(HttpStatus.BAD_REQUEST, text);}
    private static ResponseStatusException conflict(String text) {return new ResponseStatusException(HttpStatus.CONFLICT, text);}
}

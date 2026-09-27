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
import com.dulichso.bookingapi.service.AdminBookingService.BookingDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Giám sát Booking cho Admin: chi tiết đầy đủ, danh sách cần chú ý, ghi nhận xác minh / kết quả.
 * Admin chỉ ghi chú và theo dõi — không đổi trạng thái Booking (thuộc quyền NCC / hệ thống thanh toán).
 */
@Service
public class AdminBookingMonitorService {

    /** Đơn chờ NCC xử lý quá số giờ này bị coi là cần chú ý. */
    static final int PENDING_STALE_HOURS = 24;
    static final int MAX_NOTE_LENGTH = 2000;

    public enum AttentionReason {
        PENDING_STALE("Chờ NCC xác nhận quá " + PENDING_STALE_HOURS + " giờ"),
        PAYMENT_OVERDUE("Quá hạn thanh toán nhưng chưa được đóng"),
        STAY_UNRESOLVED("Đã qua ngày trả phòng nhưng chưa hoàn tất"),
        FOLLOW_UP("Admin đánh dấu cần tiếp tục theo dõi");

        public final String label;

        AttentionReason(String label) {
            this.label = label;
        }
    }

    public record AttentionItem(BookingDto booking, AttentionReason reason, String reasonLabel) {}

    public record HistoryDto(BookingStatus fromStatus, BookingStatus toStatus, String actor, Long actorId,
                             String reason, LocalDateTime createdAt) {}

    public record ServiceItemDto(String serviceName, String serviceCode, String note, Boolean included) {}

    public record PaymentDto(Long id, String gateway, String externalTxnId, BigDecimal amount, String currency,
                             String status, LocalDateTime initiatedAt, LocalDateTime paidAt) {}

    public record NoteDto(Long id, BookingNoteKind kind, BookingNoteOutcome outcome, String content,
                          String adminName, LocalDateTime createdAt) {}

    public record BookingDetailDto(BookingDto booking, LocalDateTime holdExpiresAt, LocalDateTime paymentDeadlineAt,
                                   String closedByActor, List<HistoryDto> history, List<ServiceItemDto> services,
                                   List<PaymentDto> payments, List<NoteDto> notes,
                                   List<AttentionReason> attention) {}

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final BookingAdminNoteRepository noteRepository;
    private final AccountRepository accountRepository;
    private final AdminBookingService bookingService;
    private final AuditLogService auditLogService;

    public AdminBookingMonitorService(BookingRepository bookingRepository,
                                      BookingStatusHistoryRepository historyRepository,
                                      PaymentTransactionRepository paymentRepository,
                                      BookingAdminNoteRepository noteRepository,
                                      AccountRepository accountRepository,
                                      AdminBookingService bookingService,
                                      AuditLogService auditLogService) {
        this.bookingRepository = bookingRepository;
        this.historyRepository = historyRepository;
        this.paymentRepository = paymentRepository;
        this.noteRepository = noteRepository;
        this.accountRepository = accountRepository;
        this.bookingService = bookingService;
        this.auditLogService = auditLogService;
    }

    /** Lý do cần chú ý của một Booking (rỗng = không cần chú ý). Các điều kiện độc lập nhau. */
    static List<AttentionReason> attentionReasons(Booking b, boolean followUp, LocalDateTime now) {
        List<AttentionReason> reasons = new ArrayList<>();
        BookingStatus s = b.getStatus();
        if (s == BookingStatus.PENDING && b.getCreatedAt() != null
                && b.getCreatedAt().isBefore(now.minusHours(PENDING_STALE_HOURS))) {
            reasons.add(AttentionReason.PENDING_STALE);
        }
        if (s == BookingStatus.AWAITING_PAYMENT && b.getPaymentDeadlineAt() != null
                && b.getPaymentDeadlineAt().isBefore(now)) {
            reasons.add(AttentionReason.PAYMENT_OVERDUE);
        }
        if ((s == BookingStatus.CONFIRMED || s == BookingStatus.CHECKED_IN)
                && b.getCheckOut() != null && b.getCheckOut().isBefore(now.toLocalDate())) {
            reasons.add(AttentionReason.STAY_UNRESOLVED);
        }
        if (followUp) {
            reasons.add(AttentionReason.FOLLOW_UP);
        }
        return reasons;
    }

    /** Danh sách Booking cần Admin quan tâm (FR-AD-07), mỗi Booking một dòng với lý do ưu tiên cao nhất. */
    @Transactional(readOnly = true)
    public List<AttentionItem> attention() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        Set<Long> followUpIds = Set.copyOf(noteRepository.findBookingIdsNeedingFollowUp());

        List<Booking> candidates = bookingRepository.findAll((root, query, cb) -> {
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("place", jakarta.persistence.criteria.JoinType.INNER);
                root.fetch("provider", jakarta.persistence.criteria.JoinType.INNER);
                root.fetch("roomType", jakarta.persistence.criteria.JoinType.INNER);
            }
            var pending = cb.and(cb.equal(root.get("status"), BookingStatus.PENDING),
                    cb.lessThan(root.get("createdAt"), now.minusHours(PENDING_STALE_HOURS)));
            var payment = cb.and(cb.equal(root.get("status"), BookingStatus.AWAITING_PAYMENT),
                    cb.lessThan(root.get("paymentDeadlineAt"), now));
            var stay = cb.and(root.get("status").in(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN),
                    cb.lessThan(root.get("checkOut"), today));
            var followUp = followUpIds.isEmpty() ? cb.disjunction() : root.get("id").in(followUpIds);
            return cb.or(pending, payment, stay, followUp);
        }, org.springframework.data.domain.Sort.by("createdAt").ascending());

        List<AttentionItem> items = new ArrayList<>();
        for (Booking b : candidates) {
            List<AttentionReason> reasons = attentionReasons(b, followUpIds.contains(b.getId()), now);
            if (!reasons.isEmpty()) {
                AttentionReason main = reasons.get(0);
                items.add(new AttentionItem(bookingService.toDtoPublic(b), main, main.label));
            }
        }
        return items;
    }

    @Transactional(readOnly = true)
    public BookingDetailDto detail(Long id) {
        Booking b = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với ID: " + id));
        Set<Long> followUpIds = Set.copyOf(noteRepository.findBookingIdsNeedingFollowUp());

        List<HistoryDto> history = historyRepository.findByBookingIdOrderByCreatedAtAscIdAsc(id).stream()
                .map(h -> new HistoryDto(h.getFromStatus(), h.getToStatus(),
                        h.getActor() != null ? h.getActor().name() : null, h.getActorId(), h.getReason(), h.getCreatedAt()))
                .toList();
        List<ServiceItemDto> services = b.getServiceItems().stream()
                .map(s -> new ServiceItemDto(s.getServiceName(), s.getServiceCode(), s.getNote(), s.getIsIncluded()))
                .toList();
        List<PaymentDto> payments = paymentRepository.findByBookingIdWithGateway(id).stream()
                .map(p -> new PaymentDto(p.getId(), p.getGateway().getName(), p.getExternalTxnId(), p.getAmount(),
                        p.getCurrency(), p.getStatus().name(), p.getInitiatedAt(), p.getPaidAt()))
                .toList();
        List<NoteDto> notes = noteRepository.findByBookingIdOrderByCreatedAtDescIdDesc(id).stream()
                .map(this::toNoteDto).toList();

        return new BookingDetailDto(bookingService.toDtoPublic(b), b.getHoldExpiresAt(), b.getPaymentDeadlineAt(),
                b.getClosedByActor() != null ? b.getClosedByActor().name() : null, history, services, payments, notes,
                attentionReasons(b, followUpIds.contains(id), LocalDateTime.now()));
    }

    /** Ghi nhận thông tin xác minh (FR-AD-09) hoặc kết quả giám sát (FR-AD-10). */
    @Transactional
    public NoteDto addNote(Long bookingId, BookingNoteKind kind, BookingNoteOutcome outcome, String content,
                           Long adminAccountId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với ID: " + bookingId));
        if (kind == null) throw new IllegalArgumentException("Vui lòng chọn loại ghi nhận.");
        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) throw new IllegalArgumentException("Nội dung ghi nhận không được để trống.");
        if (text.length() > MAX_NOTE_LENGTH) {
            throw new IllegalArgumentException("Nội dung tối đa " + MAX_NOTE_LENGTH + " ký tự.");
        }
        if (kind == BookingNoteKind.OUTCOME && outcome == null) {
            throw new IllegalArgumentException("Vui lòng chọn hướng xử lý khi ghi nhận kết quả.");
        }
        if (kind == BookingNoteKind.VERIFICATION) {
            outcome = null;
        }

        String adminName = adminAccountId == null ? null
                : accountRepository.findById(adminAccountId).map(a -> a.getFullName()).orElse(null);
        BookingAdminNote saved = noteRepository.save(BookingAdminNote.builder()
                .booking(booking).adminAccountId(adminAccountId).adminName(adminName)
                .kind(kind).outcome(outcome).content(text).build());

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("bookingCode", booking.getBookingCode());
        after.put("kind", kind.name());
        if (outcome != null) after.put("outcome", outcome.name());
        auditLogService.record(adminAccountId,
                kind == BookingNoteKind.OUTCOME ? "BOOKING_MONITOR_OUTCOME" : "BOOKING_MONITOR_VERIFICATION",
                "Booking", booking.getId(), text, null, after);
        return toNoteDto(saved);
    }

    private NoteDto toNoteDto(BookingAdminNote n) {
        return new NoteDto(n.getId(), n.getKind(), n.getOutcome(), n.getContent(), n.getAdminName(), n.getCreatedAt());
    }
}

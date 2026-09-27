package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminReviewDtos.ModerationAction;
import com.dulichso.bookingapi.dto.admin.AdminReviewDtos.ReviewDto;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Review;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ReviewRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * FR-AD-15: Admin kiểm tra đánh giá và giữ nguyên / ẩn / gỡ đánh giá vi phạm, ghi nhận lý do và kết quả xử lý.
 * Đánh giá không còn VISIBLE thì không hiển thị công khai và không được tính vào điểm trung bình của Homestay.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReviewService {
    private final ReviewRepository reviews;
    private final AccountRepository accounts;
    private final AuditLogService auditLogService;
    private final NotificationRecorder notifications;

    public Page<ReviewDto> search(ReviewStatus status, Long placeId, Long providerId, Integer rating, String keyword,
                                  LocalDate from, LocalDate to, int page, int size) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ: ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        if (rating != null && (rating < 1 || rating > 5)) throw new IllegalArgumentException("Số sao phải từ 1 đến 5.");
        String kw = keyword == null || keyword.isBlank() ? null : keyword.trim().toLowerCase(Locale.ROOT);
        Specification<Review> spec = (root, query, cb) -> {
            boolean dataQuery = query != null && query.getResultType() != Long.class && query.getResultType() != long.class;
            Join<Object, Object> place;
            Join<Object, Object> booking;
            if (dataQuery) {
                place = cast(root.fetch("place"));
                booking = cast(root.fetch("booking", JoinType.LEFT));
                place.fetch("provider");
            } else {
                place = root.join("place");
                booking = root.join("booking", JoinType.LEFT);
            }
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (placeId != null) ps.add(cb.equal(place.get("id"), placeId));
            if (providerId != null) ps.add(cb.equal(place.get("provider").get("id"), providerId));
            if (rating != null) ps.add(cb.equal(root.get("rating"), rating.byteValue()));
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            if (to != null) ps.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (kw != null) {
                String like = "%" + kw.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("content")), like, '\\'),
                        cb.like(cb.lower(place.get("name")), like, '\\'),
                        cb.like(cb.lower(booking.get("guestName")), like, '\\'),
                        cb.like(cb.lower(booking.get("bookingCode")), like, '\\')));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<Review> result = reviews.findAll(spec, pageable);
        Map<Long, String> moderators = moderatorNames(result.getContent());
        return result.map(r -> toDto(r, moderators));
    }

    @SuppressWarnings("unchecked")
    private static Join<Object, Object> cast(jakarta.persistence.criteria.Fetch<?, ?> fetch) {
        return (Join<Object, Object>) fetch;
    }

    public ReviewDto detail(Long id) {
        Review review = reviews.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá với ID: " + id));
        return toDto(review, moderatorNames(List.of(review)));
    }

    /**
     * Quy tắc chuyển trạng thái: VISIBLE → ẩn/gỡ; HIDDEN → khôi phục/gỡ; REMOVED không đổi được nữa.
     * KEEP không đổi trạng thái, chỉ ghi nhận đã xem xét. Ẩn và gỡ bắt buộc có lý do.
     */
    @Transactional
    public ReviewDto moderate(Long id, Long adminAccountId, ModerationAction action, String reason) {
        if (action == null) throw new IllegalArgumentException("Vui lòng chọn cách xử lý.");
        String cleanReason = reason == null || reason.isBlank() ? null : reason.trim();
        if ((action == ModerationAction.HIDE || action == ModerationAction.REMOVE) && cleanReason == null) {
            throw new IllegalArgumentException("Vui lòng nhập lý do khi ẩn hoặc gỡ đánh giá.");
        }
        if (adminAccountId == null) throw new IllegalStateException("Không xác định được tài khoản quản trị đang thao tác.");
        Review review = reviews.findByIdForUpdate(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá với ID: " + id));
        ReviewStatus old = review.getStatus();
        if (old == ReviewStatus.REMOVED) {
            throw new IllegalStateException("Đánh giá đã bị gỡ, không thể xử lý lại.");
        }
        ReviewStatus target = switch (action) {
            case KEEP -> old;
            case HIDE -> {
                if (old != ReviewStatus.VISIBLE) throw new IllegalStateException("Đánh giá không ở trạng thái hiển thị để ẩn.");
                yield ReviewStatus.HIDDEN;
            }
            case REMOVE -> ReviewStatus.REMOVED;
            case RESTORE -> {
                if (old != ReviewStatus.HIDDEN) throw new IllegalStateException("Chỉ khôi phục được đánh giá đang bị ẩn.");
                yield ReviewStatus.VISIBLE;
            }
        };
        review.setStatus(target);
        review.setModeratedBy(adminAccountId);
        review.setModeratedAt(LocalDateTime.now());
        review.setModerationReason(cleanReason);
        if (old != target) refreshPlaceRating(review.getPlace());
        // REV-BR-17: chỉ báo khách khi GỠ (xóa) đánh giá đã đăng — Ẩn không bắt buộc báo theo tài liệu.
        if (action == ModerationAction.REMOVE) notifyCustomerRemoved(review, cleanReason);

        auditLogService.record(adminAccountId, "REVIEW_" + switch (action) {
                    case KEEP -> "KEPT";
                    case HIDE -> "HIDDEN";
                    case REMOVE -> "REMOVED";
                    case RESTORE -> "RESTORED";
                }, "Review", id, cleanReason,
                Map.of("status", old.name()), Map.of("status", target.name(), "placeId", review.getPlace().getId()));
        return toDto(review, moderatorNames(List.of(review)));
    }

    /** REV-BR-17: báo cho khách hàng khi đánh giá của họ bị Admin gỡ, kèm lý do. */
    private void notifyCustomerRemoved(Review review, String reason) {
        var booking = review.getBooking();
        if (booking == null) return;
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("homestay_name", review.getPlace().getName());
        payload.put("homestayName", review.getPlace().getName());
        payload.put("reason", reason == null ? "" : reason);
        payload.put("isRead", false);
        payload.put("title", "Đánh giá của bạn đã bị gỡ");
        payload.put("message", reason == null ? "" : reason);
        notifications.toCustomer("REVIEW_REMOVED_CUSTOMER", booking.getGuestPhone(), booking.getGuestEmail(),
                "review", review.getId(), payload);
    }

    /** Điểm trung bình và số đánh giá của Homestay chỉ tính các đánh giá đang hiển thị công khai. */
    private void refreshPlaceRating(Place place) {
        List<Object[]> stats = reviews.visibleRatingStats(place.getId(), ReviewStatus.VISIBLE);
        long count = 0;
        BigDecimal avg = BigDecimal.ZERO;
        if (!stats.isEmpty() && stats.get(0)[0] != null) {
            count = ((Number) stats.get(0)[0]).longValue();
            if (count > 0 && stats.get(0)[1] != null) {
                avg = BigDecimal.valueOf(((Number) stats.get(0)[1]).doubleValue()).setScale(2, RoundingMode.HALF_UP);
            }
        }
        place.setRatingCount((int) count);
        place.setRatingAvg(avg);
    }

    private Map<Long, String> moderatorNames(List<Review> list) {
        Set<Long> ids = list.stream().map(Review::getModeratedBy).filter(Objects::nonNull).collect(Collectors.toSet());
        if (ids.isEmpty()) return Map.of();
        return accounts.findAllById(ids).stream().collect(Collectors.toMap(Account::getId,
                a -> a.getFullName() == null ? "Quản trị viên" : a.getFullName(), (x, y) -> x));
    }

    private ReviewDto toDto(Review r, Map<Long, String> moderators) {
        Place place = r.getPlace();
        var booking = r.getBooking();
        return new ReviewDto(r.getId(), place.getId(), place.getName(),
                place.getProvider() == null ? null : place.getProvider().getId(),
                place.getProvider() == null ? null : place.getProvider().getName(),
                booking == null ? null : booking.getId(), booking == null ? null : booking.getBookingCode(),
                booking == null ? "Khách du lịch" : booking.getGuestName(), r.getRating() == null ? 0 : r.getRating(),
                r.getContent(), r.getImages(), r.getStatus(), r.getCreatedAt(), r.getProviderReply(), r.getProviderReplyAt(),
                r.getModeratedBy() == null ? null : moderators.get(r.getModeratedBy()), r.getModeratedAt(), r.getModerationReason());
    }
}

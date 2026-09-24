package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.repository.BookingRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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

/** Admin xem toàn bộ đơn đặt phòng kèm thông tin khách. Chỉ đọc. */
@Service
public class AdminBookingService {

    private static final Set<String> SORT_FIELDS = Set.of("createdAt", "checkIn", "totalAmount");

    private final BookingRepository bookingRepository;

    public AdminBookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public record BookingDto(Long id, String bookingCode,
                             Long placeId, String placeName, String roomTypeName,
                             Long providerId, String providerName,
                             LocalDate checkIn, LocalDate checkOut, Integer nights, Integer roomCount, Integer guestCount,
                             String guestName, String guestPhone, String guestEmail, String guestNote,
                             BookingStatus status, BigDecimal totalAmount, String currency,
                             LocalDateTime createdAt, LocalDateTime confirmedAt, LocalDateTime closedAt, String closeReason) {}

    @Transactional(readOnly = true)
    public Page<BookingDto> search(BookingStatus status, String keyword, Long providerId,
                                   LocalDate checkInFrom, LocalDate checkInTo,
                                   LocalDate createdFrom, LocalDate createdTo,
                                   String sortBy, String sortDir, int page, int size) {
        return search(status, keyword, null, null, null, providerId, checkInFrom, checkInTo,
                createdFrom, createdTo, sortBy, sortDir, page, size);
    }

    /**
     * @param guest   lọc theo khách hàng: tên, SĐT hoặc email
     * @param place   lọc theo tên homestay/điểm đến
     * @param placeId lọc chính xác theo homestay (dùng khi drill-down từ báo cáo)
     */
    @Transactional(readOnly = true)
    public Page<BookingDto> search(BookingStatus status, String keyword, String guest, String place, Long placeId,
                                   Long providerId, LocalDate checkInFrom, LocalDate checkInTo,
                                   LocalDate createdFrom, LocalDate createdTo,
                                   String sortBy, String sortDir, int page, int size) {
        String guestKw = guest != null && !guest.isBlank() ? guest.trim().toLowerCase() : null;
        String placeKw = place != null && !place.isBlank() ? place.trim().toLowerCase() : null;
        String kw = keyword != null && !keyword.isBlank() ? keyword.trim().toLowerCase() : null;
        Sort sort = Sort.by("asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC,
                SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt");

        Specification<Booking> spec = (root, query, cb) -> {
            boolean isCount = query != null && (query.getResultType() == Long.class || query.getResultType() == long.class);
            Join<Object, Object> placeJoin;
            Join<Object, Object> provider;
            if (isCount) {
                placeJoin = root.join("place", JoinType.INNER);
                provider = root.join("provider", JoinType.INNER);
            } else {
                placeJoin = castJoin(root.fetch("place", JoinType.INNER));
                provider = castJoin(root.fetch("provider", JoinType.INNER));
                root.fetch("roomType", JoinType.INNER);
            }

            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (providerId != null) ps.add(cb.equal(provider.get("id"), providerId));
            if (placeId != null) ps.add(cb.equal(placeJoin.get("id"), placeId));
            if (placeKw != null) {
                ps.add(cb.like(cb.lower(placeJoin.get("name")), "%" + escapeLike(placeKw) + "%"));
            }
            if (guestKw != null) {
                String gl = "%" + escapeLike(guestKw) + "%";
                ps.add(cb.or(cb.like(cb.lower(root.get("guestName")), gl),
                        cb.like(cb.lower(root.get("guestEmail")), gl),
                        cb.like(root.get("guestPhone"), gl)));
            }
            if (checkInFrom != null) ps.add(cb.greaterThanOrEqualTo(root.get("checkIn"), checkInFrom));
            if (checkInTo != null) ps.add(cb.lessThanOrEqualTo(root.get("checkIn"), checkInTo));
            if (createdFrom != null) ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom.atStartOfDay()));
            if (createdTo != null) ps.add(cb.lessThan(root.get("createdAt"), createdTo.plusDays(1).atStartOfDay()));
            if (kw != null) {
                String like = "%" + escapeLike(kw) + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("bookingCode")), like),
                        cb.like(cb.lower(root.get("guestName")), like),
                        cb.like(cb.lower(root.get("guestEmail")), like),
                        cb.like(root.get("guestPhone"), like),
                        cb.like(cb.lower(placeJoin.get("name")), like),
                        cb.like(cb.lower(provider.get("name")), like)));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };

        return bookingRepository.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort))
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus() {
        return countByStatus(null);
    }

    /** @param providerId null = toàn hệ thống; có giá trị = chỉ đơn của nhà cung cấp đó */
    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(Long providerId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (BookingStatus s : BookingStatus.values()) {
            counts.put(s.name(), bookingRepository.count((root, query, cb) -> providerId == null
                    ? cb.equal(root.get("status"), s)
                    : cb.and(cb.equal(root.get("status"), s), cb.equal(root.get("provider").get("id"), providerId))));
        }
        return counts;
    }

    @SuppressWarnings("unchecked")
    private static Join<Object, Object> castJoin(jakarta.persistence.criteria.Fetch<?, ?> fetch) {
        return (Join<Object, Object>) fetch;
    }

    private static String escapeLike(String v) {
        return v.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    /** Dùng cho các service giám sát để tái sử dụng cách map DTO. Cần gọi trong transaction. */
    public BookingDto toDtoPublic(Booking b) {
        return toDto(b);
    }

    private BookingDto toDto(Booking b) {
        return new BookingDto(b.getId(), b.getBookingCode(),
                b.getPlace().getId(), b.getPlace().getName(), b.getRoomType().getName(),
                b.getProvider().getId(), b.getProvider().getName(),
                b.getCheckIn(), b.getCheckOut(), b.getNights(), b.getRoomCount(), b.getGuestCount(),
                b.getGuestName(), b.getGuestPhone(), b.getGuestEmail(), b.getGuestNote(),
                b.getStatus(), b.getTotalAmount(), b.getCurrency(),
                b.getCreatedAt(), b.getConfirmedAt(), b.getClosedAt(), b.getCloseReason());
    }
}

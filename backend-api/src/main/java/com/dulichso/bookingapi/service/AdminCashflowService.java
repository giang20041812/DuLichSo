package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowLevel;
import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowReportDto;
import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowRowDto;
import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowTotalsDto;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import com.dulichso.bookingapi.repository.PaymentTransactionRepository;
import com.dulichso.bookingapi.repository.RefundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Dòng tiền theo NCC và Homestay từ lịch sử thanh toán/hoàn tiền của toàn hệ thống.
 * Tổng hợp nằm ở DB (GROUP BY theo Homestay); số dòng trả về bị giới hạn bởi số Homestay nên lọc/sắp xếp/phân trang thực hiện trên tập đã gộp.
 * Số liệu là dòng tiền thực thu/thực hoàn: thu theo ngày thanh toán thành công, hoàn theo ngày xử lý.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCashflowService {
    static final long MAX_RANGE_DAYS = 3 * 366L;
    static final Set<String> SORT_FIELDS = Set.of("net", "paid", "refunded", "pending", "bookings", "name");

    private final PaymentTransactionRepository payments;
    private final RefundRepository refunds;

    /** Bộ cộng dồn cho một Homestay. */
    private static final class Acc {
        Long placeId;
        String placeName;
        Long providerId;
        String providerName;
        long paidBookings;
        BigDecimal paid = BigDecimal.ZERO;
        BigDecimal refunded = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;
    }

    public CashflowReportDto report(LocalDate from, LocalDate to, CashflowLevel level, Long providerId, String keyword,
                                    String sortBy, String sortDir, int page, int size) {
        LocalDate today = LocalDate.now();
        LocalDate end = to != null ? to : today;
        LocalDate start = from != null ? from : today.withDayOfMonth(1);
        if (start.isAfter(end)) throw new IllegalArgumentException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
        if (ChronoUnit.DAYS.between(start, end) > MAX_RANGE_DAYS) throw new IllegalArgumentException("Khoảng thời gian tối đa 3 năm.");
        CashflowLevel effectiveLevel = level == null ? CashflowLevel.PROVIDER : level;
        LocalDateTime fromTs = start.atStartOfDay();
        LocalDateTime toTs = end.plusDays(1).atStartOfDay();

        Map<Long, Acc> byPlace = new LinkedHashMap<>();
        for (Object[] r : payments.sumPaidByPlace(PaymentStatus.SUCCESS, fromTs, toTs, providerId)) {
            Acc a = acc(byPlace, r);
            a.paidBookings = ((Number) r[4]).longValue();
            a.paid = money(r[5]);
        }

        List<CashflowRowDto> rows = effectiveLevel == CashflowLevel.PLACE ? placeRows(byPlace) : providerRows(byPlace);
        String kw = keyword == null || keyword.isBlank() ? null : keyword.trim().toLowerCase(Locale.ROOT);
        if (kw != null) {
            rows = rows.stream().filter(r -> r.name().toLowerCase(Locale.ROOT).contains(kw)
                    || (r.providerName() != null && r.providerName().toLowerCase(Locale.ROOT).contains(kw))).toList();
        }
        // Tổng phản ánh đúng tập đã lọc, không phụ thuộc trang đang xem.
        CashflowTotalsDto totals = totals(rows);

        Comparator<CashflowRowDto> comparator = comparator(sortBy != null && SORT_FIELDS.contains(sortBy) ? sortBy : "net");
        if (!"asc".equalsIgnoreCase(sortDir)) comparator = comparator.reversed();
        List<CashflowRowDto> sorted = new ArrayList<>(rows);
        sorted.sort(comparator.thenComparing(CashflowRowDto::name).thenComparing(CashflowRowDto::id));

        int pageSize = Math.min(Math.max(size, 1), 100);
        int pageIndex = Math.max(page, 0);
        int fromIndex = (int) Math.min((long) pageIndex * pageSize, sorted.size());
        int toIndex = Math.min(fromIndex + pageSize, sorted.size());
        Page<CashflowRowDto> paged = new PageImpl<>(sorted.subList(fromIndex, toIndex), PageRequest.of(pageIndex, pageSize), sorted.size());
        return new CashflowReportDto(start, end, effectiveLevel, totals, paged);
    }

    private static Acc acc(Map<Long, Acc> byPlace, Object[] r) {
        Long placeId = (Long) r[0];
        return byPlace.computeIfAbsent(placeId, id -> {
            Acc a = new Acc();
            a.placeId = id;
            a.placeName = (String) r[1];
            a.providerId = (Long) r[2];
            a.providerName = (String) r[3];
            return a;
        });
    }

    private static BigDecimal money(Object value) {
        if (value instanceof BigDecimal decimal) return decimal;
        return value instanceof Number number ? BigDecimal.valueOf(number.doubleValue()) : BigDecimal.ZERO;
    }

    private static List<CashflowRowDto> placeRows(Map<Long, Acc> byPlace) {
        return byPlace.values().stream().map(a -> new CashflowRowDto(a.placeId, a.placeName, a.providerId, a.providerName,
                a.paidBookings, a.paid, a.paid)).toList();
    }

    /** Gộp các Homestay theo NCC sở hữu. */
    private static List<CashflowRowDto> providerRows(Map<Long, Acc> byPlace) {
        Map<Long, Acc> byProvider = new LinkedHashMap<>();
        for (Acc a : byPlace.values()) {
            Acc p = byProvider.computeIfAbsent(a.providerId, id -> {
                Acc n = new Acc();
                n.providerId = id;
                n.providerName = a.providerName;
                return n;
            });
            p.paidBookings += a.paidBookings;
            p.paid = p.paid.add(a.paid);
        }
        return byProvider.values().stream().map(a -> new CashflowRowDto(a.providerId, a.providerName, a.providerId, a.providerName,
                a.paidBookings, a.paid, a.paid)).toList();
    }

    private static CashflowTotalsDto totals(List<CashflowRowDto> rows) {
        long bookings = 0;
        BigDecimal paid = BigDecimal.ZERO;
        for (CashflowRowDto r : rows) {
            bookings += r.paidBookings();
            paid = paid.add(r.paidAmount());
        }
        return new CashflowTotalsDto(bookings, paid, paid);
    }

    private static Comparator<CashflowRowDto> comparator(String sortBy) {
        return switch (sortBy) {
            case "paid" -> Comparator.comparing(CashflowRowDto::paidAmount);
            case "bookings" -> Comparator.comparingLong(CashflowRowDto::paidBookings);
            case "name" -> Comparator.comparing(CashflowRowDto::name, String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(CashflowRowDto::netAmount);
        };
    }
}

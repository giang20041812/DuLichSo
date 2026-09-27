package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.PaymentTransactionRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Báo cáo & thống kê tổng quan cho Admin (FR-AD-11..14).
 * Tổng hợp theo điều kiện Admin chọn: khoảng thời gian (ngày tạo Booking), NCC, nhóm trạng thái.
 * Mỗi phần tử top có id để giao diện mở danh sách Booking chi tiết (drill-down).
 */
@Service
public class AdminReportService {

    static final Set<BookingStatus> REVENUE_STATUSES = Set.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN,
            BookingStatus.CHECKED_OUT, BookingStatus.COMPLETED);
    static final Set<BookingStatus> OPEN_STATUSES = Set.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT);
    static final Set<BookingStatus> LOST_STATUSES =
            Set.of(BookingStatus.REJECTED, BookingStatus.CANCELLED, BookingStatus.EXPIRED, BookingStatus.NO_SHOW,
                    BookingStatus.REFUNDED);
    static final int MAX_RANGE_DAYS = 366 * 3;
    static final int DAILY_MAX_DAYS = 62;
    static final int TOP_LIMIT = 5;

    public record Kpi(long totalBookings, long confirmedBookings, long openBookings, long lostBookings,
                      BigDecimal bookingValue, BigDecimal averageValue, BigDecimal paidRevenue,
                      double confirmationRate, Long newProviders, Long newPlaces) {}

    public record StatusCount(BookingStatus status, long count) {}

    public record SeriesPoint(String key, String label, LocalDate from, LocalDate to, long bookings, BigDecimal value) {}

    public record TopProvider(Long id, String name, long bookings, BigDecimal value) {}

    public record TopPlace(Long id, String name, Long providerId, String providerName, long bookings, BigDecimal value) {}

    public record OverviewReport(LocalDate from, LocalDate to, Long providerId, String granularity, Kpi kpi,
                                 List<StatusCount> byStatus, List<SeriesPoint> series,
                                 List<TopProvider> topProviders, List<TopPlace> topPlaces) {}

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final ProviderRepository providerRepository;
    private final PlaceRepository placeRepository;

    public AdminReportService(BookingRepository bookingRepository, PaymentTransactionRepository paymentRepository,
                              ProviderRepository providerRepository, PlaceRepository placeRepository) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.providerRepository = providerRepository;
        this.placeRepository = placeRepository;
    }

    /**
     * @param from       ngày bắt đầu (mặc định: đầu tháng cách đây 5 tháng)
     * @param to         ngày kết thúc, tính cả ngày này (mặc định: hôm nay)
     * @param providerId lọc theo NCC (null = toàn hệ thống)
     * @param group      nhóm trạng thái: ALL | CONFIRMED | OPEN | LOST — chỉ áp dụng cho chuỗi, top và KPI đơn
     */
    @Transactional(readOnly = true)
    public OverviewReport overview(LocalDate from, LocalDate to, Long providerId, String group) {
        LocalDate today = LocalDate.now();
        LocalDate end = to != null ? to : today;
        LocalDate start = from != null ? from : today.withDayOfMonth(1).minusMonths(5);
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
        }
        if (ChronoUnit.DAYS.between(start, end) > MAX_RANGE_DAYS) {
            throw new IllegalArgumentException("Khoảng thời gian báo cáo tối đa 3 năm.");
        }
        Set<BookingStatus> filter = switch (group == null ? "ALL" : group.toUpperCase()) {
            case "ALL" -> null;
            case "CONFIRMED" -> REVENUE_STATUSES;
            case "OPEN" -> OPEN_STATUSES;
            case "LOST" -> LOST_STATUSES;
            default -> throw new IllegalArgumentException("Nhóm trạng thái không hợp lệ: " + group);
        };

        LocalDateTime fromTs = start.atStartOfDay();
        LocalDateTime toTs = end.plusDays(1).atStartOfDay();
        List<Object[]> all = bookingRepository.findReportRows(fromTs, toTs, providerId);

        boolean daily = ChronoUnit.DAYS.between(start, end) <= DAILY_MAX_DAYS;
        Map<BookingStatus, Long> statusCounts = new EnumMap<>(BookingStatus.class);
        for (BookingStatus s : BookingStatus.values()) statusCounts.put(s, 0L);
        Map<String, long[]> bucketCount = new TreeMap<>();
        Map<String, BigDecimal> bucketValue = new HashMap<>();
        Map<Long, String> providerNames = new HashMap<>();
        Map<Long, long[]> providerCount = new LinkedHashMap<>();
        Map<Long, BigDecimal> providerValue = new HashMap<>();
        Map<Long, Object[]> placeMeta = new HashMap<>();
        Map<Long, long[]> placeCount = new LinkedHashMap<>();
        Map<Long, BigDecimal> placeValue = new HashMap<>();

        long total = 0, confirmed = 0, open = 0, lost = 0;
        BigDecimal value = BigDecimal.ZERO;

        for (Object[] r : all) {
            BookingStatus status = (BookingStatus) r[1];
            statusCounts.merge(status, 1L, Long::sum); // biểu đồ trạng thái luôn hiển thị đủ để đối chiếu
            if (filter != null && !filter.contains(status)) continue;

            LocalDateTime created = (LocalDateTime) r[0];
            BigDecimal amount = r[2] != null ? (BigDecimal) r[2] : BigDecimal.ZERO;
            boolean earns = REVENUE_STATUSES.contains(status);
            Long pid = (Long) r[3];
            Long plid = (Long) r[5];

            total++;
            if (earns) { confirmed++; value = value.add(amount); }
            else if (OPEN_STATUSES.contains(status)) open++;
            else if (LOST_STATUSES.contains(status)) lost++;

            String key = daily ? created.toLocalDate().toString() : YearMonth.from(created).toString();
            bucketCount.computeIfAbsent(key, k -> new long[1])[0]++;
            if (earns) bucketValue.merge(key, amount, BigDecimal::add);

            providerNames.putIfAbsent(pid, (String) r[4]);
            providerCount.computeIfAbsent(pid, k -> new long[1])[0]++;
            if (earns) providerValue.merge(pid, amount, BigDecimal::add);

            placeMeta.putIfAbsent(plid, new Object[]{r[6], pid});
            placeCount.computeIfAbsent(plid, k -> new long[1])[0]++;
            if (earns) placeValue.merge(plid, amount, BigDecimal::add);
        }

        BigDecimal avg = confirmed == 0 ? BigDecimal.ZERO : value.divide(BigDecimal.valueOf(confirmed), 0, RoundingMode.HALF_UP);
        BigDecimal paid = paymentRepository.sumPaidInRange(PaymentStatus.SUCCESS, fromTs, toTs, providerId);
        double rate = total == 0 ? 0 : Math.round(confirmed * 1000.0 / total) / 10.0;
        Long newProviders = providerId != null ? null
                : providerRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(fromTs, toTs);
        Long newPlaces = providerId != null ? null
                : placeRepository.countByIsDeletedFalseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(fromTs, toTs);

        List<SeriesPoint> series = buildSeries(start, end, daily, bucketCount, bucketValue);

        List<TopProvider> topProviders = providerCount.entrySet().stream()
                .map(e -> new TopProvider(e.getKey(), providerNames.get(e.getKey()), e.getValue()[0],
                        providerValue.getOrDefault(e.getKey(), BigDecimal.ZERO)))
                .sorted(Comparator.comparing(TopProvider::value).reversed().thenComparing(Comparator.comparingLong(TopProvider::bookings).reversed()))
                .limit(TOP_LIMIT).toList();
        List<TopPlace> topPlaces = placeCount.entrySet().stream()
                .map(e -> {
                    Object[] meta = placeMeta.get(e.getKey());
                    Long pid = (Long) meta[1];
                    return new TopPlace(e.getKey(), (String) meta[0], pid, providerNames.get(pid), e.getValue()[0],
                            placeValue.getOrDefault(e.getKey(), BigDecimal.ZERO));
                })
                .sorted(Comparator.comparing(TopPlace::value).reversed().thenComparing(Comparator.comparingLong(TopPlace::bookings).reversed()))
                .limit(TOP_LIMIT).toList();

        List<StatusCount> byStatus = new ArrayList<>();
        statusCounts.forEach((s, c) -> byStatus.add(new StatusCount(s, c)));

        return new OverviewReport(start, end, providerId, daily ? "DAY" : "MONTH",
                new Kpi(total, confirmed, open, lost, value, avg, paid, rate, newProviders, newPlaces),
                byStatus, series, topProviders, topPlaces);
    }

    /** Sinh đủ mọi mốc thời gian trong khoảng (kể cả mốc không có đơn) để biểu đồ liên tục. */
    private static List<SeriesPoint> buildSeries(LocalDate start, LocalDate end, boolean daily,
                                                 Map<String, long[]> counts, Map<String, BigDecimal> values) {
        List<SeriesPoint> out = new ArrayList<>();
        if (daily) {
            for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
                String key = d.toString();
                out.add(new SeriesPoint(key, d.getDayOfMonth() + "/" + d.getMonthValue(), d, d,
                        counts.getOrDefault(key, new long[1])[0], values.getOrDefault(key, BigDecimal.ZERO)));
            }
        } else {
            for (YearMonth m = YearMonth.from(start); !m.isAfter(YearMonth.from(end)); m = m.plusMonths(1)) {
                String key = m.toString();
                LocalDate mFrom = m.atDay(1).isBefore(start) ? start : m.atDay(1);
                LocalDate mTo = m.atEndOfMonth().isAfter(end) ? end : m.atEndOfMonth();
                out.add(new SeriesPoint(key, "T" + m.getMonthValue() + "/" + m.getYear(), mFrom, mTo,
                        counts.getOrDefault(key, new long[1])[0], values.getOrDefault(key, BigDecimal.ZERO)));
            }
        }
        return out;
    }
}

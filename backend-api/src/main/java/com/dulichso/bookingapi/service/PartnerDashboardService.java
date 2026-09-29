package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerDashboardDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PartnerDashboardService {
    private final PartnerHomestayService homestays;
    private final EntityManager em;

    @Transactional(readOnly = true)
    public PartnerDashboardSummaryDto getDashboardSummary(UserPrincipal principal, Integer year, Integer month, Long homestayId) {
        Account actor = homestays.actor(principal, false);
        Long providerId = actor.getProvider().getId();

        LocalDate now = LocalDate.now();
        int targetYear = year != null ? year : now.getYear();
        int targetMonth = month != null ? month : now.getMonthValue();
        
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
        LocalDateTime startOfMonth = targetDate.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        LocalDateTime endOfMonth = targetDate.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        String placeFilter = homestayId != null ? " AND b.place.id = :placeId " : "";
        String reviewPlaceFilter = homestayId != null ? " AND r.booking.place.id = :placeId " : "";
        String roomPlaceFilter = homestayId != null ? " AND d.roomType.place.id = :placeId " : "";

        // 1. Bookings & Revenue this month
        var q1 = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid" + placeFilter + " AND b.createdAt >= :start AND b.createdAt <= :end", Long.class)
            .setParameter("pid", providerId)
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth);
        if (homestayId != null) q1.setParameter("placeId", homestayId);
        Long monthlyBookingsCount = q1.getSingleResult();
            
        var q2 = em.createQuery(
            "SELECT sum(b.totalAmount) FROM Booking b WHERE b.provider.id = :pid" + placeFilter + " AND b.status IN :statuses AND b.createdAt >= :start AND b.createdAt <= :end", BigDecimal.class)
            .setParameter("pid", providerId)
            .setParameter("statuses", List.of(BookingStatus.COMPLETED, BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED))
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth);
        if (homestayId != null) q2.setParameter("placeId", homestayId);
        BigDecimal monthlyRevenue = q2.getSingleResult();
        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;

        // 2. Ratings and Reviews
        var q3 = em.createQuery(
            "SELECT avg(r.rating) FROM Review r WHERE r.booking.provider.id = :pid" + reviewPlaceFilter, Double.class)
            .setParameter("pid", providerId);
        if (homestayId != null) q3.setParameter("placeId", homestayId);
        Double averageRating = q3.getSingleResult();
        if (averageRating == null) averageRating = 0.0;
        else averageRating = Math.round(averageRating * 10.0) / 10.0;

        var q4 = em.createQuery(
            "SELECT count(r) FROM Review r WHERE r.booking.provider.id = :pid" + reviewPlaceFilter, Long.class)
            .setParameter("pid", providerId);
        if (homestayId != null) q4.setParameter("placeId", homestayId);
        Long totalReviews = q4.getSingleResult();

        // 3. Status totals for the selected month
        var q5 = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid" + placeFilter + " AND b.status IN :statuses AND b.createdAt >= :start AND b.createdAt <= :end", Long.class)
            .setParameter("pid", providerId)
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth)
            .setParameter("statuses", List.of(BookingStatus.COMPLETED, BookingStatus.CHECKED_OUT));
        if (homestayId != null) q5.setParameter("placeId", homestayId);
        Long completedBookings = q5.getSingleResult();

        var q6 = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid" + placeFilter + " AND b.status IN :statuses AND b.createdAt >= :start AND b.createdAt <= :end", Long.class)
            .setParameter("pid", providerId)
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth)
            .setParameter("statuses", List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT));
        if (homestayId != null) q6.setParameter("placeId", homestayId);
        Long pendingBookings = q6.getSingleResult();

        var q7 = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid" + placeFilter + " AND b.status IN :statuses AND b.createdAt >= :start AND b.createdAt <= :end", Long.class)
            .setParameter("pid", providerId)
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth)
            .setParameter("statuses", List.of(BookingStatus.CANCELLED, BookingStatus.EXPIRED, BookingStatus.NO_SHOW));
        if (homestayId != null) q7.setParameter("placeId", homestayId);
        Long cancelledBookings = q7.getSingleResult();

        var q7r = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid" + placeFilter + " AND b.status IN :statuses AND b.createdAt >= :start AND b.createdAt <= :end", Long.class)
            .setParameter("pid", providerId)
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth)
            .setParameter("statuses", List.of(BookingStatus.REJECTED));
        if (homestayId != null) q7r.setParameter("placeId", homestayId);
        Long rejectedBookings = q7r.getSingleResult();

        // 4. Revenue Trend (12 months of the selected year)
        var q8 = em.createQuery(
            "SELECT YEAR(b.createdAt), MONTH(b.createdAt), SUM(b.totalAmount), COUNT(b) " +
            "FROM Booking b " +
            "WHERE b.provider.id = :pid" + placeFilter + " AND b.status NOT IN :excludedStatuses " +
            "AND YEAR(b.createdAt) = :year " +
            "GROUP BY YEAR(b.createdAt), MONTH(b.createdAt)", Object[].class)
            .setParameter("pid", providerId)
            .setParameter("excludedStatuses", List.of(BookingStatus.REJECTED, BookingStatus.CANCELLED, BookingStatus.EXPIRED, BookingStatus.NO_SHOW))
            .setParameter("year", targetYear);
        if (homestayId != null) q8.setParameter("placeId", homestayId);
        List<Object[]> revenueData = q8.getResultList();

        Map<String, Object[]> byKey = new HashMap<>();
        for (Object[] row : revenueData) {
            byKey.put(row[0] + "-" + row[1], row);
        }

        List<MonthlyRevenuePoint> revenueTrend = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            Object[] row = byKey.get(targetYear + "-" + i);
            revenueTrend.add(MonthlyRevenuePoint.builder()
                    .year(targetYear)
                    .month(i)
                    .totalAmount(row != null && row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO)
                    .transactionCount(row != null ? ((Number) row[3]).longValue() : 0)
                    .build());
        }

        // 5. Recent Bookings (top 10)
        var q9 = em.createQuery(
            "SELECT b FROM Booking b JOIN FETCH b.place JOIN FETCH b.roomType WHERE b.provider.id = :pid" + placeFilter + " ORDER BY b.createdAt DESC", Booking.class)
            .setParameter("pid", providerId)
            .setMaxResults(10);
        if (homestayId != null) q9.setParameter("placeId", homestayId);
        List<Booking> recent = q9.getResultList();

        List<RecentBookingDto> recentBookings = recent.stream().map(b -> 
            RecentBookingDto.builder()
                .bookingCode(b.getBookingCode())
                .homestayName(b.getPlace().getName())
                .guestName(b.getGuestName())
                .checkInDate(b.getCheckIn())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus().name())
                .build()
        ).toList();

        // 6. Occupancy Rate (30 days from now)
        int occupancyRate = 0; 
        try {
            var q10 = em.createQuery(
                "SELECT SUM(d.totalRooms) FROM RoomInventoryDay d WHERE d.roomType.place.provider.id = :pid" + roomPlaceFilter + " AND d.id.stayDate >= :start AND d.id.stayDate <= :end", Long.class)
                .setParameter("pid", providerId)
                .setParameter("start", now)
                .setParameter("end", now.plusDays(30));
            if (homestayId != null) q10.setParameter("placeId", homestayId);
            Long totalRooms = q10.getSingleResult();

            var q11 = em.createQuery(
                "SELECT SUM(d.confirmedRooms) FROM RoomInventoryDay d WHERE d.roomType.place.provider.id = :pid" + roomPlaceFilter + " AND d.id.stayDate >= :start AND d.id.stayDate <= :end", Long.class)
                .setParameter("pid", providerId)
                .setParameter("start", now)
                .setParameter("end", now.plusDays(30));
            if (homestayId != null) q11.setParameter("placeId", homestayId);
            Long confirmedRooms = q11.getSingleResult();

            if (totalRooms != null && totalRooms > 0) {
                occupancyRate = (int) Math.round((confirmedRooms != null ? confirmedRooms : 0) * 100.0 / totalRooms);
            }
        } catch (Exception ignored) {}

        // 7. Daily Status Trend (last 7 days)
        LocalDate sevenDaysAgo = now.minusDays(6);
        LocalDateTime startOfTrend = sevenDaysAgo.atStartOfDay();

        var q12 = em.createQuery(
            "SELECT CAST(b.createdAt AS date), b.status, COUNT(b) " +
            "FROM Booking b " +
            "WHERE b.provider.id = :pid" + placeFilter + " AND b.createdAt >= :start " +
            "GROUP BY CAST(b.createdAt AS date), b.status", Object[].class)
            .setParameter("pid", providerId)
            .setParameter("start", startOfTrend);
        if (homestayId != null) q12.setParameter("placeId", homestayId);
        List<Object[]> statusData = q12.getResultList();

        Map<String, Map<BookingStatus, Long>> statusByKey = new HashMap<>();
        for (Object[] row : statusData) {
            String d = row[0].toString();
            BookingStatus st = (BookingStatus) row[1];
            Long cnt = ((Number) row[2]).longValue();
            statusByKey.computeIfAbsent(d, k -> new HashMap<>()).put(st, cnt);
        }

        List<DailyStatusPoint> statusTrend = new ArrayList<>();
        for (int i = 0; i <= 6; i++) {
            LocalDate d = sevenDaysAgo.plusDays(i);
            Map<BookingStatus, Long> map = statusByKey.getOrDefault(d.toString(), new HashMap<>());
            
            long completed = map.getOrDefault(BookingStatus.COMPLETED, 0L) + map.getOrDefault(BookingStatus.CHECKED_OUT, 0L);
            long pending = map.getOrDefault(BookingStatus.PENDING, 0L) + map.getOrDefault(BookingStatus.AWAITING_PAYMENT, 0L);
            long cancelled = map.getOrDefault(BookingStatus.CANCELLED, 0L) + map.getOrDefault(BookingStatus.REJECTED, 0L) + map.getOrDefault(BookingStatus.EXPIRED, 0L) + map.getOrDefault(BookingStatus.NO_SHOW, 0L);
            
            statusTrend.add(DailyStatusPoint.builder()
                .date(d)
                .completed(completed)
                .pending(pending)
                .cancelled(cancelled)
                .build());
        }

        return PartnerDashboardSummaryDto.builder()
                .monthlyRevenue(monthlyRevenue)
                .monthlyBookingsCount(monthlyBookingsCount != null ? monthlyBookingsCount : 0)
                .averageRating(averageRating)
                .totalReviews(totalReviews != null ? totalReviews : 0)
                .occupancyRate(occupancyRate)
                .completedBookings(completedBookings != null ? completedBookings : 0)
                .pendingBookings(pendingBookings != null ? pendingBookings : 0)
                .cancelledBookings(cancelledBookings != null ? cancelledBookings : 0)
                .rejectedBookings(rejectedBookings != null ? rejectedBookings : 0)
                .statusTrend(statusTrend)
                .revenueTrend(revenueTrend)
                .recentBookings(recentBookings)
                .build();
    }
}

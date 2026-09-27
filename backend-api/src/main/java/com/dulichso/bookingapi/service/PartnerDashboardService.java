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
    public PartnerDashboardSummaryDto getDashboardSummary(UserPrincipal principal) {
        Account actor = homestays.actor(principal, false);
        Long providerId = actor.getProvider().getId();

        LocalDate now = LocalDate.now();
        LocalDateTime startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        LocalDateTime endOfMonth = now.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        // 1. Bookings & Revenue this month
        Long monthlyBookingsCount = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid AND b.createdAt >= :start AND b.createdAt <= :end", Long.class)
            .setParameter("pid", providerId)
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth)
            .getSingleResult();
            
        BigDecimal monthlyRevenue = em.createQuery(
            "SELECT sum(b.totalAmount) FROM Booking b WHERE b.provider.id = :pid AND b.status IN :statuses AND b.createdAt >= :start AND b.createdAt <= :end", BigDecimal.class)
            .setParameter("pid", providerId)
            .setParameter("statuses", List.of(BookingStatus.COMPLETED, BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED))
            .setParameter("start", startOfMonth)
            .setParameter("end", endOfMonth)
            .getSingleResult();
        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;

        // 2. Ratings and Reviews
        Double averageRating = em.createQuery(
            "SELECT avg(r.rating) FROM Review r WHERE r.booking.provider.id = :pid", Double.class)
            .setParameter("pid", providerId)
            .getSingleResult();
        if (averageRating == null) averageRating = 0.0;
        else averageRating = Math.round(averageRating * 10.0) / 10.0;

        Long totalReviews = em.createQuery(
            "SELECT count(r) FROM Review r WHERE r.booking.provider.id = :pid", Long.class)
            .setParameter("pid", providerId)
            .getSingleResult();

        // 3. Status totals (YTD or all time)
        Long completedBookings = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid AND b.status IN :statuses", Long.class)
            .setParameter("pid", providerId)
            .setParameter("statuses", List.of(BookingStatus.COMPLETED, BookingStatus.CHECKED_OUT))
            .getSingleResult();

        Long pendingBookings = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid AND b.status IN :statuses", Long.class)
            .setParameter("pid", providerId)
            .setParameter("statuses", List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT))
            .getSingleResult();

        Long cancelledBookings = em.createQuery(
            "SELECT count(b) FROM Booking b WHERE b.provider.id = :pid AND b.status IN :statuses", Long.class)
            .setParameter("pid", providerId)
            .setParameter("statuses", List.of(BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.EXPIRED, BookingStatus.NO_SHOW))
            .getSingleResult();

        // 4. Revenue Trend (12 months)
        List<Object[]> revenueData = em.createQuery(
            "SELECT YEAR(b.createdAt), MONTH(b.createdAt), SUM(b.totalAmount), COUNT(b) " +
            "FROM Booking b " +
            "WHERE b.provider.id = :pid AND b.status NOT IN :excludedStatuses " +
            "GROUP BY YEAR(b.createdAt), MONTH(b.createdAt)", Object[].class)
            .setParameter("pid", providerId)
            .setParameter("excludedStatuses", List.of(BookingStatus.REJECTED, BookingStatus.CANCELLED, BookingStatus.EXPIRED, BookingStatus.NO_SHOW))
            .getResultList();

        Map<String, Object[]> byKey = new HashMap<>();
        for (Object[] row : revenueData) {
            byKey.put(row[0] + "-" + row[1], row);
        }

        List<MonthlyRevenuePoint> revenueTrend = new ArrayList<>();
        java.time.YearMonth thisMonth = java.time.YearMonth.from(now);
        for (int i = 11; i >= 0; i--) {
            java.time.YearMonth ym = thisMonth.minusMonths(i);
            Object[] row = byKey.get(ym.getYear() + "-" + ym.getMonthValue());
            revenueTrend.add(MonthlyRevenuePoint.builder()
                    .year(ym.getYear())
                    .month(ym.getMonthValue())
                    .totalAmount(row != null && row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO)
                    .transactionCount(row != null ? ((Number) row[3]).longValue() : 0)
                    .build());
        }

        // 5. Recent Bookings (top 10)
        List<Booking> recent = em.createQuery(
            "SELECT b FROM Booking b JOIN FETCH b.place JOIN FETCH b.roomType WHERE b.provider.id = :pid ORDER BY b.createdAt DESC", Booking.class)
            .setParameter("pid", providerId)
            .setMaxResults(10)
            .getResultList();

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
            Long totalRooms = em.createQuery(
                "SELECT SUM(d.totalRooms) FROM RoomInventoryDay d WHERE d.roomType.place.provider.id = :pid AND d.id.stayDate >= :start AND d.id.stayDate <= :end", Long.class)
                .setParameter("pid", providerId)
                .setParameter("start", now)
                .setParameter("end", now.plusDays(30))
                .getSingleResult();
            Long confirmedRooms = em.createQuery(
                "SELECT SUM(d.confirmedRooms) FROM RoomInventoryDay d WHERE d.roomType.place.provider.id = :pid AND d.id.stayDate >= :start AND d.id.stayDate <= :end", Long.class)
                .setParameter("pid", providerId)
                .setParameter("start", now)
                .setParameter("end", now.plusDays(30))
                .getSingleResult();
            if (totalRooms != null && totalRooms > 0) {
                occupancyRate = (int) Math.round((confirmedRooms != null ? confirmedRooms : 0) * 100.0 / totalRooms);
            }
        } catch (Exception ignored) {}

        return PartnerDashboardSummaryDto.builder()
                .monthlyRevenue(monthlyRevenue)
                .monthlyBookingsCount(monthlyBookingsCount != null ? monthlyBookingsCount : 0)
                .averageRating(averageRating)
                .totalReviews(totalReviews != null ? totalReviews : 0)
                .occupancyRate(occupancyRate)
                .completedBookings(completedBookings != null ? completedBookings : 0)
                .pendingBookings(pendingBookings != null ? pendingBookings : 0)
                .cancelledBookings(cancelledBookings != null ? cancelledBookings : 0)
                .revenueTrend(revenueTrend)
                .recentBookings(recentBookings)
                .build();
    }
}

package com.dulichso.bookingapi.dto.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class PartnerDashboardDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartnerDashboardSummaryDto {
        private BigDecimal monthlyRevenue;
        private long monthlyBookingsCount;
        private double averageRating;
        private long totalReviews;
        private int occupancyRate; // Tỷ lệ lấp đầy (%)
        
        private long completedBookings;
        private long pendingBookings;
        private long cancelledBookings;

        private List<MonthlyRevenuePoint> revenueTrend;
        private List<RecentBookingDto> recentBookings;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyRevenuePoint {
        private int year;
        private int month;
        private BigDecimal totalAmount;
        private long transactionCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentBookingDto {
        private String bookingCode;
        private String homestayName;
        private String guestName;
        private java.time.LocalDate checkInDate;
        private BigDecimal totalAmount;
        private String status;
    }
}

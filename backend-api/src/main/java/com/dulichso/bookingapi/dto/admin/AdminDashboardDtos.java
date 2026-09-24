package com.dulichso.bookingapi.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public class AdminDashboardDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminDashboardSummaryDto {
        private long totalPlaces;
        private long unverifiedPlaces;

        private long totalProviders;
        private long activeProviders;
        private long suspendedProviders;

        private long totalAccounts;
        private long activeAccounts;

        private long monthlyBookingsCount;
        private BigDecimal monthlyRevenue;

        private long pendingRefundsCount;

        // --- Mở rộng: cần xử lý & khách du lịch ---
        private long terminatedProviders;
        private long needsUpdatePlaces;
        private long pendingSosCount;

        private long totalTravelers;
        private long newTravelers7d;
        private long newTravelers30d;
        private long lockedTravelers;

        /** Doanh thu 6 tháng gần nhất, cũ → mới. */
        private java.util.List<MonthlyRevenuePoint> revenueTrend;
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
}

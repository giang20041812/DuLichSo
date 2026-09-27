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

        /**
         * Giá trị đặt phòng (GMV) 6 tháng gần nhất, cũ → mới — không phụ thuộc đã thanh toán hay chưa.
         * Frontend dùng làm số liệu tạm khi revenueTrend toàn 0đ (chưa có giao dịch đối soát thành công).
         */
        private java.util.List<MonthlyRevenuePoint> gmvTrend;
    }

    /** Một dòng nhật ký hoạt động gần đây cho Live Audit Feed ở Tổng quan. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditLogEntryDto {
        private Long id;
        private String action;
        private String entityType;
        private Long entityId;
        private String reason;
        private String actorName;
        private java.time.LocalDateTime createdAt;
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

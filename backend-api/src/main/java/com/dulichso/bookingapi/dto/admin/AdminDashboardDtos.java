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
    }
}

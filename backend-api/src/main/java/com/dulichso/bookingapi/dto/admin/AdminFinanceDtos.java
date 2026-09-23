package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.CommissionStatus;
import com.dulichso.bookingapi.entity.enums.RefundStatus;
import com.dulichso.bookingapi.entity.enums.RefundType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs cho Admin Finance module.
 * Tất cả type/interface dùng chung chỉ định nghĩa ở đây — không viết lại ở nơi khác.
 */
public class AdminFinanceDtos {

    // ─────────────────────────────────────────────
    // Revenue
    // ─────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonthlyRevenueItem {
        private int year;
        private int month;
        private BigDecimal totalAmount;
        private long transactionCount;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RevenueSummaryDto {
        private BigDecimal grandTotal;
        private long totalTransactions;
        private List<MonthlyRevenueItem> byMonth;
    }

    // ─────────────────────────────────────────────
    // Refund
    // ─────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RefundDto {
        private Long id;
        private Long bookingId;
        private String bookingCode;
        private Long paymentTransactionId;
        private RefundType refundType;
        private BigDecimal amount;
        private String reason;
        private RefundStatus status;
        private LocalDateTime requestedAt;
        private LocalDateTime processedAt;
        private Long processedByAccountId;
        private String processedByName;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ApproveRefundRequest {
        @Size(max = 500)
        private String note;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RejectRefundRequest {
        @NotBlank(message = "Lý do từ chối là bắt buộc")
        @Size(max = 500)
        private String reason;
    }

    // ─────────────────────────────────────────────
    // Commission / Affiliate
    // ─────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AffiliateLinkDto {
        private Long id;
        private Long accountId;
        private String accountName;
        private String code;
        private BigDecimal commissionRate;
        private Boolean isActive;
        private LocalDateTime createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateAffiliateLinkRequest {
        @NotNull(message = "accountId là bắt buộc")
        private Long accountId;

        @NotBlank(message = "Code affiliate là bắt buộc")
        @Size(max = 64)
        private String code;

        @NotNull(message = "Tỷ lệ hoa hồng là bắt buộc")
        @DecimalMin(value = "0.0001", message = "Tỷ lệ hoa hồng phải > 0")
        @DecimalMax(value = "1.0000", message = "Tỷ lệ hoa hồng phải <= 100%")
        private BigDecimal commissionRate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CommissionLedgerDto {
        private Long id;
        private Long affiliateLinkId;
        private String affiliateCode;
        private Long affiliateAccountId;
        private String affiliateAccountName;
        private Long bookingId;
        private String bookingCode;
        private BigDecimal amount;
        private CommissionStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CommissionSummaryDto {
        private BigDecimal totalPending;
        private BigDecimal totalApproved;
        private BigDecimal totalPaid;
        private BigDecimal totalRejected;
        private List<CommissionLedgerDto> items;
    }
}

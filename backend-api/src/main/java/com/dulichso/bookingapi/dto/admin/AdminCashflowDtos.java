package com.dulichso.bookingapi.dto.admin;

import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Dòng tiền của NCC / Homestay dựa trên lịch sử thanh toán và hoàn tiền toàn hệ thống. */
public final class AdminCashflowDtos {
    private AdminCashflowDtos() {}

    public enum CashflowLevel { PROVIDER, PLACE }

    /**
     * Một dòng: NCC hoặc Homestay. {@code id}/{@code name} là của đối tượng đang nhóm;
     * {@code providerId}/{@code providerName} luôn là NCC sở hữu (để mở chi tiết/lọc booking).
     * netAmount = paidAmount
     */
    public record CashflowRowDto(Long id, String name, Long providerId, String providerName, long paidBookings,
                                 BigDecimal paidAmount, BigDecimal netAmount) {}

    public record CashflowTotalsDto(long paidBookings, BigDecimal paidAmount, BigDecimal netAmount) {}

    public record CashflowReportDto(LocalDate from, LocalDate to, CashflowLevel level, CashflowTotalsDto totals, Page<CashflowRowDto> rows) {}
}

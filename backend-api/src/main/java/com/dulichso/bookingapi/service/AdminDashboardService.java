package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminDashboardDtos.AdminDashboardSummaryDto;
import com.dulichso.bookingapi.dto.admin.AdminFinanceDtos.MonthlyRevenueItem;
import com.dulichso.bookingapi.dto.admin.AdminFinanceDtos.RevenueSummaryDto;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.entity.enums.RefundStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import com.dulichso.bookingapi.repository.RefundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class AdminDashboardService {

    private final PlaceRepository placeRepository;
    private final ProviderRepository providerRepository;
    private final AccountRepository accountRepository;
    private final BookingRepository bookingRepository;
    private final RefundRepository refundRepository;
    private final AdminFinanceService adminFinanceService;

    public AdminDashboardService(PlaceRepository placeRepository,
                                 ProviderRepository providerRepository,
                                 AccountRepository accountRepository,
                                 BookingRepository bookingRepository,
                                 RefundRepository refundRepository,
                                 AdminFinanceService adminFinanceService) {
        this.placeRepository = placeRepository;
        this.providerRepository = providerRepository;
        this.accountRepository = accountRepository;
        this.bookingRepository = bookingRepository;
        this.refundRepository = refundRepository;
        this.adminFinanceService = adminFinanceService;
    }

    @Transactional(readOnly = true)
    public AdminDashboardSummaryDto getSummary() {
        // 1. Places
        long totalPlaces = placeRepository.countByIsDeletedFalse();
        long unverifiedPlaces = placeRepository.countByVerificationAndIsDeletedFalse(PlaceVerificationStatus.UNVERIFIED);

        // 2. Providers
        long totalProviders = providerRepository.count();
        long activeProviders = providerRepository.countByStatus(ProviderStatus.ACTIVE);
        long suspendedProviders = providerRepository.countByStatus(ProviderStatus.SUSPENDED);

        // 3. Accounts
        long totalAccounts = accountRepository.count();
        long activeAccounts = accountRepository.countByStatus(AccountStatus.ACTIVE);

        // 4. Monthly Bookings
        LocalDate now = LocalDate.now();
        LocalDateTime startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        LocalDateTime endOfMonth = now.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);
        long monthlyBookingsCount = bookingRepository.countByCreatedAtBetween(startOfMonth, endOfMonth);

        // 5. Monthly Revenue
        BigDecimal monthlyRevenue = BigDecimal.ZERO;
        try {
            RevenueSummaryDto revenueSummary = adminFinanceService.getRevenueSummary();
            List<MonthlyRevenueItem> months = revenueSummary.getByMonth();
            if (months != null) {
                int currentYear = now.getYear();
                int currentMonth = now.getMonthValue();
                for (MonthlyRevenueItem item : months) {
                    if (item.getYear() == currentYear && item.getMonth() == currentMonth) {
                        monthlyRevenue = item.getTotalAmount();
                        break;
                    }
                }
            }
        } catch (Exception ignored) {
        }

        // 6. Pending Refunds
        long pendingRefundsCount = refundRepository.findByStatusOrderByRequestedAtDesc(RefundStatus.PENDING).size();

        return AdminDashboardSummaryDto.builder()
                .totalPlaces(totalPlaces)
                .unverifiedPlaces(unverifiedPlaces)
                .totalProviders(totalProviders)
                .activeProviders(activeProviders)
                .suspendedProviders(suspendedProviders)
                .totalAccounts(totalAccounts)
                .activeAccounts(activeAccounts)
                .monthlyBookingsCount(monthlyBookingsCount)
                .monthlyRevenue(monthlyRevenue)
                .pendingRefundsCount(pendingRefundsCount)
                .build();
    }
}

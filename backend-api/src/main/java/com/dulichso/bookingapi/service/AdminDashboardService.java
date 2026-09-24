package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminDashboardDtos.AdminDashboardSummaryDto;
import com.dulichso.bookingapi.dto.admin.AdminDashboardDtos.MonthlyRevenuePoint;
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
import com.dulichso.bookingapi.repository.SosRequestRepository;
import com.dulichso.bookingapi.repository.TravelerRepository;
import com.dulichso.bookingapi.repository.AuditLogRepository;
import com.dulichso.bookingapi.dto.admin.AdminDashboardDtos.AuditLogEntryDto;
import com.dulichso.bookingapi.entity.AuditLog;
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
    private final TravelerRepository travelerRepository;
    private final SosRequestRepository sosRequestRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminDashboardService(PlaceRepository placeRepository,
                                 ProviderRepository providerRepository,
                                 AccountRepository accountRepository,
                                 BookingRepository bookingRepository,
                                 RefundRepository refundRepository,
                                 AdminFinanceService adminFinanceService,
                                 TravelerRepository travelerRepository,
                                 SosRequestRepository sosRequestRepository,
                                 AuditLogRepository auditLogRepository) {
        this.placeRepository = placeRepository;
        this.providerRepository = providerRepository;
        this.accountRepository = accountRepository;
        this.bookingRepository = bookingRepository;
        this.refundRepository = refundRepository;
        this.adminFinanceService = adminFinanceService;
        this.travelerRepository = travelerRepository;
        this.sosRequestRepository = sosRequestRepository;
        this.auditLogRepository = auditLogRepository;
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
        List<MonthlyRevenuePoint> revenueTrend = new java.util.ArrayList<>();
        try {
            RevenueSummaryDto revenueSummary = adminFinanceService.getRevenueSummary();
            List<MonthlyRevenueItem> months = revenueSummary.getByMonth();
            if (months != null) {
                java.time.YearMonth thisMonth = java.time.YearMonth.from(now);
                for (int i = 5; i >= 0; i--) {
                    java.time.YearMonth ym = thisMonth.minusMonths(i);
                    MonthlyRevenueItem found = months.stream()
                            .filter(m -> m.getYear() == ym.getYear() && m.getMonth() == ym.getMonthValue())
                            .findFirst().orElse(null);
                    revenueTrend.add(MonthlyRevenuePoint.builder()
                            .year(ym.getYear())
                            .month(ym.getMonthValue())
                            .totalAmount(found != null && found.getTotalAmount() != null ? found.getTotalAmount() : BigDecimal.ZERO)
                            .transactionCount(found != null ? found.getTransactionCount() : 0)
                            .build());
                }
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

        // 5b. GMV 6 tháng gần nhất (giá trị đặt phòng, không phụ thuộc đã thanh toán) — dự phòng khi revenueTrend = 0đ
        List<MonthlyRevenuePoint> gmvTrend = new java.util.ArrayList<>();
        {
            java.util.Map<String, Object[]> byKey = new java.util.HashMap<>();
            for (Object[] row : bookingRepository.sumBookingValueByMonth()) {
                byKey.put(row[0] + "-" + row[1], row);
            }
            java.time.YearMonth thisMonth = java.time.YearMonth.from(now);
            for (int i = 5; i >= 0; i--) {
                java.time.YearMonth ym = thisMonth.minusMonths(i);
                Object[] row = byKey.get(ym.getYear() + "-" + ym.getMonthValue());
                gmvTrend.add(MonthlyRevenuePoint.builder()
                        .year(ym.getYear())
                        .month(ym.getMonthValue())
                        .totalAmount(row != null && row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO)
                        .transactionCount(row != null ? ((Number) row[3]).longValue() : 0)
                        .build());
            }
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
                .terminatedProviders(providerRepository.countByStatus(ProviderStatus.TERMINATED))
                .needsUpdatePlaces(placeRepository.countByVerificationAndIsDeletedFalse(PlaceVerificationStatus.NEEDS_UPDATE))
                .pendingSosCount(sosRequestRepository.countByStatus(com.dulichso.bookingapi.entity.enums.SosRequestStatus.PENDING))
                .totalTravelers(travelerRepository.count())
                .newTravelers7d(travelerRepository.countByCreatedAtGreaterThanEqual(LocalDateTime.now().minusDays(7)))
                .newTravelers30d(travelerRepository.countByCreatedAtGreaterThanEqual(LocalDateTime.now().minusDays(30)))
                .lockedTravelers(travelerRepository.countByStatus(AccountStatus.INACTIVE))
                .revenueTrend(revenueTrend)
                .gmvTrend(gmvTrend)
                .build();
    }

    /** Nhật ký hoạt động gần đây cho Live Audit Feed. */
    @Transactional(readOnly = true)
    public List<AuditLogEntryDto> recentActivity(int limit) {
        List<AuditLog> logs = auditLogRepository.findTop20ByOrderByCreatedAtDescIdDesc();
        java.util.Set<Long> actorIds = new java.util.HashSet<>();
        for (AuditLog l : logs) if (l.getActorId() != null) actorIds.add(l.getActorId());
        java.util.Map<Long, String> names = new java.util.HashMap<>();
        if (!actorIds.isEmpty()) {
            for (com.dulichso.bookingapi.entity.Account a : accountRepository.findAllById(actorIds)) {
                names.put(a.getId(), a.getFullName());
            }
        }
        int n = Math.max(1, Math.min(limit, 20));
        List<AuditLogEntryDto> out = new java.util.ArrayList<>();
        for (int i = 0; i < Math.min(n, logs.size()); i++) {
            AuditLog l = logs.get(i);
            out.add(AuditLogEntryDto.builder()
                    .id(l.getId())
                    .action(l.getAction())
                    .entityType(l.getEntityType())
                    .entityId(l.getEntityId())
                    .reason(l.getReason())
                    .actorName(l.getActorId() != null ? names.getOrDefault(l.getActorId(), "Quản trị viên") : "Hệ thống")
                    .createdAt(l.getCreatedAt())
                    .build());
        }
        return out;
    }
}

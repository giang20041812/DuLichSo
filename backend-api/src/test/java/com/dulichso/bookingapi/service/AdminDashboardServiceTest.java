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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private ProviderRepository providerRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private AdminFinanceService adminFinanceService;

    private AdminDashboardService service;

    @BeforeEach
    void setUp() {
        service = new AdminDashboardService(
                placeRepository,
                providerRepository,
                accountRepository,
                bookingRepository,
                refundRepository,
                adminFinanceService
        );
    }

    @Test
    @DisplayName("getSummary: Tổng hợp chính xác số liệu thật toàn hệ thống")
    void getSummary_Success() {
        when(placeRepository.countByIsDeletedFalse()).thenReturn(45L);
        when(placeRepository.countByVerificationAndIsDeletedFalse(PlaceVerificationStatus.UNVERIFIED)).thenReturn(8L);

        when(providerRepository.count()).thenReturn(15L);
        when(providerRepository.countByStatus(ProviderStatus.ACTIVE)).thenReturn(12L);
        when(providerRepository.countByStatus(ProviderStatus.SUSPENDED)).thenReturn(3L);

        when(accountRepository.count()).thenReturn(60L);
        when(accountRepository.countByStatus(AccountStatus.ACTIVE)).thenReturn(55L);

        when(bookingRepository.countByCreatedAtBetween(any(), any())).thenReturn(128L);

        LocalDate now = LocalDate.now();
        RevenueSummaryDto revDto = RevenueSummaryDto.builder()
                .grandTotal(new BigDecimal("150000000"))
                .totalTransactions(300)
                .byMonth(List.of(
                        MonthlyRevenueItem.builder()
                                .year(now.getYear())
                                .month(now.getMonthValue())
                                .totalAmount(new BigDecimal("25000000"))
                                .transactionCount(50)
                                .build()
                ))
                .build();
        when(adminFinanceService.getRevenueSummary()).thenReturn(revDto);

        when(refundRepository.findByStatusOrderByRequestedAtDesc(RefundStatus.PENDING))
                .thenReturn(Collections.emptyList());

        AdminDashboardSummaryDto summary = service.getSummary();
        assertNotNull(summary);
        assertEquals(45L, summary.getTotalPlaces());
        assertEquals(8L, summary.getUnverifiedPlaces());
        assertEquals(15L, summary.getTotalProviders());
        assertEquals(12L, summary.getActiveProviders());
        assertEquals(3L, summary.getSuspendedProviders());
        assertEquals(60L, summary.getTotalAccounts());
        assertEquals(55L, summary.getActiveAccounts());
        assertEquals(128L, summary.getMonthlyBookingsCount());
        assertEquals(new BigDecimal("25000000"), summary.getMonthlyRevenue());
        assertEquals(0L, summary.getPendingRefundsCount());
    }
}

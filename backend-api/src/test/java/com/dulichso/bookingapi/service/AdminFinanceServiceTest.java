package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminFinanceDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.AffiliateLink;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.PaymentTransaction;
import com.dulichso.bookingapi.entity.Refund;
import com.dulichso.bookingapi.entity.enums.CommissionStatus;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import com.dulichso.bookingapi.entity.enums.RefundStatus;
import com.dulichso.bookingapi.entity.enums.RefundType;
import com.dulichso.bookingapi.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminFinanceServiceTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AffiliateLinkRepository affiliateLinkRepository;

    @Mock
    private CommissionLedgerRepository commissionLedgerRepository;

    @Mock
    private AuditLogService auditLogService;

    private AdminFinanceService service;

    @BeforeEach
    void setUp() {
        service = new AdminFinanceService(
                paymentTransactionRepository,
                refundRepository,
                accountRepository,
                affiliateLinkRepository,
                commissionLedgerRepository,
                auditLogService
        );
    }

    // ─────────────────────────────────────────────
    // getRevenueSummary
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getRevenueSummary: trả về tổng và danh sách theo tháng")
    void testGetRevenueSummary() {
        when(paymentTransactionRepository.sumTotalRevenue(PaymentStatus.SUCCESS))
                .thenReturn(new BigDecimal("5000000"));
        // Mô phỏng row [year, month, totalAmount, count] — tạo List<Object[]> tường minh
        Object[] row = new Object[]{2026, 9, new BigDecimal("5000000"), 3L};
        java.util.ArrayList<Object[]> rows = new java.util.ArrayList<>();
        rows.add(row);
        when(paymentTransactionRepository.sumRevenueByMonth(PaymentStatus.SUCCESS))
                .thenReturn(rows);

        RevenueSummaryDto result = service.getRevenueSummary();

        assertEquals(new BigDecimal("5000000"), result.getGrandTotal());
        assertEquals(1, result.getByMonth().size());
        assertEquals(2026, result.getByMonth().get(0).getYear());
        assertEquals(9, result.getByMonth().get(0).getMonth());
        assertEquals(3L, result.getTotalTransactions());
    }

    @Test
    @DisplayName("getRevenueSummary: chưa có giao dịch → grandTotal = 0")
    void testGetRevenueSummary_empty() {
        when(paymentTransactionRepository.sumTotalRevenue(PaymentStatus.SUCCESS))
                .thenReturn(BigDecimal.ZERO);
        when(paymentTransactionRepository.sumRevenueByMonth(PaymentStatus.SUCCESS))
                .thenReturn(List.of());

        RevenueSummaryDto result = service.getRevenueSummary();

        assertEquals(BigDecimal.ZERO, result.getGrandTotal());
        assertTrue(result.getByMonth().isEmpty());
        assertEquals(0L, result.getTotalTransactions());
    }

    // ─────────────────────────────────────────────
    // approveRefund
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("approveRefund: PENDING → PROCESSED thành công")
    void testApproveRefund_success() {
        Refund refund = buildPendingRefund(1L);
        Account actor = Account.builder().id(1001L).fullName("Admin Test").build();

        when(refundRepository.findWithDetailsById(1L)).thenReturn(Optional.of(refund));
        when(accountRepository.findById(1001L)).thenReturn(Optional.of(actor));
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefundDto result = service.approveRefund(1L, 1001L);

        assertEquals(RefundStatus.PROCESSED, result.getStatus());
        assertNotNull(result.getProcessedAt());
        assertEquals(1001L, result.getProcessedByAccountId());
        verify(auditLogService).record(eq(1001L), eq("REFUND_APPROVED"), eq("Refund"),
                eq(1L), isNull(), any(), any());
    }

    @Test
    @DisplayName("approveRefund: đã PROCESSED → 409 Conflict (activeGuard Java-side check)")
    void testApproveRefund_alreadyProcessed() {
        Refund refund = buildRefund(1L, RefundStatus.PROCESSED);
        when(refundRepository.findWithDetailsById(1L)).thenReturn(Optional.of(refund));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.approveRefund(1L, 1001L));
        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getMessage().contains("activeGuard"));
    }

    @Test
    @DisplayName("approveRefund: refund không tồn tại → 404 Not Found")
    void testApproveRefund_notFound() {
        when(refundRepository.findWithDetailsById(anyLong())).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.approveRefund(999L, 1001L));
    }

    @Test
    @DisplayName("approveRefund: actorAccountId không tồn tại → 404 Not Found")
    void testApproveRefund_actorNotFound() {
        Refund refund = buildPendingRefund(1L);
        when(refundRepository.findWithDetailsById(1L)).thenReturn(Optional.of(refund));
        when(accountRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.approveRefund(1L, 9999L));
    }

    // ─────────────────────────────────────────────
    // rejectRefund
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("rejectRefund: PENDING → REJECTED thành công")
    void testRejectRefund_success() {
        Refund refund = buildPendingRefund(2L);
        Account actor = Account.builder().id(1001L).fullName("Admin Test").build();

        when(refundRepository.findWithDetailsById(2L)).thenReturn(Optional.of(refund));
        when(accountRepository.findById(1001L)).thenReturn(Optional.of(actor));
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefundDto result = service.rejectRefund(2L, 1001L, "Sai thông tin hoàn tiền");

        assertEquals(RefundStatus.REJECTED, result.getStatus());
        verify(auditLogService).record(eq(1001L), eq("REFUND_REJECTED"), eq("Refund"),
                eq(2L), eq("Sai thông tin hoàn tiền"), any(), any());
    }

    @Test
    @DisplayName("rejectRefund: đã REJECTED → 409 Conflict")
    void testRejectRefund_alreadyRejected() {
        Refund refund = buildRefund(2L, RefundStatus.REJECTED);
        when(refundRepository.findWithDetailsById(2L)).thenReturn(Optional.of(refund));

        assertThrows(ResponseStatusException.class,
                () -> service.rejectRefund(2L, 1001L, "reason"));
    }

    // ─────────────────────────────────────────────
    // createAffiliateLink
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("createAffiliateLink: tạo thành công với commissionRate do admin nhập")
    void testCreateAffiliateLink_success() {
        Account account = Account.builder().id(1L).fullName("Người giới thiệu A").build();
        AffiliateLink saved = AffiliateLink.builder()
                .id(10L)
                .account(account)
                .code("DULICHSO2026")
                .commissionRate(new BigDecimal("0.0500"))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(affiliateLinkRepository.existsByCode("DULICHSO2026")).thenReturn(false);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(affiliateLinkRepository.save(any())).thenReturn(saved);

        CreateAffiliateLinkRequest req = CreateAffiliateLinkRequest.builder()
                .accountId(1L)
                .code("DULICHSO2026")
                .commissionRate(new BigDecimal("0.0500"))
                .build();

        AffiliateLinkDto result = service.createAffiliateLink(req, 1001L);

        assertEquals("DULICHSO2026", result.getCode());
        assertEquals(new BigDecimal("0.0500"), result.getCommissionRate());
        assertTrue(result.getIsActive());
    }

    @Test
    @DisplayName("createAffiliateLink: code trùng → 409 Conflict")
    void testCreateAffiliateLink_duplicateCode() {
        when(affiliateLinkRepository.existsByCode("DULICHSO2026")).thenReturn(true);

        CreateAffiliateLinkRequest req = CreateAffiliateLinkRequest.builder()
                .accountId(1L)
                .code("DULICHSO2026")
                .commissionRate(new BigDecimal("0.05"))
                .build();

        assertThrows(ResponseStatusException.class, () -> service.createAffiliateLink(req, 1001L));
    }

    // ─────────────────────────────────────────────
    // getCommissionSummary
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getCommissionSummary: tổng hợp đúng 4 trạng thái")
    void testGetCommissionSummary() {
        when(commissionLedgerRepository.sumAmountByStatus(CommissionStatus.PENDING))
                .thenReturn(new BigDecimal("100000"));
        when(commissionLedgerRepository.sumAmountByStatus(CommissionStatus.APPROVED))
                .thenReturn(new BigDecimal("50000"));
        when(commissionLedgerRepository.sumAmountByStatus(CommissionStatus.PAID))
                .thenReturn(new BigDecimal("200000"));
        when(commissionLedgerRepository.sumAmountByStatus(CommissionStatus.REJECTED))
                .thenReturn(BigDecimal.ZERO);
        when(commissionLedgerRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        CommissionSummaryDto result = service.getCommissionSummary();

        assertEquals(new BigDecimal("100000"), result.getTotalPending());
        assertEquals(new BigDecimal("50000"), result.getTotalApproved());
        assertEquals(new BigDecimal("200000"), result.getTotalPaid());
        assertEquals(BigDecimal.ZERO, result.getTotalRejected());
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private Refund buildPendingRefund(Long id) {
        return buildRefund(id, RefundStatus.PENDING);
    }

    private Refund buildRefund(Long id, RefundStatus status) {
        Booking booking = Booking.builder()
                .id(100L)
                .bookingCode("BK-TEST-001")
                .build();
        PaymentTransaction pt = PaymentTransaction.builder()
                .id(200L)
                .amount(new BigDecimal("500000"))
                .build();
        return Refund.builder()
                .id(id)
                .booking(booking)
                .paymentTransaction(pt)
                .refundType(RefundType.FULL_REFUND)
                .amount(new BigDecimal("500000"))
                .reason("Khách huỷ booking")
                .status(status)
                .requestedAt(LocalDateTime.now())
                .build();
    }
}

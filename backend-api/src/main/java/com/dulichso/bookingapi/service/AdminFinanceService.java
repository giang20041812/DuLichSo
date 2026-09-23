package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminFinanceDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.AffiliateLink;
import com.dulichso.bookingapi.entity.CommissionLedger;
import com.dulichso.bookingapi.entity.Refund;
import com.dulichso.bookingapi.entity.enums.CommissionStatus;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import com.dulichso.bookingapi.entity.enums.RefundStatus;
import com.dulichso.bookingapi.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service Admin quản lý tài chính: doanh thu, hoàn tiền (refund), affiliate/hoa hồng.
 *
 * LƯU Ý activeGuard trong Refund:
 * activeGuard là cột generated (nếu cấu hình đúng ở DB) dùng để chống duplicate approve.
 * Theo quyết định thiết kế: kiểm tra code Java — nếu status != PENDING thì throw 409 Conflict.
 * Không dựa vào DB constraint để xử lý vì activeGuard chưa được define là GENERATED ALWAYS.
 */
@Service
public class AdminFinanceService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RefundRepository refundRepository;
    private final AccountRepository accountRepository;
    private final AffiliateLinkRepository affiliateLinkRepository;
    private final CommissionLedgerRepository commissionLedgerRepository;
    private final AuditLogService auditLogService;

    public AdminFinanceService(PaymentTransactionRepository paymentTransactionRepository,
                               RefundRepository refundRepository,
                               AccountRepository accountRepository,
                               AffiliateLinkRepository affiliateLinkRepository,
                               CommissionLedgerRepository commissionLedgerRepository,
                               AuditLogService auditLogService) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.refundRepository = refundRepository;
        this.accountRepository = accountRepository;
        this.affiliateLinkRepository = affiliateLinkRepository;
        this.commissionLedgerRepository = commissionLedgerRepository;
        this.auditLogService = auditLogService;
    }

    // ─────────────────────────────────────────────
    // Revenue
    // ─────────────────────────────────────────────

    /**
     * Tổng hợp doanh thu từ PaymentTransaction có status SUCCESS.
     * Field status thực tế trong entity là PaymentStatus.SUCCESS.
     */
    @Transactional(readOnly = true)
    public RevenueSummaryDto getRevenueSummary() {
        BigDecimal grandTotal = paymentTransactionRepository.sumTotalRevenue(PaymentStatus.SUCCESS);
        List<Object[]> rows = paymentTransactionRepository.sumRevenueByMonth(PaymentStatus.SUCCESS);

        List<MonthlyRevenueItem> byMonth = rows.stream().map(row -> MonthlyRevenueItem.builder()
                .year(((Number) row[0]).intValue())
                .month(((Number) row[1]).intValue())
                .totalAmount((BigDecimal) row[2])
                .transactionCount(((Number) row[3]).longValue())
                .build()
        ).collect(Collectors.toList());

        long totalTransactions = byMonth.stream()
                .mapToLong(MonthlyRevenueItem::getTransactionCount)
                .sum();

        return RevenueSummaryDto.builder()
                .grandTotal(grandTotal)
                .totalTransactions(totalTransactions)
                .byMonth(byMonth)
                .build();
    }

    // ─────────────────────────────────────────────
    // Refunds
    // ─────────────────────────────────────────────

    /**
     * Lấy danh sách refund đang chờ duyệt (status = PENDING).
     */
    @Transactional(readOnly = true)
    public List<RefundDto> getPendingRefunds() {
        return refundRepository.findByStatusOrderByRequestedAtDesc(RefundStatus.PENDING)
                .stream().map(this::toRefundDto).collect(Collectors.toList());
    }

    /**
     * Lấy tất cả refunds.
     */
    @Transactional(readOnly = true)
    public List<RefundDto> getAllRefunds() {
        return refundRepository.findAll().stream().map(this::toRefundDto).collect(Collectors.toList());
    }

    /**
     * Duyệt refund (PENDING → PROCESSED).
     *
     * activeGuard design: kiểm tra status Java-side trước khi ghi.
     * Nếu status != PENDING → throw 409 để tránh duyệt trùng.
     */
    @Transactional
    public RefundDto approveRefund(Long id, Long actorAccountId) {
        Refund refund = refundRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy refund id=" + id));

        // activeGuard: kiểm tra Java-side — không duyệt nếu không còn PENDING
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Refund đã được xử lý trước đó. Trạng thái hiện tại: " + refund.getStatus()
                    + " (activeGuard: phòng tránh duyệt trùng)");
        }

        Account actor = accountRepository.findById(actorAccountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản actor id=" + actorAccountId));

        Map<String, Object> before = Map.of("status", refund.getStatus().name());

        refund.setStatus(RefundStatus.PROCESSED);
        refund.setProcessedBy(actor);
        refund.setProcessedAt(LocalDateTime.now());
        refundRepository.save(refund);

        auditLogService.record(actorAccountId, "REFUND_APPROVED", "Refund", id, null,
                before, Map.of("status", RefundStatus.PROCESSED.name(),
                               "processedById", actorAccountId));

        return toRefundDto(refund);
    }

    /**
     * Từ chối refund (PENDING → REJECTED).
     * activeGuard: tương tự approveRefund — kiểm tra Java-side.
     */
    @Transactional
    public RefundDto rejectRefund(Long id, Long actorAccountId, String reason) {
        Refund refund = refundRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy refund id=" + id));

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Refund đã được xử lý trước đó. Trạng thái hiện tại: " + refund.getStatus()
                    + " (activeGuard: phòng tránh xử lý trùng)");
        }

        Account actor = accountRepository.findById(actorAccountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản actor id=" + actorAccountId));

        Map<String, Object> before = Map.of("status", refund.getStatus().name());

        refund.setStatus(RefundStatus.REJECTED);
        refund.setProcessedBy(actor);
        refund.setProcessedAt(LocalDateTime.now());
        refund.setReason(reason != null ? reason : refund.getReason());
        refundRepository.save(refund);

        auditLogService.record(actorAccountId, "REFUND_REJECTED", "Refund", id, reason,
                before, Map.of("status", RefundStatus.REJECTED.name()));

        return toRefundDto(refund);
    }

    // ─────────────────────────────────────────────
    // Affiliate Links
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AffiliateLinkDto> getAffiliateLinks() {
        return affiliateLinkRepository.findAll().stream()
                .map(this::toAffiliateLinkDto).collect(Collectors.toList());
    }

    @Transactional
    public AffiliateLinkDto createAffiliateLink(CreateAffiliateLinkRequest request, Long actorAccountId) {
        if (affiliateLinkRepository.existsByCode(request.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Code affiliate đã tồn tại: " + request.getCode());
        }

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản id=" + request.getAccountId()));

        AffiliateLink link = AffiliateLink.builder()
                .account(account)
                .code(request.getCode())
                .commissionRate(request.getCommissionRate())
                .isActive(true)
                .build();
        link = affiliateLinkRepository.save(link);

        auditLogService.record(actorAccountId, "AFFILIATE_LINK_CREATED", "AffiliateLink",
                link.getId(), null, null,
                Map.of("code", link.getCode(), "commissionRate", link.getCommissionRate().toString()));

        return toAffiliateLinkDto(link);
    }

    @Transactional
    public void deactivateAffiliateLink(Long id, Long actorAccountId) {
        AffiliateLink link = affiliateLinkRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy affiliate link id=" + id));
        link.setIsActive(false);
        affiliateLinkRepository.save(link);

        auditLogService.record(actorAccountId, "AFFILIATE_LINK_DEACTIVATED", "AffiliateLink",
                id, null, Map.of("isActive", "true"), Map.of("isActive", "false"));
    }

    // ─────────────────────────────────────────────
    // Commission Summary
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CommissionSummaryDto getCommissionSummary() {
        BigDecimal pending = commissionLedgerRepository.sumAmountByStatus(CommissionStatus.PENDING);
        BigDecimal approved = commissionLedgerRepository.sumAmountByStatus(CommissionStatus.APPROVED);
        BigDecimal paid = commissionLedgerRepository.sumAmountByStatus(CommissionStatus.PAID);
        BigDecimal rejected = commissionLedgerRepository.sumAmountByStatus(CommissionStatus.REJECTED);

        List<CommissionLedgerDto> items = commissionLedgerRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toCommissionLedgerDto).collect(Collectors.toList());

        return CommissionSummaryDto.builder()
                .totalPending(pending)
                .totalApproved(approved)
                .totalPaid(paid)
                .totalRejected(rejected)
                .items(items)
                .build();
    }

    // ─────────────────────────────────────────────
    // Mapper helpers
    // ─────────────────────────────────────────────

    private RefundDto toRefundDto(Refund r) {
        return RefundDto.builder()
                .id(r.getId())
                .bookingId(r.getBooking() != null ? r.getBooking().getId() : null)
                .bookingCode(r.getBooking() != null ? r.getBooking().getBookingCode() : null)
                .paymentTransactionId(r.getPaymentTransaction() != null ? r.getPaymentTransaction().getId() : null)
                .refundType(r.getRefundType())
                .amount(r.getAmount())
                .reason(r.getReason())
                .status(r.getStatus())
                .requestedAt(r.getRequestedAt())
                .processedAt(r.getProcessedAt())
                .processedByAccountId(r.getProcessedBy() != null ? r.getProcessedBy().getId() : null)
                .processedByName(r.getProcessedBy() != null ? r.getProcessedBy().getFullName() : null)
                .build();
    }

    private AffiliateLinkDto toAffiliateLinkDto(AffiliateLink l) {
        return AffiliateLinkDto.builder()
                .id(l.getId())
                .accountId(l.getAccount() != null ? l.getAccount().getId() : null)
                .accountName(l.getAccount() != null ? l.getAccount().getFullName() : null)
                .code(l.getCode())
                .commissionRate(l.getCommissionRate())
                .isActive(l.getIsActive())
                .createdAt(l.getCreatedAt())
                .build();
    }

    private CommissionLedgerDto toCommissionLedgerDto(CommissionLedger cl) {
        return CommissionLedgerDto.builder()
                .id(cl.getId())
                .affiliateLinkId(cl.getAffiliateLink() != null ? cl.getAffiliateLink().getId() : null)
                .affiliateCode(cl.getAffiliateLink() != null ? cl.getAffiliateLink().getCode() : null)
                .affiliateAccountId(cl.getAffiliateLink() != null && cl.getAffiliateLink().getAccount() != null
                        ? cl.getAffiliateLink().getAccount().getId() : null)
                .affiliateAccountName(cl.getAffiliateLink() != null && cl.getAffiliateLink().getAccount() != null
                        ? cl.getAffiliateLink().getAccount().getFullName() : null)
                .bookingId(cl.getBooking() != null ? cl.getBooking().getId() : null)
                .bookingCode(cl.getBooking() != null ? cl.getBooking().getBookingCode() : null)
                .amount(cl.getAmount())
                .status(cl.getStatus())
                .createdAt(cl.getCreatedAt())
                .paidAt(cl.getPaidAt())
                .build();
    }
}

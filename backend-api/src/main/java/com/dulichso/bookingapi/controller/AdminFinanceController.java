package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminFinanceDtos.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminFinanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin: quản lý tài chính — doanh thu, hoàn tiền, affiliate/hoa hồng.
 * Yêu cầu ROLE_ADMIN (SecurityConfig đã cấu hình cho /api/v1/admin/**).
 */
@RestController
@RequestMapping("/api/v1/admin/finance")
public class AdminFinanceController {

    private final AdminFinanceService adminFinanceService;

    public AdminFinanceController(AdminFinanceService adminFinanceService) {
        this.adminFinanceService = adminFinanceService;
    }

    // ─────────────────────────────────────────────
    // Revenue
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/admin/finance/revenue-summary
     * Tổng hợp doanh thu theo tháng và tổng toàn thời gian.
     */
    @GetMapping("/revenue-summary")
    public ResponseEntity<RevenueSummaryDto> getRevenueSummary() {
        return ResponseEntity.ok(adminFinanceService.getRevenueSummary());
    }

    // ─────────────────────────────────────────────
    // Refunds
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/admin/finance/refunds?pendingOnly=true
     * Danh sách hoàn tiền. pendingOnly=true → chỉ lấy PENDING (mặc định).
     */
    @GetMapping("/refunds")
    public ResponseEntity<List<RefundDto>> getRefunds(
            @RequestParam(required = false, defaultValue = "true") Boolean pendingOnly) {
        List<RefundDto> refunds = Boolean.TRUE.equals(pendingOnly)
                ? adminFinanceService.getPendingRefunds()
                : adminFinanceService.getAllRefunds();
        return ResponseEntity.ok(refunds);
    }

    /**
     * POST /api/v1/admin/finance/refunds/{id}/approve
     * Duyệt hoàn tiền (PENDING → PROCESSED).
     */
    @PostMapping("/refunds/{id}/approve")
    public ResponseEntity<RefundDto> approveRefund(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveRefundRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        if (actorId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Không xác định được tài khoản admin");
        }
        return ResponseEntity.ok(adminFinanceService.approveRefund(id, actorId));
    }

    /**
     * POST /api/v1/admin/finance/refunds/{id}/reject
     * Từ chối hoàn tiền (PENDING → REJECTED).
     */
    @PostMapping("/refunds/{id}/reject")
    public ResponseEntity<RefundDto> rejectRefund(
            @PathVariable Long id,
            @Valid @RequestBody RejectRefundRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        if (actorId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Không xác định được tài khoản admin");
        }
        return ResponseEntity.ok(adminFinanceService.rejectRefund(id, actorId, request.getReason()));
    }

    // ─────────────────────────────────────────────
    // Affiliate Links
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/admin/finance/affiliate-links
     * Danh sách tất cả affiliate links.
     */
    @GetMapping("/affiliate-links")
    public ResponseEntity<List<AffiliateLinkDto>> getAffiliateLinks() {
        return ResponseEntity.ok(adminFinanceService.getAffiliateLinks());
    }

    /**
     * POST /api/v1/admin/finance/affiliate-links
     * Tạo mới affiliate link. commissionRate bắt buộc — admin phải nhập.
     */
    @PostMapping("/affiliate-links")
    public ResponseEntity<AffiliateLinkDto> createAffiliateLink(
            @Valid @RequestBody CreateAffiliateLinkRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminFinanceService.createAffiliateLink(request, actorId));
    }

    /**
     * DELETE /api/v1/admin/finance/affiliate-links/{id}
     * Vô hiệu hoá affiliate link (soft deactivate, không xoá dữ liệu).
     */
    @DeleteMapping("/affiliate-links/{id}")
    public ResponseEntity<Void> deactivateAffiliateLink(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        adminFinanceService.deactivateAffiliateLink(id, actorId);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────
    // Commission
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/admin/finance/commissions
     * Tổng hợp hoa hồng theo trạng thái (PENDING/APPROVED/PAID/REJECTED) kèm danh sách chi tiết.
     */
    @GetMapping("/commissions")
    public ResponseEntity<CommissionSummaryDto> getCommissionSummary() {
        return ResponseEntity.ok(adminFinanceService.getCommissionSummary());
    }
}

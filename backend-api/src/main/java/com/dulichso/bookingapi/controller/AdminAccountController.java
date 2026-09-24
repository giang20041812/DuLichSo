package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminAccountDtos.*;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/accounts")
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    public AdminAccountController(AdminAccountService adminAccountService) {
        this.adminAccountService = adminAccountService;
    }

    /**
     * GET /api/v1/admin/accounts
     * Danh sách tài khoản (lọc role, status, từ khoá).
     */
    @GetMapping
    public ResponseEntity<List<AccountDto>> getAccounts(
            @RequestParam(required = false) AccountRole role,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(adminAccountService.getAccounts(role, status, keyword));
    }

    /**
     * GET /api/v1/admin/accounts/{id}
     * Chi tiết 1 tài khoản.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(adminAccountService.getAccountById(id));
    }

    /**
     * POST /api/v1/admin/accounts
     * Tạo tài khoản Admin mới.
     */
    @PostMapping
    public ResponseEntity<AccountDto> createAdminAccount(
            @Valid @RequestBody CreateAdminAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        AccountDto created = adminAccountService.createAdminAccount(request, callerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/admin/accounts/{id}
     * Sửa thông tin tài khoản (họ tên, email, SĐT).
     */
    @PutMapping("/{id}")
    public ResponseEntity<AccountDto> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminAccountService.updateAccount(id, request, callerId));
    }

    /**
     * PATCH /api/v1/admin/accounts/{id}/status
     * Khoá / mở tài khoản (chặn tự khoá tài khoản đang đăng nhập).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<AccountDto> updateAccountStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminAccountService.updateAccountStatus(id, request, callerId));
    }

    /**
     * PATCH /api/v1/admin/accounts/{id}/reset-password
     * Đặt lại mật khẩu tài khoản.
     */
    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        adminAccountService.resetPassword(id, request, callerId);
        return ResponseEntity.noContent().build();
    }
}

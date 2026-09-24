package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminProviderDtos.*;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminProviderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/providers")
public class AdminProviderController {

    private final AdminProviderService adminProviderService;

    public AdminProviderController(AdminProviderService adminProviderService) {
        this.adminProviderService = adminProviderService;
    }

    /**
     * GET /api/v1/admin/providers
     * Danh sách NCC (lọc trạng thái, kèm số điểm đến + số tài khoản).
     */
    @GetMapping
    public ResponseEntity<List<ProviderSummaryDto>> getProviders(
            @RequestParam(required = false) ProviderStatus status) {
        return ResponseEntity.ok(adminProviderService.getProviders(status));
    }

    /**
     * GET /api/v1/admin/providers/{id}
     * Xem chi tiết 1 NCC.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProviderSummaryDto> getProviderById(@PathVariable Long id) {
        return ResponseEntity.ok(adminProviderService.getProviderById(id));
    }

    /**
     * POST /api/v1/admin/providers
     * Tạo NCC mới + tài khoản đăng nhập đầu tiên trong 1 bước (luôn ACTIVE).
     */
    @PostMapping
    public ResponseEntity<ProviderSummaryDto> createProviderWithAccount(
            @Valid @RequestBody CreateProviderWithAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        ProviderSummaryDto created = adminProviderService.createProviderWithAccount(request, callerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/admin/providers/{id}
     * Sửa hồ sơ NCC.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProviderSummaryDto> updateProvider(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProviderRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminProviderService.updateProvider(id, request, callerId));
    }

    /**
     * PATCH /api/v1/admin/providers/{id}/status
     * Đổi trạng thái ACTIVE / SUSPENDED / TERMINATED.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ProviderSummaryDto> updateProviderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProviderStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminProviderService.updateProviderStatus(id, request, callerId));
    }
}

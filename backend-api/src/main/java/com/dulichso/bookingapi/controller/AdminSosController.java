package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminSosDtos.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminSosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin: quản lý SOS requests và EmergencyContacts.
 * Yêu cầu ROLE_ADMIN (SecurityConfig đã cấu hình cho /api/v1/admin/**).
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminSosController {

    private final AdminSosService adminSosService;

    public AdminSosController(AdminSosService adminSosService) {
        this.adminSosService = adminSosService;
    }

    // ─────────────────────────────────────────────
    // SOS Requests
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/admin/sos-requests?status=PENDING
     * Lấy danh sách SOS requests. Lọc theo status (tuỳ chọn).
     */
    @GetMapping("/sos-requests")
    public ResponseEntity<SosRequestListResponse> getSosRequests(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminSosService.getSosRequests(status));
    }

    /**
     * GET /api/v1/admin/sos-requests/{id}
     * Chi tiết 1 SOS request.
     */
    @GetMapping("/sos-requests/{id}")
    public ResponseEntity<SosRequestDto> getSosRequest(@PathVariable Long id) {
        return ResponseEntity.ok(adminSosService.getSosRequest(id));
    }

    /**
     * POST /api/v1/admin/sos-requests/{id}/dispatch
     * Gán EmergencyContact và chuyển sang DISPATCHED.
     */
    @PostMapping("/sos-requests/{id}/dispatch")
    public ResponseEntity<SosRequestDto> dispatch(
            @PathVariable Long id,
            @Valid @RequestBody DispatchSosRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminSosService.dispatch(id, request, actorId));
    }

    /**
     * POST /api/v1/admin/sos-requests/{id}/resolve
     * Đánh dấu SOS request đã xử lý xong (RESOLVED).
     */
    @PostMapping("/sos-requests/{id}/resolve")
    public ResponseEntity<SosRequestDto> resolve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminSosService.resolve(id, actorId));
    }

    /**
     * POST /api/v1/admin/sos-requests/{id}/cancel
     * Huỷ SOS request (CANCELLED).
     */
    @PostMapping("/sos-requests/{id}/cancel")
    public ResponseEntity<SosRequestDto> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminSosService.cancel(id, actorId));
    }

    // ─────────────────────────────────────────────
    // Emergency Contacts
    // ─────────────────────────────────────────────

    /**
     * GET /api/v1/admin/emergency-contacts?activeOnly=true
     * Danh sách đầu mối liên hệ khẩn cấp.
     */
    @GetMapping("/emergency-contacts")
    public ResponseEntity<List<EmergencyContactDto>> getEmergencyContacts(
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly) {
        return ResponseEntity.ok(adminSosService.getEmergencyContacts(activeOnly));
    }

    /**
     * GET /api/v1/admin/emergency-contacts/{id}
     * Chi tiết đầu mối liên hệ.
     */
    @GetMapping("/emergency-contacts/{id}")
    public ResponseEntity<EmergencyContactDto> getEmergencyContact(@PathVariable Long id) {
        return ResponseEntity.ok(adminSosService.getEmergencyContact(id));
    }

    /**
     * POST /api/v1/admin/emergency-contacts
     * Tạo mới đầu mối liên hệ khẩn cấp.
     */
    @PostMapping("/emergency-contacts")
    public ResponseEntity<EmergencyContactDto> createEmergencyContact(
            @Valid @RequestBody CreateEmergencyContactRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminSosService.createEmergencyContact(request, actorId));
    }

    /**
     * PUT /api/v1/admin/emergency-contacts/{id}
     * Cập nhật đầu mối liên hệ.
     */
    @PutMapping("/emergency-contacts/{id}")
    public ResponseEntity<EmergencyContactDto> updateEmergencyContact(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmergencyContactRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminSosService.updateEmergencyContact(id, request, actorId));
    }

    /**
     * DELETE /api/v1/admin/emergency-contacts/{id}
     * Xoá đầu mối liên hệ.
     */
    @DeleteMapping("/emergency-contacts/{id}")
    public ResponseEntity<Void> deleteEmergencyContact(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long actorId = principal != null ? principal.accountId() : null;
        adminSosService.deleteEmergencyContact(id, actorId);
        return ResponseEntity.noContent().build();
    }
}

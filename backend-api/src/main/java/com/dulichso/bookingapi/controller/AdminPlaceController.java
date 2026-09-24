package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminPlaceDtos.*;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminPlaceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/places")
public class AdminPlaceController {

    private final AdminPlaceService adminPlaceService;

    public AdminPlaceController(AdminPlaceService adminPlaceService) {
        this.adminPlaceService = adminPlaceService;
    }

    /**
     * GET /api/v1/admin/places
     * Danh sách mọi Điểm đến toàn hệ thống (phân trang, lọc keyword, visibility, verification, loại hình).
     */
    @GetMapping
    public ResponseEntity<Page<AdminPlaceSummaryDto>> getPlaces(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PlaceVisibility visibility,
            @RequestParam(required = false) PlaceVerificationStatus verification,
            @RequestParam(required = false) CategoryKind kind,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate createdFrom,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate createdTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminPlaceService.getPlaces(keyword, visibility, verification, kind,
                providerId, regionId, createdFrom, createdTo, sortBy, sortDir, page, size));
    }

    /** GET /api/v1/admin/places/summary — số điểm đến theo trạng thái xác thực (cho chip đếm). */
    @GetMapping("/summary")
    public ResponseEntity<java.util.Map<String, Long>> getSummary() {
        return ResponseEntity.ok(adminPlaceService.countByVerification());
    }

    /** PATCH /api/v1/admin/places/verification/bulk — duyệt / từ chối hàng loạt. */
    @PatchMapping("/verification/bulk")
    public ResponseEntity<java.util.Map<String, Integer>> bulkVerification(
            @RequestBody BulkVerificationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        int updated = adminPlaceService.bulkUpdateVerification(request.ids(), request.verification(), request.reason(), callerId);
        return ResponseEntity.ok(java.util.Map.of("updated", updated));
    }

    public record BulkVerificationRequest(java.util.List<Long> ids, PlaceVerificationStatus verification, String reason) {}

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(java.util.Map.of("status", 400, "message", ex.getMessage()));
    }

    /**
     * GET /api/v1/admin/places/{id}
     * Xem chi tiết 1 điểm đến.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminPlaceDetailDto> getPlaceById(@PathVariable Long id) {
        return ResponseEntity.ok(adminPlaceService.getPlaceById(id));
    }

    /**
     * PATCH /api/v1/admin/places/{id}/verification
     * Duyệt xác thực nội dung (VERIFIED / UNVERIFIED / NEEDS_UPDATE / ARCHIVED).
     */
    @PatchMapping("/{id}/verification")
    public ResponseEntity<AdminPlaceSummaryDto> updateVerification(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlaceVerificationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminPlaceService.updateVerification(id, request, callerId));
    }

    /**
     * PATCH /api/v1/admin/places/{id}/visibility
     * Admin ẩn khẩn cấp bất kỳ Place nào (vượt quyền Partner).
     */
    @PatchMapping("/{id}/visibility")
    public ResponseEntity<AdminPlaceSummaryDto> updateVisibility(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlaceVisibilityRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminPlaceService.updateVisibility(id, request, callerId));
    }
}

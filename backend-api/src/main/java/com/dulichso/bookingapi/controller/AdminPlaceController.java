package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminPlaceDtos.*;
import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.PlaceShowcaseDto;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminPlaceService;
import com.dulichso.bookingapi.service.PlaceShowcaseService;
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
    private final PlaceShowcaseService placeShowcaseService;

    public AdminPlaceController(AdminPlaceService adminPlaceService, PlaceShowcaseService placeShowcaseService) {
        this.adminPlaceService = adminPlaceService;
        this.placeShowcaseService = placeShowcaseService;
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

    /** POST /api/v1/admin/places/delete — xóa mềm một hoặc nhiều điểm đến (chỉ Admin cấp 1, bắt buộc lý do). */
    @PostMapping("/delete")
    public ResponseEntity<java.util.Map<String, Integer>> deletePlaces(
            @RequestBody DeletePlacesRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        int deleted = adminPlaceService.deletePlaces(request.ids(), request.reason(), callerId);
        return ResponseEntity.ok(java.util.Map.of("deleted", deleted));
    }

    public record DeletePlacesRequest(java.util.List<Long> ids, String reason) {}

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(java.util.Map.of("status", 400, "message", ex.getMessage()));
    }

    /** Thao tác bị từ chối do trạng thái hiện tại (vd: điểm đến còn đơn đặt phòng đang hiệu lực). */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                .body(java.util.Map.of("status", 409, "message", ex.getMessage() != null ? ex.getMessage() : "Thao tác không được phép ở trạng thái hiện tại."));
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
     * GET /api/v1/admin/places/{id}/showcase
     * Hình ảnh, tiện nghi và chính sách lưu trú của điểm đến (màn Duyệt điểm đến).
     */
    @GetMapping("/{id}/showcase")
    public ResponseEntity<PlaceShowcaseDto> getPlaceShowcase(@PathVariable Long id) {
        return ResponseEntity.ok(placeShowcaseService.forPlace(id));
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

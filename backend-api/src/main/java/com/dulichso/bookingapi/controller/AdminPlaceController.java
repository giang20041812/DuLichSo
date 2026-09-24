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
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminPlaceService.getPlaces(keyword, visibility, verification, kind, pageable));
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

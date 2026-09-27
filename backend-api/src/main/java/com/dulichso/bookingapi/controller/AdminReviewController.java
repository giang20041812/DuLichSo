package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminReviewDtos.ModerateInput;
import com.dulichso.bookingapi.dto.admin.AdminReviewDtos.ReviewDto;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** FR-AD-15: kiểm duyệt đánh giá — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/reviews")
public class AdminReviewController {
    private final AdminReviewService service;

    @GetMapping
    public ResponseEntity<Page<ReviewDto>> search(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) Long placeId,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.search(status, placeId, providerId, rating, keyword, from, to, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(service.detail(id));
    }

    @PostMapping("/{id}/moderate")
    public ResponseEntity<ReviewDto> moderate(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                              @RequestBody @Valid ModerateInput input) {
        return ResponseEntity.ok(service.moderate(id, principal.accountId(), input.action(), input.reason()));
    }
}

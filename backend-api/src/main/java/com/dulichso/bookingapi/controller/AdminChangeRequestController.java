package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ApproveInput;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestDetailDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.PendingCountDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.RejectInput;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminChangeRequestService;
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

/** Admin duyệt thay đổi Homestay/phòng/giá do NCC gửi — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/change-requests")
public class AdminChangeRequestController {
    private final AdminChangeRequestService service;

    @GetMapping
    public ResponseEntity<Page<ChangeRequestSummaryDto>> search(
            @RequestParam(required = false) ChangeRequestStatus status,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Long placeId,
            @RequestParam(required = false) ChangeTargetType targetType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.search(status, providerId, placeId, targetType, keyword, from, to, sortDir, page, size));
    }

    /** Số yêu cầu đang chờ duyệt (huy hiệu cần xử lý). */
    @GetMapping("/summary")
    public ResponseEntity<PendingCountDto> summary() {
        return ResponseEntity.ok(new PendingCountDto(service.pendingCount()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeRequestDetailDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(service.detail(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ChangeRequestDetailDto> approve(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                                          @RequestBody(required = false) @Valid ApproveInput input) {
        return ResponseEntity.ok(service.approve(id, principal.accountId(), input == null ? null : input.note()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ChangeRequestDetailDto> reject(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                                         @RequestBody @Valid RejectInput input) {
        return ResponseEntity.ok(service.reject(id, principal.accountId(), input.reason()));
    }
}

package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ApproveInput;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.RejectInput;
import com.dulichso.bookingapi.dto.admin.AdminProviderApplicationDtos.ApplicationDetailDto;
import com.dulichso.bookingapi.dto.admin.AdminProviderApplicationDtos.ApplicationSummaryDto;
import com.dulichso.bookingapi.dto.admin.AdminProviderApplicationDtos.PendingApplicationCountDto;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminProviderApplicationService;
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

/** FR-AD-16: Admin thẩm định hồ sơ đăng ký NCC — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/provider-applications")
public class AdminProviderApplicationController {
    private final AdminProviderApplicationService service;

    @GetMapping
    public ResponseEntity<Page<ApplicationSummaryDto>> search(
            @RequestParam(required = false) ProviderApplicationStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.search(status, keyword, from, to, sortDir, page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<PendingApplicationCountDto> summary() {
        return ResponseEntity.ok(new PendingApplicationCountDto(service.pendingCount()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDetailDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(service.detail(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApplicationDetailDto> approve(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                                        @RequestBody(required = false) @Valid ApproveInput input) {
        return ResponseEntity.ok(service.approve(id, principal.accountId(), input == null ? null : input.note()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApplicationDetailDto> reject(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                                       @RequestBody @Valid RejectInput input) {
        return ResponseEntity.ok(service.reject(id, principal.accountId(), input.reason()));
    }
}

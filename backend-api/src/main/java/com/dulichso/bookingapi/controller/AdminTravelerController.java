package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminTravelerService;
import com.dulichso.bookingapi.service.AdminTravelerService.TravelerDto;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/** Quản lý tài khoản khách du lịch — chỉ ADMIN (cấu hình ở SecurityConfig: /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin/travelers")
public class AdminTravelerController {

    private final AdminTravelerService adminTravelerService;

    public AdminTravelerController(AdminTravelerService adminTravelerService) {
        this.adminTravelerService = adminTravelerService;
    }

    @GetMapping
    public ResponseEntity<Page<TravelerDto>> search(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String signupMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminTravelerService.search(
                status, keyword, signupMethod, createdFrom, createdTo, sortBy, sortDir, page, size));
    }

    @PostMapping
    public ResponseEntity<TravelerDto> create(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.status(201).body(adminTravelerService.create(
                body.get("fullName"), body.get("email"), body.get("phone"), body.get("password"), callerId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TravelerDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        AccountStatus status;
        try {
            status = AccountStatus.valueOf(body.getOrDefault("status", ""));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ.");
        }
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.ok(adminTravelerService.updateStatus(id, status, body.get("reason"), callerId));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("status", 400, "message", ex.getMessage()));
    }
}

package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminNotificationDtos.NotificationFeedDto;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Thông báo của chính Admin đang đăng nhập — mọi cấp Admin (SecurityConfig: /api/v1/admin/notifications/**). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/notifications")
public class AdminNotificationController {
    private final AdminNotificationService service;

    @GetMapping
    public ResponseEntity<NotificationFeedDto> feed(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(service.feed(accountId(principal)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        service.markRead(accountId(principal), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        service.markAllRead(accountId(principal));
        return ResponseEntity.noContent().build();
    }

    private static Long accountId(UserPrincipal principal) {
        return principal != null ? principal.accountId() : null;
    }
}

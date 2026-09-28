package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.NotificationDto;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, maxAge = 3600)
public class PublicNotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notificationService.getNotificationsForCustomer(
                principal.role() == AccountRole.GUEST ? principal.identifier() : null,
                null,
                principal.accountId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        List<NotificationDto> own = notificationService.getNotificationsForCustomer(
                principal.role() == AccountRole.GUEST ? principal.identifier() : null,
                null,
                principal.accountId());
        if (own.stream().noneMatch(notification -> notification.getId().equals(id))) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        notificationService.markAllAsRead(
                principal.role() == AccountRole.GUEST ? principal.identifier() : null,
                null,
                principal.accountId());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc"));
    }
}

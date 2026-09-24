package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.NotificationDto;
import com.dulichso.bookingapi.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "accountId", required = false) Long accountId) {
        return ResponseEntity.ok(notificationService.getNotificationsForCustomer(email, phone, accountId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable("id") Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead(@RequestBody(required = false) Map<String, Object> body) {
        String email = body != null && body.get("email") != null ? String.valueOf(body.get("email")) : null;
        String phone = body != null && body.get("phone") != null ? String.valueOf(body.get("phone")) : null;
        Long accountId = null;
        if (body != null && body.get("accountId") instanceof Number) {
            accountId = ((Number) body.get("accountId")).longValue();
        }
        notificationService.markAllAsRead(email, phone, accountId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc"));
    }
}

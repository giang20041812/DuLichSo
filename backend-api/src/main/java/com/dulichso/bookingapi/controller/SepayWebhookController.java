package com.dulichso.bookingapi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.RequestMapping;
import org.springframework.web.bind.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
@RequestMapping("/api/v1/webhooks/sepay")
public class SepayWebhookController {

    @PostMapping
    public ResponseEntity<String> handleSepayWebhook(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody String payload) {
        
        // TODO: Xác thực authorizationHeader với SEPAY_WEBHOOK_SECRET
        // TODO: Parse payload lấy thông tin giao dịch (Mã tham chiếu, Số tiền)
        // TODO: Đảm bảo tính Idempotent (kiểm tra giao dịch đã xử lý chưa)
        // TODO: Cập nhật trạng thái Booking và lưu Transaction

        return ResponseEntity.ok("Webhook received");
    }
}

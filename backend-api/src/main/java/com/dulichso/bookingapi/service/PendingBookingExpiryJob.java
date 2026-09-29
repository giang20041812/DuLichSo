package com.dulichso.bookingapi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * UC-NCC-08 luồng phụ 2 (BOOK-BR-11/12): mỗi phút chuyển các đơn NCC không phản hồi trong 120 phút (theo khung giờ xử lý
 * của Homestay) sang Hết hạn và trả lại phòng đã giữ. Tắt bằng {@code ncc.booking-expiry.enabled=false}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ncc.booking-expiry.enabled", havingValue = "true", matchIfMissing = true)
public class PendingBookingExpiryJob {
    private final PartnerBookingService bookings;

    @Scheduled(fixedDelayString = "${ncc.booking-expiry.delay-ms:60000}", initialDelayString = "${ncc.booking-expiry.initial-delay-ms:30000}")
    public void run() {
        try {
            int expired = bookings.expireOverdue();
            if (expired > 0) log.info("Đã chuyển {} đơn quá hạn phản hồi sang Hết hạn", expired);
        } catch (RuntimeException ex) {
            log.warn("Không xử lý được đơn quá hạn phản hồi: {}", ex.getMessage());
        }
    }
}

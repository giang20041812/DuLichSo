package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.security.SimpleRateLimiter;
import com.dulichso.bookingapi.service.GeocodingService;
import com.dulichso.bookingapi.service.GeocodingService.GeocodeResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Duration;

/** FR-NCC-01: gợi ý tọa độ khi NCC nhập địa chỉ Homestay. NCC vẫn sửa tay được nếu kết quả chưa đúng. */
@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/partner/geocode")
public class PartnerGeocodeController {
    private final GeocodingService geocoding;
    private final SimpleRateLimiter rateLimiter;

    @GetMapping
    public GeocodeResult geocode(@RequestParam String address, HttpServletRequest request) {
        if (address == null || address.isBlank() || address.trim().length() < 5 || address.length() > 500)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Địa chỉ phải có từ 5 đến 500 ký tự.");
        rateLimiter.check(request, "partner-geocode", 30, Duration.ofMinutes(10));
        return geocoding.geocode(address).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Không tìm thấy tọa độ cho địa chỉ này. Hãy ghi rõ xã/huyện/tỉnh hoặc nhập tọa độ thủ công."));
    }
}

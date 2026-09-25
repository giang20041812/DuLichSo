package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.ProviderApplicationDtos.*;
import com.dulichso.bookingapi.security.SimpleRateLimiter;
import com.dulichso.bookingapi.service.ProviderApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;

/**
 * UC-NCC-08 (FR-NCC-24): NCC tự đăng ký, hồ sơ lưu ở provider_application trạng thái PENDING.
 * Duyệt/từ chối hồ sơ (FR-AD-03) thuộc module Admin — xem docs/ncc-handoff.md.
 */
@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/auth/provider")
public class ProviderApplicationController {
    private final ProviderApplicationService service;
    private final SimpleRateLimiter rateLimiter;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResult register(@Valid @RequestBody RegisterInput input, HttpServletRequest request) {
        rateLimiter.check(request, "provider-register", 5, Duration.ofHours(1));
        return service.register(input);
    }
}

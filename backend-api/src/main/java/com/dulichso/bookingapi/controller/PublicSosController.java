package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminSosDtos.PublicSosSubmitRequest;
import com.dulichso.bookingapi.dto.admin.AdminSosDtos.PublicSosSubmitResponse;
import com.dulichso.bookingapi.service.AdminSosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public SOS endpoint — không cần đăng nhập (tình huống khẩn cấp).
 * /api/public/** đã được SecurityConfig.permitAll().
 */
@RestController
@RequestMapping("/api/public/sos")
public class PublicSosController {

    private final AdminSosService adminSosService;

    public PublicSosController(AdminSosService adminSosService) {
        this.adminSosService = adminSosService;
    }

    /**
     * POST /api/public/sos
     * Du khách gửi yêu cầu SOS/cứu hộ khẩn cấp.
     * Không cần đăng nhập — dùng trong mọi tình huống nguy hiểm.
     */
    @PostMapping
    public ResponseEntity<PublicSosSubmitResponse> submitSos(
            @Valid @RequestBody PublicSosSubmitRequest request) {
        PublicSosSubmitResponse response = adminSosService.submitPublicSos(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerAccountDtos.ChangePasswordRequest;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.PartnerAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/partner/account")
public class PartnerAccountController {
    private final PartnerAccountService service;

    @PatchMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(principal.accountId(), request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công. Vui lòng đăng nhập lại."));
    }

}

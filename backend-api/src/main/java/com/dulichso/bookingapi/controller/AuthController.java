package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtUtils jwtUtils;

    public AuthController(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/google/login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        // TODO: Xác thực request.getIdToken() với thư viện Google IdTokenVerifier
        // TODO: Nếu hợp lệ, lấy email/name từ token. Kiểm tra User trong DB.
        // TODO: Nếu User chưa tồn tại -> tạo mới (ROLE_GUEST).
        // TODO: Sinh ra JWT Token của hệ thống (dùng JwtUtils) và trả về cho Frontend.

        String systemJwtToken = jwtUtils.generateToken("mock_email@gmail.com", "ROLE_GUEST");
        return ResponseEntity.ok(new AuthResponse(systemJwtToken));
    }

    // Các class DTO tạm thời
    public static class GoogleLoginRequest {
        private String idToken;
        public String getIdToken() { return idToken; }
        public void setIdToken(String idToken) { this.idToken = idToken; }
    }

    public static class AuthResponse {
        private String token;
        public AuthResponse(String token) { this.token = token; }
        public String getToken() { return token; }
    }
}

package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.auth.PortalAuthDtos.*;
import com.dulichso.bookingapi.security.JwtUtils;
import com.dulichso.bookingapi.service.AccountAuthService;
import com.dulichso.bookingapi.service.AccountAuthService.AccountInactiveException;
import com.dulichso.bookingapi.service.AccountAuthService.BadCredentialsException;
import com.dulichso.bookingapi.service.AccountAuthService.ProviderSuspendedException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtUtils jwtUtils;
    private final AccountAuthService accountAuthService;

    public AuthController(JwtUtils jwtUtils, AccountAuthService accountAuthService) {
        this.jwtUtils = jwtUtils;
        this.accountAuthService = accountAuthService;
    }

    /**
     * UC-08: Đăng nhập Cổng Quản Trị dành cho Admin và NCC (Provider)
     */
    @PostMapping("/portal/login")
    public ResponseEntity<?> portalLogin(@Valid @RequestBody PortalLoginRequest request) {
        try {
            PortalLoginResponse response = accountAuthService.login(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    AuthErrorResponse.builder()
                            .status(HttpStatus.UNAUTHORIZED.value())
                            .errorCode("AUTH_INVALID_CREDENTIALS")
                            .message(ex.getMessage())
                            .build()
            );
        } catch (AccountInactiveException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    AuthErrorResponse.builder()
                            .status(HttpStatus.FORBIDDEN.value())
                            .errorCode("ACCOUNT_INACTIVE")
                            .message(ex.getMessage())
                            .build()
            );
        } catch (ProviderSuspendedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    AuthErrorResponse.builder()
                            .status(HttpStatus.FORBIDDEN.value())
                            .errorCode("PROVIDER_SUSPENDED")
                            .message(ex.getMessage())
                            .build()
            );
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    AuthErrorResponse.builder()
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .errorCode("INTERNAL_SERVER_ERROR")
                            .message(ex.getMessage() != null ? ex.getMessage() : "Lỗi hệ thống máy chủ nội bộ. Vui lòng thử lại sau.")
                            .build()
            );
        }
    }

    @PostMapping("/google/login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
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

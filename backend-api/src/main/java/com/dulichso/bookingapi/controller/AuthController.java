package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.auth.PortalAuthDtos.*;
import com.dulichso.bookingapi.security.JwtUtils;
import com.dulichso.bookingapi.service.AccountAuthService;
import com.dulichso.bookingapi.service.AccountAuthService.AccountInactiveException;
import com.dulichso.bookingapi.service.AccountAuthService.BadCredentialsException;
import com.dulichso.bookingapi.service.AccountAuthService.ProviderSuspendedException;
import com.dulichso.bookingapi.service.GoogleTokenVerifier;
import com.dulichso.bookingapi.service.GoogleTokenVerifier.GoogleProfile;
import com.dulichso.bookingapi.service.GoogleTokenVerifier.InvalidGoogleTokenException;
import com.dulichso.bookingapi.service.TravelerAuthService;
import com.dulichso.bookingapi.service.TravelerAuthService.DuplicateAccountException;
import com.dulichso.bookingapi.service.TravelerAuthService.InvalidRegistrationException;
import com.dulichso.bookingapi.service.TravelerAuthService.InvalidTravelerCredentialsException;
import com.dulichso.bookingapi.service.TravelerAuthService.TravelerInactiveException;
import com.dulichso.bookingapi.service.TravelerAuthService.TravelerSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtUtils jwtUtils;
    private final AccountAuthService accountAuthService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final TravelerAuthService travelerAuthService;

    public AuthController(JwtUtils jwtUtils, AccountAuthService accountAuthService,
                          GoogleTokenVerifier googleTokenVerifier, TravelerAuthService travelerAuthService) {
        this.travelerAuthService = travelerAuthService;
        this.jwtUtils = jwtUtils;
        this.accountAuthService = accountAuthService;
        this.googleTokenVerifier = googleTokenVerifier;
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

    /**
     * Đăng nhập khách du lịch bằng Google: xác minh ID token phía server rồi cấp JWT hệ thống.
     */
    @PostMapping("/google/login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            GoogleProfile profile = googleTokenVerifier.verify(request.getIdToken());
            return ResponseEntity.ok(toResponse(travelerAuthService.loginWithGoogle(profile)));
        } catch (TravelerInactiveException ex) {
            return error(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", ex.getMessage());
        } catch (InvalidGoogleTokenException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    AuthErrorResponse.builder()
                            .status(HttpStatus.UNAUTHORIZED.value())
                            .errorCode("GOOGLE_TOKEN_INVALID")
                            .message(ex.getMessage())
                            .build()
            );
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    AuthErrorResponse.builder()
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .errorCode("GOOGLE_LOGIN_FAILED")
                            .message("Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại sau.")
                            .build()
            );
        }
    }

    /** Đăng ký khách du lịch bằng email + mật khẩu. */
    @PostMapping("/traveler/register")
    public ResponseEntity<?> travelerRegister(@RequestBody TravelerRegisterRequest request) {
        try {
            TravelerSession session = travelerAuthService.register(
                    request.getFullName(), request.getEmail(), request.getPhone(), request.getPassword());
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(session));
        } catch (InvalidRegistrationException ex) {
            return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage());
        } catch (DuplicateAccountException ex) {
            return error(HttpStatus.CONFLICT, "ACCOUNT_EXISTS", ex.getMessage());
        }
    }

    @PostMapping("/traveler/login")
    public ResponseEntity<?> travelerLogin(@RequestBody TravelerLoginRequest request) {
        try {
            return ResponseEntity.ok(toResponse(travelerAuthService.login(request.getIdentifier(), request.getPassword())));
        } catch (InvalidTravelerCredentialsException ex) {
            return error(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", ex.getMessage());
        } catch (TravelerInactiveException ex) {
            return error(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", ex.getMessage());
        }
    }

    private static AuthResponse toResponse(TravelerSession s) {
        return new AuthResponse(s.token(), s.email(), s.fullName(), s.picture());
    }

    private static ResponseEntity<AuthErrorResponse> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(
                AuthErrorResponse.builder().status(status.value()).errorCode(code).message(message).build());
    }

    public static class TravelerRegisterRequest {
        private String fullName;
        private String email;
        private String phone;
        private String password;
        public String getFullName() { return fullName; }
        public void setFullName(String v) { this.fullName = v; }
        public String getEmail() { return email; }
        public void setEmail(String v) { this.email = v; }
        public String getPhone() { return phone; }
        public void setPhone(String v) { this.phone = v; }
        public String getPassword() { return password; }
        public void setPassword(String v) { this.password = v; }
    }

    public static class TravelerLoginRequest {
        private String identifier;
        private String password;
        public String getIdentifier() { return identifier; }
        public void setIdentifier(String v) { this.identifier = v; }
        public String getPassword() { return password; }
        public void setPassword(String v) { this.password = v; }
    }

    public static class GoogleLoginRequest {
        private String idToken;
        public String getIdToken() { return idToken; }
        public void setIdToken(String idToken) { this.idToken = idToken; }
    }

    public static class AuthResponse {
        private final String token;
        private final String email;
        private final String fullName;
        private final String picture;

        public AuthResponse(String token, String email, String fullName, String picture) {
            this.token = token;
            this.email = email;
            this.fullName = fullName;
            this.picture = picture;
        }

        public String getToken() { return token; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public String getPicture() { return picture; }
    }
}


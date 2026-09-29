package com.dulichso.bookingapi.dto.auth;

import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.dto.FieldErrorDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class PortalAuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PortalLoginRequest {
        @NotBlank(message = "Email hoặc Số điện thoại là bắt buộc")
        private String identifier;

        @NotBlank(message = "Mật khẩu là bắt buộc")
        private String password;

        private boolean simulateError500;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProviderSummaryDto {
        private Long id;
        private String name;
        private ProviderStatus status;
        private String contactName;
        private String contactPhone;
        private String contactEmail;
        private String address;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PortalLoginResponse {
        private String token;
        @Builder.Default
        private String tokenType = "Bearer";
        private Long accountId;
        private String email;
        private String phone;
        private String fullName;
        private AccountRole role;
        /** Cấp quản trị 1..3 (chỉ ADMIN). Giao diện dùng để ẩn/hiện chức năng; quyền thật được kiểm ở máy chủ. */
        private Integer adminLevel;
        private AccountStatus status;
        private ProviderSummaryDto provider;
        private String redirectUrl;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthErrorResponse {
        private int status;
        private String errorCode;
        private String message;
        /** Các trường nhập bị lỗi (vd trùng email / số điện thoại khi đăng ký); null khi lỗi không gắn với trường cụ thể. */
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private List<FieldErrorDto> fieldErrors;
        @Builder.Default
        private LocalDateTime timestamp = LocalDateTime.now();
    }
}

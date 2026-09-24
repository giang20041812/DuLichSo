package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class AdminProviderDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProviderSummaryDto {
        private Long id;
        private String name;
        private String contactName;
        private String contactPhone;
        private String contactEmail;
        private String address;
        private String note;
        private ProviderStatus status;
        private long placeCount;
        private long accountCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateProviderWithAccountRequest {
        @NotBlank(message = "Tên cơ sở/đối tác không được để trống")
        private String name;

        private String contactName;
        private String contactPhone;
        private String contactEmail;
        private String address;
        private String note;

        // Tài khoản đăng nhập đầu tiên cho NCC
        @NotBlank(message = "Email tài khoản NCC không được để trống")
        @Email(message = "Email tài khoản không đúng định dạng")
        private String accountEmail;

        private String accountPhone;

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
        private String accountPassword;

        @NotBlank(message = "Họ tên người đại diện không được để trống")
        private String accountFullName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProviderRequest {
        @NotBlank(message = "Tên cơ sở/đối tác không được để trống")
        private String name;
        private String contactName;
        private String contactPhone;
        private String contactEmail;
        private String address;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProviderStatusRequest {
        @NotNull(message = "Trạng thái không được để trống")
        private ProviderStatus status;
        private String reason;
    }

    /** Thông tin đăng nhập của tài khoản NCC. Không bao giờ chứa mật khẩu (chỉ lưu băm BCrypt). */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProviderAccountDto {
        private Long id;
        private String email;
        private String phone;
        private String fullName;
        private String status;
        private LocalDateTime lastLoginAt;
    }
}

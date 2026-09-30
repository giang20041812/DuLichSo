package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** UC-NCC-08 (FR-NCC-24): NCC tự đăng ký tài khoản. */
public final class ProviderApplicationDtos {
    private ProviderApplicationDtos() {}

    public record RegisterInput(@NotBlank @Size(max = 255) String businessName,
                                @NotBlank @Size(max = 255) String contactName,
                                @NotBlank @Pattern(regexp = "^(0|\\+84)[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng (VD: 0912345678 hoặc +84912345678).") String contactPhone,
                                @Email @Size(max = 255) String contactEmail,
                                @NotBlank @Size(min = 8, max = 72) String password,
                                @NotBlank @Size(max = 500) String address,
                                @NotBlank @Size(max = 64) String businessLicenseNo,
                                @Size(max = 5000) String description) {}

    public record RegisterResult(Long applicationId, ProviderApplicationStatus status, String message) {}

    /** UC-NCC-01 "Xem trạng thái": chỉ người biết đúng mã hồ sơ và số điện thoại đăng ký mới xem được. */
    public record StatusInput(@jakarta.validation.constraints.NotNull Long applicationId,
                              @NotBlank @Pattern(regexp = "[+0-9() .-]{8,20}", message = "không hợp lệ") String contactPhone) {}

    public record StatusResult(Long applicationId, String businessName, ProviderApplicationStatus status, String statusLabel,
                               String reviewNote, java.time.LocalDateTime createdAt, java.time.LocalDateTime reviewedAt) {}
}

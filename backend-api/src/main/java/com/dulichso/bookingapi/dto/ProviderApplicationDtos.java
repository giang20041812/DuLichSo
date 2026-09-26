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
                                @NotBlank @Pattern(regexp = "[+0-9() .-]{8,20}", message = "không hợp lệ") String contactPhone,
                                @Email @Size(max = 255) String contactEmail,
                                @NotBlank @Size(min = 8, max = 72) String password,
                                @NotBlank @Size(max = 500) String address,
                                @Size(max = 64) String businessLicenseNo,
                                @Size(max = 5000) String description) {}

    public record RegisterResult(Long applicationId, ProviderApplicationStatus status, String message) {}
}

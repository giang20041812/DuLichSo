package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.EmergencyContactType;
import com.dulichso.bookingapi.entity.enums.SosRequestStatus;
import com.dulichso.bookingapi.entity.enums.SosRequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs cho Admin SOS module.
 * Tất cả type/interface dùng chung chỉ định nghĩa ở đây — không viết lại ở nơi khác.
 */
public class AdminSosDtos {

    // ─────────────────────────────────────────────
    // EmergencyContact DTOs
    // ─────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class EmergencyContactDto {
        private Long id;
        private Long regionId;
        private String regionName;
        private EmergencyContactType type;
        private String name;
        private String phone;
        private String address;
        private Boolean isActive;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateEmergencyContactRequest {
        private Long regionId;

        @NotNull(message = "Loại đầu mối liên hệ là bắt buộc")
        private EmergencyContactType type;

        @NotBlank(message = "Tên đầu mối liên hệ là bắt buộc")
        @Size(max = 255)
        private String name;

        @NotBlank(message = "Số điện thoại là bắt buộc")
        @Size(max = 32)
        private String phone;

        @Size(max = 500)
        private String address;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateEmergencyContactRequest {
        private Long regionId;
        private EmergencyContactType type;

        @Size(max = 255)
        private String name;

        @Size(max = 32)
        private String phone;

        @Size(max = 500)
        private String address;

        private Boolean isActive;
    }

    // ─────────────────────────────────────────────
    // SosRequest DTOs
    // ─────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SosRequestDto {
        private Long id;
        private String requesterName;
        private String requesterPhone;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private SosRequestType type;
        private String description;
        private SosRequestStatus status;
        private EmergencyContactDto assignedContact;
        private String dispatchNote;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SosRequestListResponse {
        private List<SosRequestDto> items;
        private long total;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DispatchSosRequest {
        @NotNull(message = "Đầu mối liên hệ khẩn cấp là bắt buộc")
        private Long assignedContactId;

        @Size(max = 500)
        private String note;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateSosStatusRequest {
        @NotNull(message = "Trạng thái mới là bắt buộc")
        private SosRequestStatus status;

        @Size(max = 500)
        private String note;
    }

    // ─────────────────────────────────────────────
    // Public SOS (submit from guest)
    // ─────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PublicSosSubmitRequest {
        @NotBlank(message = "Tên người yêu cầu là bắt buộc")
        @Size(max = 255)
        private String requesterName;

        @NotBlank(message = "Số điện thoại là bắt buộc")
        @Size(max = 32)
        private String requesterPhone;

        private BigDecimal latitude;
        private BigDecimal longitude;

        @NotNull(message = "Loại tình huống khẩn cấp là bắt buộc")
        private SosRequestType type;

        @Size(max = 2000)
        private String description;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PublicSosSubmitResponse {
        private Long sosRequestId;
        private String message;
        private LocalDateTime createdAt;
    }
}

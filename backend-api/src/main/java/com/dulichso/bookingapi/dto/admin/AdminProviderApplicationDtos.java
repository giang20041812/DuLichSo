package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;

import java.time.LocalDateTime;
import java.util.List;

/** FR-AD-16: hồ sơ đăng ký NCC để Admin thẩm định. Không bao giờ trả mật khẩu/băm mật khẩu. */
public final class AdminProviderApplicationDtos {
    private AdminProviderApplicationDtos() {}

    public record ApplicationSummaryDto(Long id, String businessName, String contactName, String contactPhone, String contactEmail,
                                        String address, String businessLicenseNo, ProviderApplicationStatus status,
                                        LocalDateTime createdAt, LocalDateTime reviewedAt, String reviewedByName, String reviewNote,
                                        Long providerId) {}

    /**
     * Chi tiết hồ sơ. {@code phoneTaken}/{@code emailTaken}: SĐT/email đã thuộc một tài khoản khác — nếu true thì hồ sơ
     * không thể duyệt (chỉ có thể từ chối), Admin cần biết trước khi thao tác.
     */
    public record ApplicationDetailDto(ApplicationSummaryDto summary, String description, boolean phoneTaken, boolean emailTaken) {}

    public record PendingApplicationCountDto(long pending) {}

    /** Lỗi khi xử lý 1 hồ sơ trong yêu cầu duyệt/từ chối hàng loạt (vd: hồ sơ đã xử lý, SĐT/email đã thuộc tài khoản khác). */
    public record BulkFailureDto(Long id, String message) {}

    /** Kết quả duyệt/từ chối hàng loạt: mỗi hồ sơ xử lý độc lập, hồ sơ lỗi không chặn các hồ sơ còn lại. */
    public record BulkActionResultDto(List<Long> succeededIds, List<BulkFailureDto> failed) {}
}

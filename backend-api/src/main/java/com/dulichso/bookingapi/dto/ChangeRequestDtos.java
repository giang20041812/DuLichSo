package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** DTO yêu cầu thay đổi Homestay/phòng/giá của NCC (dùng cho cả phía NCC và Admin). */
public final class ChangeRequestDtos {
    private ChangeRequestDtos() {}

    /** Một trường có thay đổi: giá trị cũ và giá trị mới đã được chuẩn hóa thành chuỗi hiển thị. */
    public record FieldChangeDto(String field, String label, String before, String after) {}

    /** Phản hồi 202 khi thay đổi được gửi chờ duyệt thay vì ghi trực tiếp. */
    public record SubmittedDto(Long changeRequestId, ChangeRequestStatus status, String message) {}

    public record ChangeRequestSummaryDto(Long id, ChangeTargetType targetType, ChangeOperation operation, ChangeRequestStatus status,
            Long placeId, String placeName, Long providerId, String providerName, Long targetId, Long roomTypeId, String targetName,
            String changeSummary, String submittedByName, LocalDateTime submittedAt, String reviewedByName, LocalDateTime reviewedAt,
            String reviewNote) {}

    /**
     * Chi tiết để Admin so sánh nội dung cũ và mới. {@code stale} = dữ liệu chính thức đã thay đổi kể từ lúc NCC gửi yêu cầu
     * (nội dung cũ hiển thị có thể không còn khớp).
     */
    public record ChangeRequestDetailDto(ChangeRequestSummaryDto summary, Map<String, Object> before, Map<String, Object> after,
            List<FieldChangeDto> changes, boolean stale) {}

    public record ApproveInput(@Size(max = 500) String note) {}

    public record RejectInput(@NotBlank(message = "Vui lòng nhập lý do từ chối.") @Size(max = 500) String reason) {}

    public record PendingCountDto(long pending) {}
}

package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** DTO yêu cầu thay đổi Homestay/phòng/giá của NCC (dùng cho cả phía NCC và Admin). */
public final class ChangeRequestDtos {
    private ChangeRequestDtos() {}

    /** Một trường có thay đổi: giá trị cũ và giá trị mới đã được chuẩn hóa thành chuỗi hiển thị. */
    public record FieldChangeDto(String field, String label, String before, String after) {}

    /**
     * Một trường của đối tượng trong yêu cầu (kể cả trường không đổi) để Admin xem đầy đủ nội dung:
     * {@code changed} = giá trị mới khác giá trị hiện tại.
     */
    public record FieldDiffDto(String field, String label, String before, String after, boolean changed) {}

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
            List<FieldChangeDto> changes, List<FieldDiffDto> fields, ChangeContextDto context, boolean stale) {}

    /** Thông tin nhà cung cấp gửi yêu cầu (theo hồ sơ đối tác). {@code status}: ProviderStatus. */
    public record ProviderInfoDto(Long id, String name, String contactName, String contactPhone, String contactEmail,
                                  String address, String status) {}

    /** Homestay của yêu cầu. {@code visibility}/{@code verification}: PlaceVisibility / PlaceVerificationStatus. */
    public record HomestayInfoDto(Long id, String name, String address, String regionName, String visibility,
                                  String verification, long roomTypeCount) {}

    /** Loại phòng hiện tại mà yêu cầu nhắm tới (sửa / xóa loại phòng, hoặc giá theo mùa của loại phòng). */
    public record RoomInfoDto(Long id, String name, Integer totalRoomCount, Integer maxOccupancy, BigDecimal basePrice,
                              BigDecimal weekendPrice, String status) {}

    /** Ngữ cảnh để Admin xét duyệt: ai gửi, cho Homestay nào, loại phòng nào. {@code room} null khi không liên quan loại phòng. */
    public record ChangeContextDto(ProviderInfoDto provider, HomestayInfoDto homestay, RoomInfoDto room) {}

    public record ApproveInput(@Size(max = 500) String note) {}

    public record RejectInput(@NotBlank(message = "Vui lòng nhập lý do từ chối.") @Size(max = 500) String reason) {}

    public record PendingCountDto(long pending) {}
}

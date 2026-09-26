package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/**
 * FR-AD-15: đánh giá để Admin kiểm duyệt. Chỉ trả ngữ cảnh tối thiểu cần để xử lý đúng người đúng việc
 * (tên khách, mã booking, Homestay, NCC); không trả số điện thoại/email của khách.
 */
public final class AdminReviewDtos {
    private AdminReviewDtos() {}

    public enum ModerationAction {
        /** Giữ nguyên: xem xét xong, không vi phạm — chỉ ghi nhận quyết định. */
        KEEP,
        /** Ẩn khỏi công khai (có thể khôi phục). */
        HIDE,
        /** Gỡ vì vi phạm tiêu chuẩn (không khôi phục). */
        REMOVE,
        /** Hiển thị lại đánh giá đang bị ẩn. */
        RESTORE
    }

    public record ReviewDto(Long id, Long placeId, String placeName, Long providerId, String providerName, Long bookingId,
                            String bookingCode, String guestName, int rating, String content, List<String> images,
                            ReviewStatus status, LocalDateTime createdAt, String providerReply, LocalDateTime providerReplyAt,
                            String moderatedByName, LocalDateTime moderatedAt, String moderationReason) {}

    public record ModerateInput(@NotNull(message = "Vui lòng chọn cách xử lý") ModerationAction action,
                                @Size(max = 500, message = "Lý do tối đa 500 ký tự") String reason) {}
}

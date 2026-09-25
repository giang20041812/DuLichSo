package com.dulichso.bookingapi.dto.partner;

import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/** UC-NCC-10: nhà cung cấp xem và phản hồi đánh giá của khách về Homestay mình. */
public final class PartnerReviewDtos {
    private PartnerReviewDtos() {}

    public record ReviewDto(Long id, Long placeId, String placeName, String bookingCode, String guestName,
                            Byte rating, String content, ReviewStatus status, LocalDateTime createdAt,
                            String providerReply, LocalDateTime providerReplyAt) {}

    public record ReplyInput(@NotBlank @Size(max = 2000) String reply) {}
}

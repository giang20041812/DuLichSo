package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminReviewDtos.ModerationAction;
import com.dulichso.bookingapi.dto.admin.AdminReviewDtos.ReviewDto;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.Review;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/** FR-AD-15: kiểm duyệt đánh giá. */
@ExtendWith(MockitoExtension.class)
class AdminReviewServiceTest {
    @Mock ReviewRepository reviews;
    @Mock AccountRepository accounts;
    @Mock AuditLogService auditLogService;

    AdminReviewService service;
    Place place;
    Review review;

    @BeforeEach
    void setup() {
        service = new AdminReviewService(reviews, accounts, auditLogService);
        Provider provider = Provider.builder().id(12L).name("NCC A").build();
        place = Place.builder().id(21L).name("Homestay A").provider(provider).build();
        place.setRatingCount(3);
        place.setRatingAvg(new BigDecimal("3.00"));
        Booking booking = Booking.builder().id(8L).bookingCode("BK-1").guestName("Vũ Giang").guestPhone("0911223344").build();
        review = Review.builder().id(5L).place(place).booking(booking).rating((byte) 1).content("Nội dung xúc phạm").build();
        lenient().when(reviews.findByIdForUpdate(5L)).thenReturn(Optional.of(review));
        lenient().when(reviews.findById(5L)).thenReturn(Optional.of(review));
        // Sau khi ẩn còn 2 đánh giá hiển thị, điểm trung bình 4.5
        lenient().when(reviews.visibleRatingStats(21L, ReviewStatus.VISIBLE)).thenReturn(Collections.singletonList(new Object[]{2L, 4.5}));
    }

    @Test
    @DisplayName("Ẩn: bắt buộc lý do, đổi trạng thái, ghi người xử lý và tính lại điểm Homestay")
    void hide_updatesStatusAndRating() {
        assertThrows(IllegalArgumentException.class, () -> service.moderate(5L, 1L, ModerationAction.HIDE, "  "));
        assertEquals(ReviewStatus.VISIBLE, review.getStatus());

        ReviewDto dto = service.moderate(5L, 1L, ModerationAction.HIDE, "Ngôn từ xúc phạm");

        assertEquals(ReviewStatus.HIDDEN, review.getStatus());
        assertEquals(1L, review.getModeratedBy());
        assertNotNull(review.getModeratedAt());
        assertEquals("Ngôn từ xúc phạm", review.getModerationReason());
        assertEquals(2, place.getRatingCount());
        assertEquals(0, new BigDecimal("4.50").compareTo(place.getRatingAvg()));
        assertEquals(ReviewStatus.HIDDEN, dto.status());
        verify(auditLogService).record(eq(1L), eq("REVIEW_HIDDEN"), eq("Review"), eq(5L), eq("Ngôn từ xúc phạm"), anyMap(), anyMap());
    }

    @Test
    @DisplayName("Không trả số điện thoại của khách trong dữ liệu kiểm duyệt")
    void dto_excludesGuestContact() {
        ReviewDto dto = service.detail(5L);

        assertEquals("Vũ Giang", dto.guestName());
        assertEquals("BK-1", dto.bookingCode());
        assertFalse(dto.toString().contains("0911223344"));
    }

    @Test
    @DisplayName("Gỡ: chuyển REMOVED, sau đó không xử lý lại được")
    void remove_isFinal() {
        service.moderate(5L, 1L, ModerationAction.REMOVE, "Quảng cáo trái phép");

        assertEquals(ReviewStatus.REMOVED, review.getStatus());
        assertThrows(IllegalStateException.class, () -> service.moderate(5L, 1L, ModerationAction.RESTORE, "Nhầm"));
        assertThrows(IllegalStateException.class, () -> service.moderate(5L, 1L, ModerationAction.KEEP, null));
    }

    @Test
    @DisplayName("Khôi phục: chỉ áp dụng cho đánh giá đang bị ẩn")
    void restore_onlyFromHidden() {
        assertThrows(IllegalStateException.class, () -> service.moderate(5L, 1L, ModerationAction.RESTORE, "Nhầm"));

        review.setStatus(ReviewStatus.HIDDEN);
        service.moderate(5L, 1L, ModerationAction.RESTORE, "Đã kiểm tra lại, không vi phạm");

        assertEquals(ReviewStatus.VISIBLE, review.getStatus());
        verify(auditLogService).record(eq(1L), eq("REVIEW_RESTORED"), eq("Review"), eq(5L), any(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("Giữ nguyên: không đổi trạng thái/điểm nhưng ghi nhận quyết định")
    void keep_recordsDecisionOnly() {
        service.moderate(5L, 1L, ModerationAction.KEEP, "Không vi phạm tiêu chuẩn");

        assertEquals(ReviewStatus.VISIBLE, review.getStatus());
        assertEquals(3, place.getRatingCount());
        assertEquals("Không vi phạm tiêu chuẩn", review.getModerationReason());
        verify(reviews, never()).visibleRatingStats(any(), any());
        verify(auditLogService).record(eq(1L), eq("REVIEW_KEPT"), eq("Review"), eq(5L), any(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("Ẩn đánh giá cuối cùng: Homestay về 0 đánh giá, điểm 0")
    void hideLastVisible_resetsRating() {
        when(reviews.visibleRatingStats(21L, ReviewStatus.VISIBLE)).thenReturn(Collections.singletonList(new Object[]{0L, null}));

        service.moderate(5L, 1L, ModerationAction.HIDE, "Vi phạm");

        assertEquals(0, place.getRatingCount());
        assertEquals(0, BigDecimal.ZERO.compareTo(place.getRatingAvg()));
    }

    @Test
    @DisplayName("Thiếu Admin thao tác, không tìm thấy đánh giá, bộ lọc sai đều bị từ chối")
    void validation() {
        assertThrows(IllegalStateException.class, () -> service.moderate(5L, null, ModerationAction.KEEP, null));
        when(reviews.findByIdForUpdate(404L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.moderate(404L, 1L, ModerationAction.KEEP, null));
        assertThrows(IllegalArgumentException.class, () -> service.search(null, null, null, 9, null, null, null, 0, 20));
        assertThrows(IllegalArgumentException.class, () -> service.search(null, null, null, null, null,
                LocalDate.of(2026, 9, 10), LocalDate.of(2026, 9, 1), 0, 20));
        verify(auditLogService, never()).record(any(), any(), any(), any(), isNull(), any(), any());
    }

    @Test
    @DisplayName("Tên người xử lý được hiển thị trong kết quả")
    void moderatorNameShown() {
        review.setModeratedBy(1L);
        when(accounts.findAllById(any())).thenReturn(List.of(Account.builder().id(1L).fullName("Admin A").build()));

        assertEquals("Admin A", service.detail(5L).moderatedByName());
    }
}

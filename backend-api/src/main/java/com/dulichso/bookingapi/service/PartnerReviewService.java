package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerReviewDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Review;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class PartnerReviewService {
    private final PartnerHomestayService homestays;
    private final EntityManager em;

    /** Cả đánh giá đang ẩn cũng hiển thị cho chủ nhà (kèm trạng thái) để họ nắm được phản hồi của khách. */
    public List<ReviewDto> list(UserPrincipal principal, Long placeId) {
        Account actor = homestays.actor(principal, false);
        return em.createQuery("select r from Review r join fetch r.place p left join fetch r.booking b "
                        + "where p.provider.id=:provider and (:place is null or p.id=:place) order by r.createdAt desc", Review.class)
                .setParameter("provider", actor.getProvider().getId()).setParameter("place", placeId)
                .getResultStream().map(PartnerReviewService::toDto).toList();
    }

    @Transactional
    public ReviewDto reply(UserPrincipal principal, Long id, ReplyInput input) {
        Account actor = homestays.actor(principal, true);
        Review review = owned(id, actor);
        review.setProviderReply(input.reply().trim());
        review.setProviderReplyAt(LocalDateTime.now());
        review.setProviderReplyBy(actor.getId());
        return toDto(review);
    }

    @Transactional
    public ReviewDto removeReply(UserPrincipal principal, Long id) {
        Review review = owned(id, homestays.actor(principal, true));
        review.setProviderReply(null);
        review.setProviderReplyAt(null);
        review.setProviderReplyBy(null);
        return toDto(review);
    }

    private Review owned(Long id, Account actor) {
        Review review = em.find(Review.class, id);
        if (review == null || !review.getPlace().getProvider().getId().equals(actor.getProvider().getId()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá của Homestay bạn quản lý.");
        return review;
    }

    private static ReviewDto toDto(Review r) {
        return new ReviewDto(r.getId(), r.getPlace().getId(), r.getPlace().getName(),
                r.getBooking() == null ? null : r.getBooking().getBookingCode(),
                r.getBooking() == null ? "Khách du lịch" : r.getBooking().getGuestName(),
                r.getRating(), r.getContent(), r.getStatus(), r.getCreatedAt(), r.getProviderReply(), r.getProviderReplyAt());
    }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerReviewDtos.ReplyInput;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerReviewServiceTest {
    @Mock PartnerHomestayService homestays;
    @Mock EntityManager em;
    PartnerReviewService service;
    final UserPrincipal principal = new UserPrincipal(null, "provider@example.test", AccountRole.PROVIDER, null);
    Review review;

    @BeforeEach void setup() {
        service = new PartnerReviewService(homestays, em);
        Account account = Account.builder().id(7L).provider(Provider.builder().id(12L).build()).build();
        when(homestays.actor(eq(principal), anyBoolean())).thenReturn(account);
        Place place = Place.builder().id(21L).name("Homestay A").provider(Provider.builder().id(12L).build()).build();
        review = Review.builder().id(3L).place(place).rating((byte) 5).content("Tuyệt vời").build();
    }

    @Test void ownerCanReplyAndRemoveReply() {
        when(em.find(Review.class, 3L)).thenReturn(review);
        var result = service.reply(principal, 3L, new ReplyInput("  Cảm ơn bạn!  "));
        assertEquals("Cảm ơn bạn!", result.providerReply());
        assertEquals(7L, review.getProviderReplyBy());
        assertNotNull(review.getProviderReplyAt());
        assertNull(service.removeReply(principal, 3L).providerReply());
    }

    @Test void cannotReplyToReviewOfAnotherProvider() {
        review.getPlace().setProvider(Provider.builder().id(99L).build());
        when(em.find(Review.class, 3L)).thenReturn(review);
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.reply(principal, 3L, new ReplyInput("Chào"))).getStatusCode().value());
        assertNull(review.getProviderReply());
    }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.*;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.*;
import com.dulichso.bookingapi.repository.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerHomestayServiceTest {
    @Mock PartnerHomestayRepository repository;
    @Mock AccountRepository accounts;
    @Mock PlaceContactRepository contacts;
    @Mock PlaceAmenityRepository amenities;
    PartnerHomestayService service;
    // JwtAuthenticationFilter supplies an identifier, not account/provider IDs.
    final UserPrincipal principal = new UserPrincipal(null, "provider@example.test", AccountRole.PROVIDER, null);
    Account account;
    Place place;

    @BeforeEach void setup() {
        service = new PartnerHomestayService(repository, accounts, contacts, amenities);
        Provider provider = Provider.builder().id(12L).name("Nhà cung cấp A").build();
        account = Account.builder().id(7L).role(AccountRole.PROVIDER).provider(provider).build();
        place = Place.builder().id(21L).name("Homestay A").nameNorm("homestay a").description("Mô tả")
                .address("Địa chỉ").provider(provider).category(Category.builder().kind(CategoryKind.HOMESTAY).name("Homestay").build())
                .kind(CategoryKind.HOMESTAY).attributes(new HashMap<>()).build();
    }
    private void authenticate() { when(accounts.findByIdentifier(principal.identifier())).thenReturn(Optional.of(account)); }
    private PartnerHomestayDetailDto input() {
        return PartnerHomestayDetailDto.builder().name("Tên mới").address("Địa chỉ mới").description("Giới thiệu mới")
                .contactPhone("0912345678").contactEmail("host@example.test").amenities(List.of())
                .checkInFrom("15:00").checkOutUntil("11:00").houseRules("Giữ yên tĩnh").surchargeNote("Phụ thu thêm khách")
                .cancellationPolicy("Miễn phí hủy trước 48 giờ").policyName("Linh hoạt")
                .freeCancelCutoffHours(48).refundOnLateCancel(RefundType.NO_REFUND).build();
    }
    @Test void anonymousCannotReadOrWrite() {
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.getHomestayDetail(null, 21L)).getStatusCode().value());
        verifyNoInteractions(repository);
    }
    @Test void jwtWithoutAccountIdCanListOwnedHomestays() {
        authenticate();
        when(repository.findOwned(12L)).thenReturn(List.of(place));
        var result = service.getHomestays(principal, null, null, null);
        assertEquals(1, result.getHomestays().size());
        assertEquals(21L, result.getHomestays().get(0).getId());
        verify(accounts, never()).findById(any());
    }
    @Test void anotherProvidersPlaceCannotBeUpdated() {
        authenticate();
        when(repository.findOwned(99L, 12L, true)).thenReturn(Optional.empty());
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.saveHomestayDetail(principal, 99L, input())).getStatusCode().value());
        verify(repository, never()).persist(any());
        verifyNoInteractions(contacts, amenities);
    }
    @Test void suspendedProviderCannotCreate() {
        authenticate(); account.getProvider().setStatus(ProviderStatus.SUSPENDED);
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.createHomestay(principal, input())).getStatusCode().value());
        verifyNoInteractions(repository);
    }
    @Test void listUsesDatabaseProviderRatherThanStaleTokenProviderAndFilters() {
        authenticate(); account.getProvider().setId(42L);
        when(repository.findOwned(42L)).thenReturn(List.of(place));
        var result = service.getHomestays(principal, "không khớp", null, null);
        assertTrue(result.getHomestays().isEmpty());
        assertEquals(1, result.getStats().getTotalCount());
        verify(repository).findOwned(42L);
    }
    @Test void updatePersistsProfileAndCreatesNewPolicyWithoutChangingOldVersion() {
        authenticate(); when(repository.findOwned(21L, 12L, true)).thenReturn(Optional.of(place));
        CancellationPolicy old = CancellationPolicy.builder().id(10L).version(2).name("Cũ").contentText("Nội dung cũ")
                .freeCancelCutoffHours(24).refundOnLateCancel(RefundType.NO_REFUND).build();
        HomestayProfile profile = HomestayProfile.builder().place(place).placeId(21L).currentPolicy(old).build();
        when(repository.profile(21L)).thenReturn(Optional.of(profile));
        when(repository.nextPolicyVersion(21L)).thenReturn(3);
        var result = service.saveHomestayDetail(principal, 21L, input());
        assertEquals("Tên mới", place.getName());
        assertEquals("15:00", result.getCheckInFrom());
        assertEquals("Giữ yên tĩnh", result.getHouseRules());
        assertEquals(3, result.getPolicyVersion());
        assertEquals(48, result.getFreeCancelCutoffHours());
        assertEquals("Nội dung cũ", old.getContentText());
        assertEquals(2, old.getVersion());
        verify(repository).persist(profile.getCurrentPolicy());
        verify(repository).findOwned(21L, 12L, true);
    }
    @Test void unchangedPolicyDoesNotCreateVersion() {
        authenticate(); when(repository.findOwned(21L, 12L, true)).thenReturn(Optional.of(place));
        var dto = input();
        CancellationPolicy current = CancellationPolicy.builder().version(2).name(dto.getPolicyName()).contentText(dto.getCancellationPolicy())
                .freeCancelCutoffHours(48).refundOnLateCancel(RefundType.NO_REFUND).build();
        when(repository.profile(21L)).thenReturn(Optional.of(HomestayProfile.builder().place(place).currentPolicy(current).build()));
        service.saveHomestayDetail(principal, 21L, dto);
        verify(repository, never()).nextPolicyVersion(anyLong());
        verify(repository, never()).persist(isA(CancellationPolicy.class));
    }
    @Test void createUsesServerIdOwnerAndDraftStatus() {
        authenticate(); when(repository.category()).thenReturn(Optional.of(place.getCategory()));
        doAnswer(call -> { ((Place) call.getArgument(0)).setId(100L); return null; }).when(repository).persist(isA(Place.class));
        var dto = input(); dto.setId(99L); dto.setVisibility(PlaceVisibility.PUBLISHED);
        dto.setCancellationPolicy(""); dto.setPolicyName(""); dto.setFreeCancelCutoffHours(null); dto.setRefundOnLateCancel(null);
        var result = service.createHomestay(principal, dto);
        assertEquals(100L, result.getId());
        assertEquals(PlaceVisibility.DRAFT, result.getVisibility());
        verify(repository).persist(argThat(entity -> entity instanceof Place p && p.getProvider() == account.getProvider() && p.getCreatedBy() == account));
    }
    @Test void invalidCoordinatesFailBeforeWrites() {
        authenticate(); var dto = input(); dto.setLatitude(Double.NaN); dto.setLongitude(104.0);
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.createHomestay(principal, dto)).getStatusCode().value());
        verify(repository, never()).persist(any());
    }
    @Test void incompleteProfileCannotPublish() {
        authenticate(); when(repository.findOwned(21L, 12L, true)).thenReturn(Optional.of(place));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.updateStatus(principal, 21L,
                UpdateStatusRequest.builder().visibility(PlaceVisibility.PUBLISHED).build())).getStatusCode().value());
        assertEquals(PlaceVisibility.DRAFT, place.getVisibility());
    }
    @Test void jsonUsesFrontendBooleanFieldNames() throws Exception {
        var json = new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(PartnerHomestayDetailDto.builder().isReadyToPublish(true).build());
        assertTrue(json.get("isReadyToPublish").asBoolean());
        assertFalse(json.has("readyToPublish"));
    }

    @Test void reviewVideoMustBeAFullTikTokVideoLink() {
        authenticate();
        lenient().when(repository.findOwned(21L, 12L, true)).thenReturn(Optional.of(place));
        for (String bad : List.of("https://vt.tiktok.com/ZSabc/", "https://youtube.com/watch?v=1", "http://www.tiktok.com/@kenh/video/123")) {
            PartnerHomestayDetailDto dto = input();
            dto.setReviewVideoUrl(bad);
            assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.saveHomestayDetail(principal, 21L, dto)).getStatusCode().value(), bad);
        }
        verify(repository, never()).persist(any());
    }
}

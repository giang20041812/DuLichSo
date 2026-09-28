package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.SubmittedDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestayDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestaySummaryDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.UpdateStatusRequest;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.PriceDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.PriceInput;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.RoomDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.RoomInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.PartnerChangeRequestRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Quy trình NCC sửa → tạo yêu cầu chờ duyệt (không ghi dữ liệu đang công khai). */
@ExtendWith(MockitoExtension.class)
class PartnerChangeServiceTest {
    @Mock PartnerHomestayService homestays;
    @Mock PartnerRoomService rooms;
    @Mock PartnerChangeRequestRepository requests;
    @Mock com.dulichso.bookingapi.repository.ProviderRepository providerRepository;

    final UserPrincipal principal = new UserPrincipal(null, "provider@example.test", AccountRole.PROVIDER, null);
    PartnerChangeService service;
    Provider provider;
    Account account;
    Place place;

    @BeforeEach
    void setup() {
        ObjectMapper mapper = new ObjectMapper().findAndRegisterModules().disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        service = new PartnerChangeService(homestays, rooms, requests, providerRepository, mapper);
        provider = Provider.builder().id(12L).name("NCC A").build();
        account = Account.builder().id(7L).fullName("Chủ nhà").role(AccountRole.PROVIDER).provider(provider).build();
        place = Place.builder().id(21L).name("Homestay A").provider(provider).build();
        place.setVisibility(PlaceVisibility.PUBLISHED);
        lenient().when(homestays.actor(principal, true)).thenReturn(account);
        lenient().when(homestays.actor(principal, false)).thenReturn(account);
        lenient().when(homestays.owned(21L, account, false)).thenReturn(place);
        lenient().when(requests.save(any(PartnerChangeRequest.class))).thenAnswer(inv -> {
            PartnerChangeRequest r = inv.getArgument(0);
            r.setId(100L);
            return r;
        });
    }

    private PartnerHomestayDetailDto homestay(String name) {
        return PartnerHomestayDetailDto.builder().id(21L).code("HM-21").name(name).address("Địa chỉ").description("Mô tả")
                .contactPhone("0912345678").amenities(List.of("Wifi")).checkInFrom("14:00").checkOutUntil("12:00").build();
    }

    private PartnerChangeRequest saved() {
        ArgumentCaptor<PartnerChangeRequest> captor = ArgumentCaptor.forClass(PartnerChangeRequest.class);
        verify(requests).save(captor.capture());
        return captor.getValue();
    }

    /**
     * Xác nhận nghiệp vụ (2026-09-28): sửa thông tin Homestay luôn ghi trực tiếp, kể cả khi đã PUBLISHED —
     * không còn tạo yêu cầu chờ Admin duyệt cho trường hợp này (khác với lần đầu xuất bản/chuyển NCC).
     */
    @Test
    @DisplayName("Homestay đang công khai: sửa thông tin ghi trực tiếp, KHÔNG tạo yêu cầu chờ duyệt")
    void publishedHomestay_savesDirectly() {
        PartnerHomestayDetailDto result = homestay("Tên mới");
        when(homestays.saveHomestayDetail(principal, 21L, result)).thenReturn(result);

        var outcome = service.saveHomestay(principal, 21L, result);

        assertFalse(outcome.isPending());
        assertSame(result, outcome.saved());
        verify(requests, never()).save(any());
        verifyNoInteractions(requests);
    }

    @Test
    @DisplayName("Homestay chưa công khai: ghi trực tiếp như trước, không tạo yêu cầu")
    void draftHomestay_savesDirectly() {
        place.setVisibility(PlaceVisibility.DRAFT);
        PartnerHomestayDetailDto result = homestay("Tên mới");
        when(homestays.saveHomestayDetail(principal, 21L, result)).thenReturn(result);

        var outcome = service.saveHomestay(principal, 21L, result);

        assertFalse(outcome.isPending());
        assertSame(result, outcome.saved());
        verify(requests, never()).save(any());
    }

    private RoomDto currentRoom() {
        return new RoomDto(3L, 21L, "Phòng đôi", null, 2, 5, AmenityValue.YES, null, new BigDecimal("500000"), null, "ACTIVE", null, List.of(), List.of());
    }

    private RoomInput roomInput(String price) {
        return new RoomInput("Phòng đôi", null, 2, 5, AmenityValue.YES, null, new BigDecimal(price), null, "ACTIVE", null, List.of(), List.of());
    }

    @Test
    @DisplayName("Sửa giá loại phòng của Homestay công khai: tạo yêu cầu có nội dung cũ/mới, không gọi save trực tiếp")
    void publishedRoomPriceChange_createsPending() {
        when(rooms.listAs(account, 21L)).thenReturn(List.of(currentRoom()));

        var outcome = service.saveRoom(principal, 21L, 3L, roomInput("650000"));

        assertTrue(outcome.isPending());
        verify(rooms, never()).save(any(), anyLong(), any(), any());
        PartnerChangeRequest request = saved();
        assertEquals(ChangeTargetType.ROOM_TYPE, request.getTargetType());
        assertEquals(3L, request.getTargetId());
        assertEquals("500000", ChangeRequestDiff.norm(request.getBeforeData().get("basePrice")));
        assertEquals("650000", ChangeRequestDiff.norm(request.getPayload().get("basePrice")));
        assertEquals(List.of("basePrice"), ChangeRequestDiff.changedFields(ChangeTargetType.ROOM_TYPE, request.getBeforeData(), request.getPayload()));
    }

    @Test
    @DisplayName("Tạo loại phòng mới ở Homestay công khai: CREATE chờ duyệt và không thay thế yêu cầu tạo phòng khác")
    void publishedRoomCreate_doesNotSupersedeOthers() {
        service.saveRoom(principal, 21L, null, roomInput("500000"));

        PartnerChangeRequest request = saved();
        assertEquals(ChangeOperation.CREATE, request.getOperation());
        assertNull(request.getBeforeData());
        verify(requests, never()).findOpen(any(), anyLong(), any(), any(), any());
    }

    @Test
    @DisplayName("Đổi giá đặc biệt và xóa giá ở Homestay công khai đều thành yêu cầu chờ duyệt")
    void publishedSpecialPrice_updateAndDelete() {
        PriceDto current = new PriceDto(8L, "Mùa lúa", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), new BigDecimal("900000"));
        when(rooms.pricesAs(account, 21L, 3L)).thenReturn(List.of(current));

        var update = service.savePrice(principal, 21L, 3L, 8L,
                new PriceInput("Mùa lúa", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), new BigDecimal("1200000")));
        SubmittedDto delete = service.deletePrice(principal, 21L, 3L, 8L);

        assertTrue(update.isPending());
        assertNotNull(delete);
        verify(rooms, never()).savePrice(any(), anyLong(), anyLong(), any(), any());
        verify(rooms, never()).deletePrice(any(), anyLong(), anyLong(), anyLong());
        ArgumentCaptor<PartnerChangeRequest> captor = ArgumentCaptor.forClass(PartnerChangeRequest.class);
        verify(requests, times(2)).save(captor.capture());
        assertEquals(ChangeOperation.UPDATE, captor.getAllValues().get(0).getOperation());
        assertEquals(ChangeOperation.DELETE, captor.getAllValues().get(1).getOperation());
        assertEquals(3L, captor.getAllValues().get(1).getRoomTypeId());
    }

    @Test
    @DisplayName("Homestay chưa công khai: giá và phòng ghi trực tiếp")
    void draftHomestay_priceAndRoomDirect() {
        place.setVisibility(PlaceVisibility.DRAFT);
        PriceInput priceInput = new PriceInput("Mùa lúa", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), new BigDecimal("1"));
        when(rooms.savePrice(principal, 21L, 3L, null, priceInput)).thenReturn(new PriceDto(1L, "Mùa lúa", priceInput.periodStart(), priceInput.periodEnd(), priceInput.price()));

        var outcome = service.savePrice(principal, 21L, 3L, null, priceInput);
        assertNull(service.deletePrice(principal, 21L, 3L, 9L));

        assertFalse(outcome.isPending());
        verify(rooms).deletePrice(principal, 21L, 3L, 9L);
        verify(requests, never()).save(any());
    }

    @Test
    @DisplayName("Rút lại: NCC khác không thấy yêu cầu (404), yêu cầu đã xử lý không rút được (409)")
    void cancel_enforcesOwnershipAndPendingState() {
        Provider other = Provider.builder().id(99L).build();
        PartnerChangeRequest foreign = PartnerChangeRequest.builder().id(1L).provider(other).status(ChangeRequestStatus.PENDING).build();
        PartnerChangeRequest processed = PartnerChangeRequest.builder().id(2L).provider(provider).status(ChangeRequestStatus.APPROVED).build();
        when(requests.findByIdForUpdate(1L)).thenReturn(Optional.of(foreign));
        when(requests.findByIdForUpdate(2L)).thenReturn(Optional.of(processed));

        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.cancel(principal, 1L)).getStatusCode().value());
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.cancel(principal, 2L)).getStatusCode().value());
        assertEquals(ChangeRequestStatus.PENDING, foreign.getStatus());
    }

    @Test
    @DisplayName("Rút lại yêu cầu của chính mình đang chờ: chuyển CANCELLED")
    void cancel_ownPending() {
        PartnerChangeRequest own = PartnerChangeRequest.builder().id(3L).provider(provider).place(place).submittedBy(account)
                .targetType(ChangeTargetType.HOMESTAY).operation(ChangeOperation.UPDATE).status(ChangeRequestStatus.PENDING)
                .payload(Map.of("name", "Mới")).beforeData(Map.of("name", "Cũ")).build();
        when(requests.findByIdForUpdate(3L)).thenReturn(Optional.of(own));

        ChangeRequestSummaryDto result = service.cancel(principal, 3L);

        assertEquals(ChangeRequestStatus.CANCELLED, own.getStatus());
        assertEquals(ChangeRequestStatus.CANCELLED, result.status());
    }

    @Test
    @DisplayName("HOM-MGT-BR-04: lần đầu xuất bản (đủ điều kiện) tạo yêu cầu PUBLISH chờ duyệt, KHÔNG tự set PUBLISHED")
    void firstPublish_readyToPublish_createsPendingPublishRequest() {
        place.setVisibility(PlaceVisibility.DRAFT);
        when(homestays.missingForPublish(place)).thenReturn(List.of());

        var outcome = service.updateStatus(principal, 21L, UpdateStatusRequest.builder().visibility(PlaceVisibility.PUBLISHED).build());

        assertTrue(outcome.isPending());
        verify(homestays, never()).updateStatus(any(), anyLong(), any());
        PartnerChangeRequest request = saved();
        assertEquals(ChangeTargetType.HOMESTAY, request.getTargetType());
        assertEquals(ChangeOperation.PUBLISH, request.getOperation());
        assertEquals("DRAFT", request.getBeforeData().get("visibility"));
        assertEquals("PUBLISHED", request.getPayload().get("visibility"));
    }

    @Test
    @DisplayName("HOM-MGT-BR-04: lần đầu xuất bản nhưng chưa đủ điều kiện thì từ chối, không tạo yêu cầu")
    void firstPublish_notReady_rejectedWithoutRequest() {
        place.setVisibility(PlaceVisibility.DRAFT);
        when(homestays.missingForPublish(place)).thenReturn(List.of("ảnh chung"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.updateStatus(principal, 21L,
                UpdateStatusRequest.builder().visibility(PlaceVisibility.PUBLISHED).build()));

        assertEquals(400, ex.getStatusCode().value());
        verify(requests, never()).save(any());
    }

    @Test
    @DisplayName("Không phải lần đầu xuất bản (đổi vận hành, ngừng hiển thị...): ghi trực tiếp như trước, không tạo yêu cầu")
    void notFirstPublish_delegatesDirectly() {
        place.setVisibility(PlaceVisibility.PUBLISHED);
        UpdateStatusRequest request = UpdateStatusRequest.builder().visibility(PlaceVisibility.UNPUBLISHED).build();
        PartnerHomestaySummaryDto result = PartnerHomestaySummaryDto.builder().id(21L).build();
        when(homestays.updateStatus(principal, 21L, request)).thenReturn(result);

        var outcome = service.updateStatus(principal, 21L, request);

        assertFalse(outcome.isPending());
        assertSame(result, outcome.saved());
        verify(requests, never()).save(any());
    }

    @Test
    @DisplayName("Xác nhận nghiệp vụ: xin chuyển NCC quản lý tạo yêu cầu TRANSFER chờ duyệt, KHÔNG tự đổi provider")
    void requestTransfer_createsPendingRequest() {
        Provider target = Provider.builder().id(99L).name("NCC B").status(ProviderStatus.ACTIVE).build();
        when(providerRepository.findById(99L)).thenReturn(Optional.of(target));

        SubmittedDto pending = service.requestTransfer(principal, 21L, 99L);

        assertEquals(ChangeRequestStatus.PENDING, pending.status());
        assertEquals(12L, place.getProvider().getId(), "Chưa đổi NCC quản lý cho tới khi Admin duyệt");
        PartnerChangeRequest request = saved();
        assertEquals(ChangeTargetType.HOMESTAY, request.getTargetType());
        assertEquals(ChangeOperation.TRANSFER, request.getOperation());
        assertEquals(12L, ((Number) request.getBeforeData().get("providerId")).longValue());
        assertEquals(99L, ((Number) request.getPayload().get("providerId")).longValue());
    }

    @Test
    @DisplayName("Xin chuyển: NCC đích trùng NCC hiện tại hoặc không hoạt động đều bị từ chối, không tạo yêu cầu")
    void requestTransfer_rejectsInvalidTarget() {
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.requestTransfer(principal, 21L, 12L)).getStatusCode().value());

        Provider suspended = Provider.builder().id(50L).name("NCC C").status(ProviderStatus.SUSPENDED).build();
        when(providerRepository.findById(50L)).thenReturn(Optional.of(suspended));
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.requestTransfer(principal, 21L, 50L)).getStatusCode().value());

        verify(requests, never()).save(any());
    }
}

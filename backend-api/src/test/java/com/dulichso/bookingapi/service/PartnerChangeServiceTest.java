package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.SubmittedDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestayDetailDto;
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

    final UserPrincipal principal = new UserPrincipal(null, "provider@example.test", AccountRole.PROVIDER, null);
    PartnerChangeService service;
    Provider provider;
    Account account;
    Place place;

    @BeforeEach
    void setup() {
        ObjectMapper mapper = new ObjectMapper().findAndRegisterModules().disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        service = new PartnerChangeService(homestays, rooms, requests, mapper);
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

    @Test
    @DisplayName("Homestay đang công khai: sửa thông tin tạo yêu cầu PENDING, KHÔNG ghi vào dữ liệu chính thức")
    void publishedHomestay_createsPendingRequest() {
        when(homestays.detailOf(place)).thenReturn(homestay("Tên cũ"));

        var outcome = service.saveHomestay(principal, 21L, homestay("Tên mới"));

        assertTrue(outcome.isPending());
        assertNull(outcome.saved());
        assertEquals(ChangeRequestStatus.PENDING, outcome.pending().status());
        verify(homestays, never()).saveHomestayDetail(any(), anyLong(), any());
        PartnerChangeRequest request = saved();
        assertEquals(ChangeTargetType.HOMESTAY, request.getTargetType());
        assertEquals(ChangeOperation.UPDATE, request.getOperation());
        assertEquals("Tên mới", request.getPayload().get("name"));
        assertEquals("Tên cũ", request.getBeforeData().get("name"));
        assertEquals(12L, request.getProvider().getId());
        assertEquals(7L, request.getSubmittedBy().getId());
    }

    @Test
    @DisplayName("Payload chỉ chứa trường được phép đề xuất, không mang id/trạng thái hiển thị")
    void payloadContainsOnlyEditableFields() {
        when(homestays.detailOf(place)).thenReturn(homestay("Tên cũ"));
        PartnerHomestayDetailDto dto = homestay("Tên mới");
        dto.setVisibility(PlaceVisibility.PUBLISHED);
        dto.setCoverImageUrl("https://evil.example/x.jpg");

        service.saveHomestay(principal, 21L, dto);

        Map<String, Object> payload = saved().getPayload();
        assertEquals(ChangeRequestDiff.HOMESTAY.keySet(), payload.keySet());
        assertFalse(payload.containsKey("id"));
        assertFalse(payload.containsKey("visibility"));
        assertFalse(payload.containsKey("coverImageUrl"));
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

    @Test
    @DisplayName("Gửi lại nội dung y hệt hiện tại: bị từ chối, không tạo yêu cầu rỗng")
    void unchangedContent_rejected() {
        when(homestays.detailOf(place)).thenReturn(homestay("Tên cũ"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.saveHomestay(principal, 21L, homestay("Tên cũ")));

        assertEquals(400, ex.getStatusCode().value());
        verify(requests, never()).save(any());
    }

    @Test
    @DisplayName("Yêu cầu mới thay thế yêu cầu đang chờ cho cùng Homestay")
    void newRequestSupersedesPendingOne() {
        when(homestays.detailOf(place)).thenReturn(homestay("Tên cũ"));
        PartnerChangeRequest old = PartnerChangeRequest.builder().id(50L).status(ChangeRequestStatus.PENDING).build();
        when(requests.findOpen(ChangeRequestStatus.PENDING, 21L, ChangeTargetType.HOMESTAY, null, null)).thenReturn(List.of(old));

        service.saveHomestay(principal, 21L, homestay("Tên mới"));

        assertEquals(ChangeRequestStatus.CANCELLED, old.getStatus());
        assertNotNull(old.getReviewNote());
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
}

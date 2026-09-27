package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestayDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.RoomInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.PartnerChangeRequestRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/** Admin duyệt/từ chối: chỉ khi Approve dữ liệu chính thức mới được cập nhật. */
@ExtendWith(MockitoExtension.class)
class AdminChangeRequestServiceTest {
    @Mock PartnerChangeRequestRepository requests;
    @Mock AccountRepository accounts;
    @Mock PartnerHomestayService homestays;
    @Mock PartnerRoomService rooms;
    @Mock AuditLogService auditLogService;

    AdminChangeRequestService service;
    Provider provider;
    Account submitter;
    Account admin;
    Place place;

    @BeforeEach
    void setup() {
        ObjectMapper mapper = new ObjectMapper().findAndRegisterModules().disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        service = new AdminChangeRequestService(requests, accounts, homestays, rooms, auditLogService, mapper);
        provider = Provider.builder().id(12L).name("NCC A").status(ProviderStatus.ACTIVE).build();
        submitter = Account.builder().id(7L).fullName("Chủ nhà").role(AccountRole.PROVIDER).status(AccountStatus.ACTIVE).provider(provider).build();
        admin = Account.builder().id(1L).fullName("Admin").role(AccountRole.ADMIN).status(AccountStatus.ACTIVE).build();
        place = Place.builder().id(21L).name("Homestay A").provider(provider).build();
        lenient().when(accounts.findById(1L)).thenReturn(Optional.of(admin));
    }

    private PartnerChangeRequest request(ChangeTargetType type, ChangeOperation op, Long targetId, Long roomTypeId,
                                         Map<String, Object> payload, Map<String, Object> before) {
        PartnerChangeRequest r = PartnerChangeRequest.builder().id(9L).provider(provider).place(place).targetType(type).targetId(targetId)
                .roomTypeId(roomTypeId).operation(op).status(ChangeRequestStatus.PENDING).payload(payload).beforeData(before)
                .submittedBy(submitter).build();
        lenient().when(requests.findByIdForUpdate(9L)).thenReturn(Optional.of(r));
        lenient().when(requests.findById(9L)).thenReturn(Optional.of(r));
        return r;
    }

    private Map<String, Object> homestayPayload(String name) {
        Map<String, Object> m = new HashMap<>();
        for (String key : ChangeRequestDiff.HOMESTAY.keySet()) m.put(key, null);
        m.put("name", name);
        m.put("address", "Địa chỉ");
        m.put("description", "Mô tả");
        m.put("contactPhone", "0912345678");
        return m;
    }

    @Test
    @DisplayName("Approve thông tin Homestay: áp dụng qua service NCC, trạng thái APPROVED, ghi audit")
    void approveHomestay_appliesAndAudits() {
        PartnerChangeRequest r = request(ChangeTargetType.HOMESTAY, ChangeOperation.UPDATE, null, null, homestayPayload("Tên mới"), homestayPayload("Tên cũ"));

        ChangeRequestDetailDto detail = service.approve(9L, 1L, "Đã kiểm tra");

        verify(homestays).applyApproved(eq(submitter), eq(21L), argThat((PartnerHomestayDetailDto dto) -> "Tên mới".equals(dto.getName())));
        assertEquals(ChangeRequestStatus.APPROVED, r.getStatus());
        assertSame(admin, r.getReviewedBy());
        assertNotNull(r.getReviewedAt());
        assertEquals("Đã kiểm tra", r.getReviewNote());
        assertEquals(ChangeRequestStatus.APPROVED, detail.summary().status());
        assertFalse(detail.stale());
        verify(auditLogService).record(eq(1L), eq("CHANGE_REQUEST_APPROVED"), eq("ChangeRequest"), eq(9L), eq("Đã kiểm tra"), anyMap(), anyMap());
    }

    @Test
    @DisplayName("Approve loại phòng: áp dụng loại phòng với id đích")
    void approveRoom_appliesRoomInput() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Phòng đôi");
        payload.put("maxOccupancy", 2);
        payload.put("totalRoomCount", 5);
        payload.put("privateBathroom", "YES");
        payload.put("basePrice", 650000);
        payload.put("status", "ACTIVE");
        payload.put("beds", List.of());
        payload.put("amenityIds", List.of());
        request(ChangeTargetType.ROOM_TYPE, ChangeOperation.UPDATE, 3L, null, payload, Map.of("basePrice", 500000));

        service.approve(9L, 1L, null);

        verify(rooms).applyApproved(eq(submitter), eq(21L), eq(3L),
                argThat((RoomInput in) -> new BigDecimal("650000").compareTo(in.basePrice()) == 0 && "Phòng đôi".equals(in.name())));
    }

    @Test
    @DisplayName("Approve xóa bảng giá: áp dụng việc xóa")
    void approvePriceDelete_appliesDelete() {
        request(ChangeTargetType.ROOM_PRICE, ChangeOperation.DELETE, 8L, 3L, null, Map.of("name", "Mùa lúa", "price", 900000));

        service.approve(9L, 1L, null);

        verify(rooms).applyDeletePrice(submitter, 21L, 3L, 8L);
    }

    @Test
    @DisplayName("Approve lỗi khi áp dụng (dữ liệu không còn hợp lệ): yêu cầu vẫn PENDING và không ghi audit")
    void approveFailure_keepsPending() {
        PartnerChangeRequest r = request(ChangeTargetType.HOMESTAY, ChangeOperation.UPDATE, null, null, homestayPayload("Tên mới"), homestayPayload("Tên cũ"));
        when(homestays.applyApproved(any(), anyLong(), any())).thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Số điện thoại không hợp lệ."));

        assertThrows(ResponseStatusException.class, () -> service.approve(9L, 1L, null));

        assertEquals(ChangeRequestStatus.PENDING, r.getStatus());
        assertNull(r.getReviewedBy());
        verifyNoInteractions(auditLogService);
    }

    @Test
    @DisplayName("Reject: bắt buộc có lý do, KHÔNG áp dụng vào dữ liệu chính thức, ghi audit")
    void reject_requiresReasonAndDoesNotApply() {
        PartnerChangeRequest r = request(ChangeTargetType.HOMESTAY, ChangeOperation.UPDATE, null, null, homestayPayload("Tên mới"), homestayPayload("Tên cũ"));

        assertThrows(IllegalArgumentException.class, () -> service.reject(9L, 1L, "  "));
        assertEquals(ChangeRequestStatus.PENDING, r.getStatus());

        ChangeRequestDetailDto detail = service.reject(9L, 1L, "Thông tin chưa chính xác");

        assertEquals(ChangeRequestStatus.REJECTED, detail.summary().status());
        assertEquals("Thông tin chưa chính xác", r.getReviewNote());
        verify(homestays, never()).applyApproved(any(), anyLong(), any());
        verify(auditLogService).record(eq(1L), eq("CHANGE_REQUEST_REJECTED"), eq("ChangeRequest"), eq(9L), eq("Thông tin chưa chính xác"), anyMap(), anyMap());
    }

    @Test
    @DisplayName("Yêu cầu đã xử lý không thể duyệt hoặc từ chối lại")
    void alreadyProcessed_isRejected() {
        PartnerChangeRequest r = request(ChangeTargetType.HOMESTAY, ChangeOperation.UPDATE, null, null, homestayPayload("Tên mới"), homestayPayload("Tên cũ"));
        r.setStatus(ChangeRequestStatus.APPROVED);

        assertThrows(IllegalStateException.class, () -> service.approve(9L, 1L, null));
        assertThrows(IllegalStateException.class, () -> service.reject(9L, 1L, "Lý do"));
        verify(homestays, never()).applyApproved(any(), anyLong(), any());
    }

    @Test
    @DisplayName("NCC bị đình chỉ: không thể duyệt yêu cầu")
    void suspendedProvider_cannotBeApproved() {
        provider.setStatus(ProviderStatus.SUSPENDED);
        request(ChangeTargetType.HOMESTAY, ChangeOperation.UPDATE, null, null, homestayPayload("Tên mới"), homestayPayload("Tên cũ"));

        assertThrows(IllegalStateException.class, () -> service.approve(9L, 1L, null));
        verify(homestays, never()).applyApproved(any(), anyLong(), any());
    }

    @Test
    @DisplayName("Không xác định được Admin thao tác (accountId null): từ chối")
    void unknownReviewer_rejected() {
        request(ChangeTargetType.HOMESTAY, ChangeOperation.UPDATE, null, null, homestayPayload("Tên mới"), homestayPayload("Tên cũ"));

        assertThrows(IllegalStateException.class, () -> service.approve(9L, null, null));
        verify(homestays, never()).applyApproved(any(), anyLong(), any());
    }

    @Test
    @DisplayName("Chi tiết: liệt kê đúng trường thay đổi cũ/mới và cờ stale khi dữ liệu chính thức đã đổi")
    void detail_showsChangesAndStale() {
        request(ChangeTargetType.HOMESTAY, ChangeOperation.UPDATE, null, null, homestayPayload("Tên mới"), homestayPayload("Tên cũ"));
        when(homestays.detailOf(place)).thenReturn(PartnerHomestayDetailDto.builder().name("Tên cũ").address("Địa chỉ").description("Mô tả").contactPhone("0912345678").build());

        ChangeRequestDetailDto fresh = service.detail(9L);

        assertEquals(1, fresh.changes().size());
        assertEquals("name", fresh.changes().get(0).field());
        assertEquals("Tên cũ", fresh.changes().get(0).before());
        assertEquals("Tên mới", fresh.changes().get(0).after());
        assertFalse(fresh.stale());

        when(homestays.detailOf(place)).thenReturn(PartnerHomestayDetailDto.builder().name("Tên khác").address("Địa chỉ").description("Mô tả").contactPhone("0912345678").build());
        assertTrue(service.detail(9L).stale());
    }

    @Test
    @DisplayName("Tìm kiếm: khoảng ngày ngược bị từ chối")
    void search_rejectsInvertedRange() {
        assertThrows(IllegalArgumentException.class, () -> service.search(null, null, null, null, null,
                java.time.LocalDate.of(2026, 9, 10), java.time.LocalDate.of(2026, 9, 1), "desc", 0, 20));
        verifyNoInteractions(requests);
    }

    @Test
    @DisplayName("Không tìm thấy yêu cầu")
    void notFound() {
        when(requests.findByIdForUpdate(404L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.approve(404L, 1L, null));
        verify(auditLogService, never()).record(any(), any(), any(), any(), isNull(), any(), any());
    }
}

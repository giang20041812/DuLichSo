package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminSosDtos.*;
import com.dulichso.bookingapi.entity.EmergencyContact;
import com.dulichso.bookingapi.entity.SosRequest;
import com.dulichso.bookingapi.entity.enums.EmergencyContactType;
import com.dulichso.bookingapi.entity.enums.SosRequestStatus;
import com.dulichso.bookingapi.entity.enums.SosRequestType;
import com.dulichso.bookingapi.repository.EmergencyContactRepository;
import com.dulichso.bookingapi.repository.RegionRepository;
import com.dulichso.bookingapi.repository.SosRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminSosServiceTest {

    @Mock
    private SosRequestRepository sosRequestRepository;

    @Mock
    private EmergencyContactRepository emergencyContactRepository;

    @Mock
    private RegionRepository regionRepository;

    @Mock
    private AuditLogService auditLogService;

    private AdminSosService service;

    @BeforeEach
    void setUp() {
        service = new AdminSosService(
                sosRequestRepository,
                emergencyContactRepository,
                regionRepository,
                auditLogService
        );
    }

    // ─────────────────────────────────────────────
    // getSosRequests
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getSosRequests: không lọc → trả toàn bộ danh sách")
    void testGetSosRequests_noFilter() {
        SosRequest pending = buildSosRequest(1L, SosRequestStatus.PENDING);
        SosRequest resolved = buildSosRequest(2L, SosRequestStatus.RESOLVED);
        when(sosRequestRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(pending, resolved));

        SosRequestListResponse response = service.getSosRequests(null);

        assertEquals(2, response.getItems().size());
        assertEquals(2, response.getTotal());
    }

    @Test
    @DisplayName("getSosRequests: lọc theo PENDING → chỉ trả PENDING")
    void testGetSosRequests_filterPending() {
        SosRequest pending = buildSosRequest(1L, SosRequestStatus.PENDING);
        when(sosRequestRepository.findByStatusOrderByCreatedAtDesc(SosRequestStatus.PENDING))
                .thenReturn(List.of(pending));

        SosRequestListResponse response = service.getSosRequests("PENDING");

        assertEquals(1, response.getItems().size());
        assertEquals(SosRequestStatus.PENDING, response.getItems().get(0).getStatus());
    }

    @Test
    @DisplayName("getSosRequests: status không hợp lệ → 400 Bad Request")
    void testGetSosRequests_invalidStatus() {
        assertThrows(ResponseStatusException.class, () -> service.getSosRequests("INVALID_STATUS"));
    }

    // ─────────────────────────────────────────────
    // getSosRequest
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getSosRequest: id không tồn tại → 404 Not Found")
    void testGetSosRequest_notFound() {
        when(sosRequestRepository.findWithContactById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.getSosRequest(999L));
    }

    // ─────────────────────────────────────────────
    // dispatch
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("dispatch: PENDING → DISPATCHED thành công")
    void testDispatch_success() {
        SosRequest sos = buildSosRequest(1L, SosRequestStatus.PENDING);
        EmergencyContact contact = buildContact(10L);

        when(sosRequestRepository.findById(1L)).thenReturn(Optional.of(sos));
        when(emergencyContactRepository.findById(10L)).thenReturn(Optional.of(contact));
        when(sosRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DispatchSosRequest req = DispatchSosRequest.builder()
                .assignedContactId(10L)
                .note("Đã liên hệ cảnh sát khu vực")
                .build();

        SosRequestDto result = service.dispatch(1L, req, 1001L);

        assertEquals(SosRequestStatus.DISPATCHED, result.getStatus());
        assertNotNull(result.getAssignedContact());
        verify(auditLogService).record(eq(1001L), eq("SOS_DISPATCHED"), eq("SosRequest"),
                eq(1L), any(), any(), any());
    }

    @Test
    @DisplayName("dispatch: SOS đã DISPATCHED → 409 Conflict")
    void testDispatch_alreadyDispatched() {
        SosRequest sos = buildSosRequest(1L, SosRequestStatus.DISPATCHED);
        when(sosRequestRepository.findById(1L)).thenReturn(Optional.of(sos));

        DispatchSosRequest req = DispatchSosRequest.builder().assignedContactId(10L).build();

        assertThrows(ResponseStatusException.class, () -> service.dispatch(1L, req, 1001L));
    }

    @Test
    @DisplayName("dispatch: contact không active → 400 Bad Request")
    void testDispatch_inactiveContact() {
        SosRequest sos = buildSosRequest(1L, SosRequestStatus.PENDING);
        EmergencyContact inactiveContact = buildContact(10L);
        inactiveContact.setIsActive(false);

        when(sosRequestRepository.findById(1L)).thenReturn(Optional.of(sos));
        when(emergencyContactRepository.findById(10L)).thenReturn(Optional.of(inactiveContact));

        DispatchSosRequest req = DispatchSosRequest.builder().assignedContactId(10L).build();

        assertThrows(ResponseStatusException.class, () -> service.dispatch(1L, req, 1001L));
    }

    // ─────────────────────────────────────────────
    // resolve
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("resolve: DISPATCHED → RESOLVED thành công")
    void testResolve_success() {
        SosRequest sos = buildSosRequest(1L, SosRequestStatus.DISPATCHED);
        when(sosRequestRepository.findById(1L)).thenReturn(Optional.of(sos));
        when(sosRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SosRequestDto result = service.resolve(1L, 1001L);

        assertEquals(SosRequestStatus.RESOLVED, result.getStatus());
        assertNotNull(result.getResolvedAt());
        verify(auditLogService).record(eq(1001L), eq("SOS_RESOLVED"), eq("SosRequest"),
                eq(1L), isNull(), any(), any());
    }

    @Test
    @DisplayName("resolve: SOS đã RESOLVED → 409 Conflict")
    void testResolve_alreadyResolved() {
        SosRequest sos = buildSosRequest(1L, SosRequestStatus.RESOLVED);
        when(sosRequestRepository.findById(1L)).thenReturn(Optional.of(sos));

        assertThrows(ResponseStatusException.class, () -> service.resolve(1L, 1001L));
    }

    // ─────────────────────────────────────────────
    // submitPublicSos
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("submitPublicSos: tạo mới SOS với status PENDING")
    void testSubmitPublicSos_success() {
        SosRequest saved = buildSosRequest(5L, SosRequestStatus.PENDING);
        when(sosRequestRepository.save(any())).thenReturn(saved);

        PublicSosSubmitRequest req = PublicSosSubmitRequest.builder()
                .requesterName("Nguyễn Văn A")
                .requesterPhone("0901234567")
                .type(SosRequestType.MEDICAL)
                .build();

        PublicSosSubmitResponse resp = service.submitPublicSos(req);

        assertEquals(5L, resp.getSosRequestId());
        assertNotNull(resp.getMessage());
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private SosRequest buildSosRequest(Long id, SosRequestStatus status) {
        return SosRequest.builder()
                .id(id)
                .requesterName("Du khách Test")
                .requesterPhone("0900000000")
                .type(SosRequestType.MEDICAL)
                .status(status)
                .build();
    }

    private EmergencyContact buildContact(Long id) {
        return EmergencyContact.builder()
                .id(id)
                .type(EmergencyContactType.MEDICAL)
                .name("Bệnh viện huyện Mù Cang Chải")
                .phone("02163825262")
                .isActive(true)
                .build();
    }
}

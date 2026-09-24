package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminSosDtos.*;
import com.dulichso.bookingapi.entity.EmergencyContact;
import com.dulichso.bookingapi.entity.Region;
import com.dulichso.bookingapi.entity.SosRequest;
import com.dulichso.bookingapi.entity.enums.SosRequestStatus;
import com.dulichso.bookingapi.repository.EmergencyContactRepository;
import com.dulichso.bookingapi.repository.RegionRepository;
import com.dulichso.bookingapi.repository.SosRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service Admin quản lý SOS requests và EmergencyContacts.
 * Mọi thay đổi trạng thái đều ghi audit log.
 */
@Service
public class AdminSosService {

    private final SosRequestRepository sosRequestRepository;
    private final EmergencyContactRepository emergencyContactRepository;
    private final RegionRepository regionRepository;
    private final AuditLogService auditLogService;

    public AdminSosService(SosRequestRepository sosRequestRepository,
                           EmergencyContactRepository emergencyContactRepository,
                           RegionRepository regionRepository,
                           AuditLogService auditLogService) {
        this.sosRequestRepository = sosRequestRepository;
        this.emergencyContactRepository = emergencyContactRepository;
        this.regionRepository = regionRepository;
        this.auditLogService = auditLogService;
    }

    // ─────────────────────────────────────────────
    // SOS Requests
    // ─────────────────────────────────────────────

    /**
     * Lấy danh sách SOS requests. Lọc theo status nếu cung cấp.
     */
    @Transactional(readOnly = true)
    public SosRequestListResponse getSosRequests(String statusFilter) {
        List<SosRequest> items;
        if (statusFilter != null && !statusFilter.isBlank()) {
            SosRequestStatus status;
            try {
                status = SosRequestStatus.valueOf(statusFilter.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Giá trị status không hợp lệ: " + statusFilter);
            }
            items = sosRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            items = sosRequestRepository.findAllByOrderByCreatedAtDesc();
        }
        List<SosRequestDto> dtos = items.stream().map(this::toDto).collect(Collectors.toList());
        return SosRequestListResponse.builder()
                .items(dtos)
                .total(dtos.size())
                .build();
    }

    /**
     * Lấy chi tiết 1 SOS request theo id.
     */
    @Transactional(readOnly = true)
    public SosRequestDto getSosRequest(Long id) {
        SosRequest req = sosRequestRepository.findWithContactById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy SOS request id=" + id));
        return toDto(req);
    }

    /**
     * Gán EmergencyContact và chuyển status sang DISPATCHED.
     */
    @Transactional
    public SosRequestDto dispatch(Long id, DispatchSosRequest request, Long actorAccountId) {
        SosRequest sos = sosRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy SOS request id=" + id));

        if (sos.getStatus() != SosRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ có thể điều phối SOS request ở trạng thái PENDING. Trạng thái hiện tại: " + sos.getStatus());
        }

        EmergencyContact contact = emergencyContactRepository.findById(request.getAssignedContactId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đầu mối liên hệ id=" + request.getAssignedContactId()));

        if (!Boolean.TRUE.equals(contact.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đầu mối liên hệ này đang không hoạt động");
        }

        Map<String, Object> before = Map.of("status", sos.getStatus().name());

        sos.setStatus(SosRequestStatus.DISPATCHED);
        sos.setAssignedContact(contact);
        sos.setDispatchNote(request.getNote());
        sosRequestRepository.save(sos);

        auditLogService.record(actorAccountId, "SOS_DISPATCHED", "SosRequest", id,
                "Gán đầu mối: " + contact.getName(),
                before,
                Map.of("status", SosRequestStatus.DISPATCHED.name(), "assignedContactId", contact.getId()));

        return toDto(sos);
    }

    /**
     * Đánh dấu SOS request đã được xử lý xong (RESOLVED).
     */
    @Transactional
    public SosRequestDto resolve(Long id, Long actorAccountId) {
        SosRequest sos = sosRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy SOS request id=" + id));

        if (sos.getStatus() == SosRequestStatus.RESOLVED || sos.getStatus() == SosRequestStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SOS request đã ở trạng thái cuối: " + sos.getStatus());
        }

        Map<String, Object> before = Map.of("status", sos.getStatus().name());

        sos.setStatus(SosRequestStatus.RESOLVED);
        sos.setResolvedAt(LocalDateTime.now());
        sosRequestRepository.save(sos);

        auditLogService.record(actorAccountId, "SOS_RESOLVED", "SosRequest", id, null,
                before, Map.of("status", SosRequestStatus.RESOLVED.name()));

        return toDto(sos);
    }

    /**
     * Huỷ SOS request (CANCELLED).
     */
    @Transactional
    public SosRequestDto cancel(Long id, Long actorAccountId) {
        SosRequest sos = sosRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy SOS request id=" + id));

        if (sos.getStatus() == SosRequestStatus.RESOLVED || sos.getStatus() == SosRequestStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SOS request đã ở trạng thái cuối: " + sos.getStatus());
        }

        Map<String, Object> before = Map.of("status", sos.getStatus().name());

        sos.setStatus(SosRequestStatus.CANCELLED);
        sosRequestRepository.save(sos);

        auditLogService.record(actorAccountId, "SOS_CANCELLED", "SosRequest", id, null,
                before, Map.of("status", SosRequestStatus.CANCELLED.name()));

        return toDto(sos);
    }

    /**
     * Khách gửi SOS (public endpoint, không cần auth).
     */
    @Transactional
    public PublicSosSubmitResponse submitPublicSos(PublicSosSubmitRequest request) {
        SosRequest sos = SosRequest.builder()
                .requesterName(request.getRequesterName())
                .requesterPhone(request.getRequesterPhone())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .type(request.getType())
                .description(request.getDescription())
                .status(SosRequestStatus.PENDING)
                .build();
        sos = sosRequestRepository.save(sos);

        return PublicSosSubmitResponse.builder()
                .sosRequestId(sos.getId())
                .message("Yêu cầu SOS của bạn đã được ghi nhận. Đội ngũ hỗ trợ sẽ liên hệ với bạn ngay.")
                .createdAt(sos.getCreatedAt())
                .build();
    }

    // ─────────────────────────────────────────────
    // Emergency Contacts CRUD
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EmergencyContactDto> getEmergencyContacts(Boolean activeOnly) {
        List<EmergencyContact> list = Boolean.TRUE.equals(activeOnly)
                ? emergencyContactRepository.findByIsActiveTrue()
                : emergencyContactRepository.findAll();
        return list.stream().map(this::toContactDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmergencyContactDto getEmergencyContact(Long id) {
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đầu mối liên hệ id=" + id));
        return toContactDto(contact);
    }

    @Transactional
    public EmergencyContactDto createEmergencyContact(CreateEmergencyContactRequest request,
                                                       Long actorAccountId) {
        Region region = null;
        if (request.getRegionId() != null) {
            region = regionRepository.findById(request.getRegionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Không tìm thấy khu vực id=" + request.getRegionId()));
        }

        EmergencyContact contact = EmergencyContact.builder()
                .region(region)
                .type(request.getType())
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .isActive(true)
                .build();
        contact = emergencyContactRepository.save(contact);

        auditLogService.record(actorAccountId, "EMERGENCY_CONTACT_CREATED",
                "EmergencyContact", contact.getId(), null, null,
                Map.of("name", contact.getName(), "type", contact.getType().name()));

        return toContactDto(contact);
    }

    @Transactional
    public EmergencyContactDto updateEmergencyContact(Long id,
                                                       UpdateEmergencyContactRequest request,
                                                       Long actorAccountId) {
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đầu mối liên hệ id=" + id));

        Map<String, Object> before = Map.of(
                "name", contact.getName(),
                "type", contact.getType().name(),
                "isActive", String.valueOf(contact.getIsActive())
        );

        if (request.getRegionId() != null) {
            Region region = regionRepository.findById(request.getRegionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Không tìm thấy khu vực id=" + request.getRegionId()));
            contact.setRegion(region);
        }
        if (request.getType() != null) contact.setType(request.getType());
        if (request.getName() != null) contact.setName(request.getName());
        if (request.getPhone() != null) contact.setPhone(request.getPhone());
        if (request.getAddress() != null) contact.setAddress(request.getAddress());
        if (request.getIsActive() != null) contact.setIsActive(request.getIsActive());

        contact = emergencyContactRepository.save(contact);

        auditLogService.record(actorAccountId, "EMERGENCY_CONTACT_UPDATED",
                "EmergencyContact", id, null, before,
                Map.of("name", contact.getName(), "isActive", String.valueOf(contact.getIsActive())));

        return toContactDto(contact);
    }

    @Transactional
    public void deleteEmergencyContact(Long id, Long actorAccountId) {
        EmergencyContact contact = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đầu mối liên hệ id=" + id));

        emergencyContactRepository.delete(contact);

        auditLogService.record(actorAccountId, "EMERGENCY_CONTACT_DELETED",
                "EmergencyContact", id, null,
                Map.of("name", contact.getName()), null);
    }

    // ─────────────────────────────────────────────
    // Mapper helpers (không dùng ModelMapper để tránh phụ thuộc ngoài)
    // ─────────────────────────────────────────────

    private SosRequestDto toDto(SosRequest sos) {
        EmergencyContactDto contactDto = sos.getAssignedContact() != null
                ? toContactDto(sos.getAssignedContact())
                : null;
        return SosRequestDto.builder()
                .id(sos.getId())
                .requesterName(sos.getRequesterName())
                .requesterPhone(sos.getRequesterPhone())
                .latitude(sos.getLatitude())
                .longitude(sos.getLongitude())
                .type(sos.getType())
                .description(sos.getDescription())
                .status(sos.getStatus())
                .assignedContact(contactDto)
                .dispatchNote(sos.getDispatchNote())
                .createdAt(sos.getCreatedAt())
                .resolvedAt(sos.getResolvedAt())
                .build();
    }

    private EmergencyContactDto toContactDto(EmergencyContact c) {
        return EmergencyContactDto.builder()
                .id(c.getId())
                .regionId(c.getRegion() != null ? c.getRegion().getId() : null)
                .regionName(c.getRegion() != null ? c.getRegion().getName() : null)
                .type(c.getType())
                .name(c.getName())
                .phone(c.getPhone())
                .address(c.getAddress())
                .isActive(c.getIsActive())
                .build();
    }
}

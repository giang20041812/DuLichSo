package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestDetailDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.FieldChangeDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestayDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.PriceInput;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.RoomInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.PartnerChangeRequestRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Phía Admin của quy trình duyệt thay đổi: xem nội dung cũ/mới, Approve (mới ghi vào dữ liệu chính thức) hoặc Reject (bắt buộc lý do).
 * Mọi quyết định được ghi audit log.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminChangeRequestService {
    private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {};

    private final PartnerChangeRequestRepository requests;
    private final AccountRepository accounts;
    private final PartnerHomestayService homestays;
    private final PartnerRoomService rooms;
    private final AuditLogService auditLogService;
    private final ObjectMapper mapper;

    public Page<ChangeRequestSummaryDto> search(ChangeRequestStatus status, Long providerId, Long placeId, ChangeTargetType targetType,
                                                String keyword, LocalDate from, LocalDate to, String sortDir, int page, int size) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ: ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        String kw = keyword == null || keyword.isBlank() ? null : keyword.trim().toLowerCase(Locale.ROOT);
        Specification<PartnerChangeRequest> spec = (root, query, cb) -> {
            boolean dataQuery = query != null && query.getResultType() != Long.class && query.getResultType() != long.class;
            Join<Object, Object> place;
            Join<Object, Object> provider;
            if (dataQuery) {
                place = cast(root.fetch("place"));
                provider = cast(root.fetch("provider"));
                root.fetch("submittedBy");
                root.fetch("reviewedBy", JoinType.LEFT);
            } else {
                place = root.join("place");
                provider = root.join("provider");
            }
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (providerId != null) ps.add(cb.equal(provider.get("id"), providerId));
            if (placeId != null) ps.add(cb.equal(place.get("id"), placeId));
            if (targetType != null) ps.add(cb.equal(root.get("targetType"), targetType));
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("submittedAt"), from.atStartOfDay()));
            if (to != null) ps.add(cb.lessThan(root.get("submittedAt"), to.plusDays(1).atStartOfDay()));
            if (kw != null) {
                String like = "%" + kw.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                ps.add(cb.or(cb.like(cb.lower(place.get("name")), like, '\\'), cb.like(cb.lower(provider.get("name")), like, '\\')));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(direction, "submittedAt").and(Sort.by(direction, "id")));
        return requests.findAll(spec, pageable).map(ChangeRequestDiff::toSummary);
    }

    @SuppressWarnings("unchecked")
    private static Join<Object, Object> cast(jakarta.persistence.criteria.Fetch<?, ?> fetch) {
        return (Join<Object, Object>) fetch;
    }

    public long pendingCount() {
        return requests.countByStatus(ChangeRequestStatus.PENDING);
    }

    public ChangeRequestDetailDto detail(Long id) {
        PartnerChangeRequest request = requests.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu thay đổi với ID: " + id));
        return toDetail(request);
    }

    @Transactional
    public ChangeRequestDetailDto approve(Long id, Long adminAccountId, String note) {
        PartnerChangeRequest request = lockPending(id);
        Account submitter = request.getSubmittedBy();
        if (submitter.getStatus() != AccountStatus.ACTIVE || request.getProvider().getStatus() != ProviderStatus.ACTIVE) {
            throw new IllegalStateException("Nhà cung cấp đang không hoạt động, không thể duyệt yêu cầu.");
        }
        Account reviewer = reviewer(adminAccountId);
        Long placeId = request.getPlace().getId();
        Map<String, Object> payload = request.getPayload();
        switch (request.getTargetType()) {
            case HOMESTAY -> homestays.applyApproved(submitter, placeId, mapper.convertValue(payload, PartnerHomestayDetailDto.class));
            case ROOM_TYPE -> rooms.applyApproved(submitter, placeId, request.getTargetId(), mapper.convertValue(payload, RoomInput.class));
            case ROOM_PRICE -> {
                if (request.getOperation() == ChangeOperation.DELETE) {
                    rooms.applyDeletePrice(submitter, placeId, request.getRoomTypeId(), request.getTargetId());
                } else {
                    rooms.applyPrice(submitter, placeId, request.getRoomTypeId(), request.getTargetId(), mapper.convertValue(payload, PriceInput.class));
                }
            }
        }
        finish(request, ChangeRequestStatus.APPROVED, reviewer, note);
        auditLogService.record(adminAccountId, "CHANGE_REQUEST_APPROVED", "ChangeRequest", id, clean(note),
                Map.of("status", ChangeRequestStatus.PENDING.name()),
                Map.of("status", ChangeRequestStatus.APPROVED.name(), "target", request.getTargetType().name(), "placeId", placeId,
                        "changes", ChangeRequestDiff.summary(request)));
        return toDetail(request);
    }

    @Transactional
    public ChangeRequestDetailDto reject(Long id, Long adminAccountId, String reason) {
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Vui lòng nhập lý do từ chối.");
        PartnerChangeRequest request = lockPending(id);
        finish(request, ChangeRequestStatus.REJECTED, reviewer(adminAccountId), reason);
        auditLogService.record(adminAccountId, "CHANGE_REQUEST_REJECTED", "ChangeRequest", id, clean(reason),
                Map.of("status", ChangeRequestStatus.PENDING.name()),
                Map.of("status", ChangeRequestStatus.REJECTED.name(), "target", request.getTargetType().name(),
                        "placeId", request.getPlace().getId()));
        return toDetail(request);
    }

    private PartnerChangeRequest lockPending(Long id) {
        PartnerChangeRequest request = requests.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu thay đổi với ID: " + id));
        if (request.getStatus() != ChangeRequestStatus.PENDING) {
            throw new IllegalStateException("Yêu cầu đã được xử lý (" + request.getStatus() + "), không thể duyệt hoặc từ chối lại.");
        }
        return request;
    }

    private Account reviewer(Long adminAccountId) {
        if (adminAccountId == null) throw new IllegalStateException("Không xác định được tài khoản quản trị đang thao tác.");
        return accounts.findById(adminAccountId)
                .orElseThrow(() -> new IllegalStateException("Không xác định được tài khoản quản trị đang thao tác."));
    }

    private void finish(PartnerChangeRequest request, ChangeRequestStatus status, Account reviewer, String note) {
        request.setStatus(status);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNote(clean(note));
    }

    private static String clean(String text) {
        if (text == null || text.isBlank()) return null;
        String trimmed = text.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    private ChangeRequestDetailDto toDetail(PartnerChangeRequest request) {
        List<FieldChangeDto> changes = ChangeRequestDiff.changes(request);
        return new ChangeRequestDetailDto(ChangeRequestDiff.toSummary(request), request.getBeforeData(), request.getPayload(), changes, isStale(request));
    }

    /** Dữ liệu chính thức có còn giống nội dung cũ NCC nhìn thấy lúc gửi không. Chỉ ý nghĩa với yêu cầu đang chờ. */
    private boolean isStale(PartnerChangeRequest request) {
        if (request.getStatus() != ChangeRequestStatus.PENDING) return false;
        try {
            Account owner = request.getSubmittedBy();
            Long placeId = request.getPlace().getId();
            Map<String, Object> current = switch (request.getTargetType()) {
                case HOMESTAY -> ChangeRequestDiff.pick(ChangeTargetType.HOMESTAY, mapper.convertValue(homestays.detailOf(request.getPlace()), MAP));
                case ROOM_TYPE -> request.getTargetId() == null ? null : ChangeRequestDiff.pick(ChangeTargetType.ROOM_TYPE,
                        rooms.listAs(owner, placeId).stream().filter(r -> request.getTargetId().equals(r.id())).findFirst()
                                .map(r -> mapper.convertValue(r, MAP)).orElseThrow());
                case ROOM_PRICE -> request.getTargetId() == null ? null : ChangeRequestDiff.pick(ChangeTargetType.ROOM_PRICE,
                        rooms.pricesAs(owner, placeId, request.getRoomTypeId()).stream().filter(p -> request.getTargetId().equals(p.id())).findFirst()
                                .map(p -> mapper.convertValue(p, MAP)).orElseThrow());
            };
            return !ChangeRequestDiff.changedFields(request.getTargetType(), request.getBeforeData(), current).isEmpty();
        } catch (RuntimeException ex) {
            // Đối tượng đã bị xóa hoặc không còn truy cập được → nội dung cũ chắc chắn không còn khớp.
            return true;
        }
    }
}

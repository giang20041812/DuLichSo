package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.SubmittedDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestayDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestaySummaryDto;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.UpdateStatusRequest;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.PriceDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.PriceInput;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.RoomDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.RoomInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.PartnerChangeRequestRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Phía NCC của quy trình duyệt thay đổi. Xác nhận nghiệp vụ (2026-09-28): sửa THÔNG TIN Homestay luôn ghi
 * trực tiếp (kể cả khi đã PUBLISHED, không phân biệt sửa nhỏ/lớn). Loại phòng/giá của Homestay đang công khai
 * vẫn tạo yêu cầu PENDING chờ Admin duyệt như trước; Homestay chưa công khai vẫn ghi trực tiếp cho mọi loại.
 * Hai việc luôn bắt buộc qua Admin duyệt bất kể trạng thái công khai: lần đầu xuất bản (HOM-MGT-BR-04, xem
 * {@link #updateStatus}) và chuyển NCC quản lý (xem {@link #requestTransfer}).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartnerChangeService {
    private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {};
    static final String PENDING_MESSAGE =
            "Homestay đang công khai nên thay đổi đã được gửi cho quản trị viên duyệt. Dữ liệu hiện hành chưa thay đổi cho đến khi được duyệt.";
    static final String PUBLISH_PENDING_MESSAGE =
            "Yêu cầu xuất bản đã được gửi cho quản trị viên duyệt. Homestay sẽ hiển thị công khai sau khi được duyệt.";
    static final String TRANSFER_PENDING_MESSAGE =
            "Yêu cầu chuyển NCC quản lý đã được gửi cho quản trị viên duyệt. Homestay vẫn do bạn quản lý cho đến khi được duyệt.";

    private final PartnerHomestayService homestays;
    private final PartnerRoomService rooms;
    private final PartnerChangeRequestRepository requests;
    private final ProviderRepository providers;
    private final ObjectMapper mapper;

    /** Kết quả một thao tác lưu: hoặc đã ghi trực tiếp ({@code saved}) hoặc đã gửi chờ duyệt ({@code pending}). */
    public record Outcome<T>(T saved, SubmittedDto pending) {
        public boolean isPending() { return pending != null; }
    }

    /**
     * Xác nhận nghiệp vụ (2026-09-28): sửa thông tin Homestay luôn ghi trực tiếp — kể cả khi đã PUBLISHED,
     * không phân biệt sửa nhỏ/lớn, không cần Admin duyệt lại. (Trước đây Homestay đã công khai phải qua yêu
     * cầu chờ duyệt; điều đó vẫn áp dụng cho lần đầu xuất bản và chuyển NCC quản lý, không áp dụng cho sửa
     * thông tin thông thường nữa.)
     */
    @Transactional
    public Outcome<PartnerHomestayDetailDto> saveHomestay(UserPrincipal principal, Long id, PartnerHomestayDetailDto dto) {
        return new Outcome<>(homestays.saveHomestayDetail(principal, id, dto), null);
    }

    @Transactional
    public Outcome<RoomDto> saveRoom(UserPrincipal principal, Long placeId, Long roomId, RoomInput input) {
        Account actor = homestays.actor(principal, true);
        Place place = homestays.owned(placeId, actor, false);
        if (!PartnerHomestayService.isPublic(place)) return new Outcome<>(rooms.save(principal, placeId, roomId, input), null);
        Map<String, Object> before = null;
        if (roomId != null) {
            RoomDto current = rooms.listAs(actor, placeId).stream().filter(r -> roomId.equals(r.id())).findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại phòng của Homestay."));
            before = ChangeRequestDiff.pick(ChangeTargetType.ROOM_TYPE, toMap(current));
        }
        Map<String, Object> after = ChangeRequestDiff.pick(ChangeTargetType.ROOM_TYPE, toMap(input));
        if (roomId != null) requireChange(ChangeTargetType.ROOM_TYPE, before, after);
        return new Outcome<>(null, submit(actor, place, ChangeTargetType.ROOM_TYPE, roomId, null,
                roomId == null ? ChangeOperation.CREATE : ChangeOperation.UPDATE, after, before));
    }

    @Transactional
    public Outcome<PriceDto> savePrice(UserPrincipal principal, Long placeId, Long roomId, Long priceId, PriceInput input) {
        Account actor = homestays.actor(principal, true);
        Place place = homestays.owned(placeId, actor, false);
        if (!PartnerHomestayService.isPublic(place)) return new Outcome<>(rooms.savePrice(principal, placeId, roomId, priceId, input), null);
        if (input.periodEnd().isBefore(input.periodStart())) throw bad("Ngày kết thúc giá phải bằng hoặc sau ngày bắt đầu.");
        Map<String, Object> before = priceId == null ? null : ChangeRequestDiff.pick(ChangeTargetType.ROOM_PRICE, toMap(currentPrice(actor, placeId, roomId, priceId)));
        Map<String, Object> after = ChangeRequestDiff.pick(ChangeTargetType.ROOM_PRICE, toMap(input));
        if (priceId != null) requireChange(ChangeTargetType.ROOM_PRICE, before, after);
        return new Outcome<>(null, submit(actor, place, ChangeTargetType.ROOM_PRICE, priceId, roomId,
                priceId == null ? ChangeOperation.CREATE : ChangeOperation.UPDATE, after, before));
    }

    /** @return null nếu đã xóa trực tiếp, ngược lại là thông tin yêu cầu chờ duyệt. */
    @Transactional
    public SubmittedDto deletePrice(UserPrincipal principal, Long placeId, Long roomId, Long priceId) {
        Account actor = homestays.actor(principal, true);
        Place place = homestays.owned(placeId, actor, false);
        if (!PartnerHomestayService.isPublic(place)) {
            rooms.deletePrice(principal, placeId, roomId, priceId);
            return null;
        }
        Map<String, Object> before = ChangeRequestDiff.pick(ChangeTargetType.ROOM_PRICE, toMap(currentPrice(actor, placeId, roomId, priceId)));
        return submit(actor, place, ChangeTargetType.ROOM_PRICE, priceId, roomId, ChangeOperation.DELETE, null, before);
    }

    /**
     * HOM-MGT-BR-04: cập nhật trạng thái hiển thị/vận hành. Lần đầu đưa Homestay sang PUBLISHED phải gửi yêu
     * cầu chờ Admin duyệt (dữ liệu hiện hành chưa đổi); các trạng thái khác (ngừng hiển thị, mở/tạm đóng) vẫn
     * ghi trực tiếp như trước.
     */
    @Transactional
    public Outcome<PartnerHomestaySummaryDto> updateStatus(UserPrincipal principal, Long id, UpdateStatusRequest request) {
        Account actor = homestays.actor(principal, true);
        Place place = homestays.owned(id, actor, false);
        boolean firstPublish = request.getVisibility() == PlaceVisibility.PUBLISHED && place.getVisibility() != PlaceVisibility.PUBLISHED;
        if (!firstPublish) return new Outcome<>(homestays.updateStatus(principal, id, request), null);
        List<String> missing = homestays.missingForPublish(place);
        if (!missing.isEmpty())
            throw bad("Homestay chưa đủ điều kiện công khai/nhận Booking, còn thiếu: " + String.join(", ", missing) + ".");
        Map<String, Object> before = Map.of("visibility", place.getVisibility().name());
        Map<String, Object> after = Map.of("visibility", PlaceVisibility.PUBLISHED.name());
        SubmittedDto pending = submit(actor, place, ChangeTargetType.HOMESTAY, null, null, ChangeOperation.PUBLISH, after, before, PUBLISH_PENDING_MESSAGE);
        return new Outcome<>(null, pending);
    }

    /**
     * Xác nhận nghiệp vụ (2026-09-28): NCC hiện tại xin chuyển Homestay sang một NCC khác quản lý — luôn phải
     * qua Admin duyệt (không tự chuyển trực tiếp), bất kể Homestay đang công khai hay chưa.
     */
    @Transactional
    public SubmittedDto requestTransfer(UserPrincipal principal, Long placeId, Long targetProviderId) {
        Account actor = homestays.actor(principal, true);
        Place place = homestays.owned(placeId, actor, false);
        if (targetProviderId == null) throw bad("Vui lòng chọn nhà cung cấp nhận chuyển.");
        if (targetProviderId.equals(place.getProvider().getId())) throw bad("Nhà cung cấp đích phải khác nhà cung cấp hiện tại.");
        Provider target = providers.findById(targetProviderId)
                .orElseThrow(() -> bad("Không tìm thấy nhà cung cấp với ID: " + targetProviderId));
        if (target.getStatus() != ProviderStatus.ACTIVE) throw bad("Nhà cung cấp nhận chuyển hiện không hoạt động.");
        Map<String, Object> before = Map.of("providerId", place.getProvider().getId(), "providerName", place.getProvider().getName());
        Map<String, Object> after = Map.of("providerId", target.getId(), "providerName", target.getName());
        return submit(actor, place, ChangeTargetType.HOMESTAY, null, null, ChangeOperation.TRANSFER, after, before, TRANSFER_PENDING_MESSAGE);
    }

    /** Các yêu cầu của chính NCC (mọi Homestay của NCC), mới nhất trước. */
    public Page<ChangeRequestSummaryDto> list(UserPrincipal principal, ChangeRequestStatus status, Long placeId, int page, int size) {
        Long providerId = homestays.actor(principal, false).getProvider().getId();
        Specification<PartnerChangeRequest> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("place");
                root.fetch("provider");
                root.fetch("submittedBy");
                root.fetch("reviewedBy", jakarta.persistence.criteria.JoinType.LEFT);
            }
            ps.add(cb.equal(root.get("provider").get("id"), providerId));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (placeId != null) ps.add(cb.equal(root.get("place").get("id"), placeId));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "submittedAt").and(Sort.by(Sort.Direction.DESC, "id")));
        return requests.findAll(spec, pageable).map(ChangeRequestDiff::toSummary);
    }

    /** NCC rút lại yêu cầu đang chờ của chính mình. */
    @Transactional
    public ChangeRequestSummaryDto cancel(UserPrincipal principal, Long id) {
        Account actor = homestays.actor(principal, true);
        PartnerChangeRequest request = requests.findByIdForUpdate(id)
                .filter(r -> r.getProvider().getId().equals(actor.getProvider().getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu thay đổi của bạn."));
        if (request.getStatus() != ChangeRequestStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yêu cầu đã được xử lý, không thể rút lại.");
        request.setStatus(ChangeRequestStatus.CANCELLED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNote("Nhà cung cấp rút lại yêu cầu.");
        return ChangeRequestDiff.toSummary(request);
    }

    private SubmittedDto submit(Account actor, Place place, ChangeTargetType type, Long targetId, Long roomTypeId,
                                ChangeOperation operation, Map<String, Object> payload, Map<String, Object> before) {
        return submit(actor, place, type, targetId, roomTypeId, operation, payload, before, PENDING_MESSAGE);
    }

    private SubmittedDto submit(Account actor, Place place, ChangeTargetType type, Long targetId, Long roomTypeId,
                                ChangeOperation operation, Map<String, Object> payload, Map<String, Object> before, String message) {
        // Yêu cầu mới thay thế yêu cầu đang chờ trước đó cho cùng đối tượng; tạo mới nhiều đối tượng thì không thay thế nhau.
        if (type == ChangeTargetType.HOMESTAY || targetId != null) {
            for (PartnerChangeRequest old : requests.findOpen(ChangeRequestStatus.PENDING, place.getId(), type, targetId, roomTypeId)) {
                old.setStatus(ChangeRequestStatus.CANCELLED);
                old.setReviewedAt(LocalDateTime.now());
                old.setReviewNote("Được thay thế bằng yêu cầu mới của nhà cung cấp.");
            }
        }
        PartnerChangeRequest saved = requests.save(PartnerChangeRequest.builder()
                .provider(place.getProvider()).place(place).targetType(type).targetId(targetId).roomTypeId(roomTypeId)
                .operation(operation).payload(payload).beforeData(before).submittedBy(actor).build());
        return new SubmittedDto(saved.getId(), saved.getStatus(), message);
    }

    private PriceDto currentPrice(Account actor, Long placeId, Long roomId, Long priceId) {
        return rooms.pricesAs(actor, placeId, roomId).stream().filter(p -> priceId.equals(p.id())).findFirst()
                .orElseThrow(() -> bad("Không tìm thấy bảng giá."));
    }

    private void requireChange(ChangeTargetType type, Map<String, Object> before, Map<String, Object> after) {
        if (ChangeRequestDiff.changedFields(type, before, after).isEmpty()) throw bad("Không có thay đổi nào so với dữ liệu hiện tại.");
    }

    private Map<String, Object> toMap(Object value) {
        return mapper.convertValue(value, MAP);
    }

    private static ResponseStatusException bad(String text) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, text);
    }
}

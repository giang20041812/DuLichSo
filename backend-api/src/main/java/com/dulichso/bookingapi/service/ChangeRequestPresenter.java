package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeContextDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestDetailDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.HomestayInfoDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.ProviderInfoDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.RoomInfoDto;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Chi tiết yêu cầu thay đổi cho màn Admin: mọi trường hiển thị giống form của NCC (tên tiện nghi thay cho mã,
 * "Có phòng tắm riêng" thay cho YES, giá có định dạng tiền...) kèm ngữ cảnh nhà cung cấp / Homestay / loại phòng.
 * Chỉ đọc; phần nghiệp vụ duyệt / từ chối vẫn ở {@link AdminChangeRequestService}.
 */
@Service
@RequiredArgsConstructor
public class ChangeRequestPresenter {
    private static final Locale VI = Locale.forLanguageTag("vi-VN");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AdminChangeRequestService service;
    private final EntityManager em;

    @Transactional(readOnly = true)
    public ChangeRequestDetailDto detail(Long id) {
        ChangeRequestDetailDto base = service.detail(id);
        ChangeRequestSummaryDto s = base.summary();
        // Chỉ dùng để so sánh / định dạng: dữ liệu gốc lấy từ chi tiết vừa đọc, không ghi gì.
        PartnerChangeRequest view = PartnerChangeRequest.builder().targetType(s.targetType()).operation(s.operation())
                .beforeData(base.before()).payload(base.after()).build();
        ChangeRequestDiff.Display display = display(amenityNames(base.before(), base.after()));
        return new ChangeRequestDetailDto(s, base.before(), base.after(), ChangeRequestDiff.changes(view, display),
                ChangeRequestDiff.fields(view, display), context(s), base.stale());
    }

    private ChangeContextDto context(ChangeRequestSummaryDto s) {
        Provider p = s.providerId() == null ? null : em.find(Provider.class, s.providerId());
        ProviderInfoDto provider = p == null ? null : new ProviderInfoDto(p.getId(), p.getName(), p.getContactName(),
                p.getContactPhone(), p.getContactEmail(), p.getAddress(), p.getStatus() == null ? null : p.getStatus().name());
        Place place = s.placeId() == null ? null : em.find(Place.class, s.placeId());
        HomestayInfoDto homestay = null;
        if (place != null) {
            long rooms = em.createQuery("select count(r) from RoomType r where r.place.id = :id", Long.class)
                    .setParameter("id", place.getId()).getSingleResult();
            homestay = new HomestayInfoDto(place.getId(), place.getName(), place.getAddress(),
                    place.getRegion() == null ? null : place.getRegion().getName(),
                    place.getVisibility() == null ? null : place.getVisibility().name(),
                    place.getVerification() == null ? null : place.getVerification().name(), rooms);
        }
        Long roomId = s.targetType() == ChangeTargetType.ROOM_TYPE ? s.targetId()
                : s.targetType() == ChangeTargetType.ROOM_PRICE ? s.roomTypeId() : null;
        RoomType r = roomId == null ? null : em.find(RoomType.class, roomId);
        RoomInfoDto room = r == null ? null : new RoomInfoDto(r.getId(), r.getName(), r.getTotalRoomCount(), r.getMaxOccupancy(),
                r.getBasePrice(), r.getWeekendPrice(), r.getStatus());
        return new ChangeContextDto(provider, homestay, room);
    }

    /** Tên tiện nghi cho các mã xuất hiện ở bản cũ / mới (một truy vấn). */
    private Map<Long, String> amenityNames(Map<String, Object> before, Map<String, Object> after) {
        List<Long> ids = new ArrayList<>();
        for (Map<String, Object> data : List.of(before == null ? Map.<String, Object>of() : before, after == null ? Map.<String, Object>of() : after)) {
            if (data.get("amenityIds") instanceof Collection<?> list) {
                for (Object v : list) if (v instanceof Number n) ids.add(n.longValue());
            }
        }
        Map<Long, String> names = new HashMap<>();
        if (ids.isEmpty()) return names;
        for (Object[] row : em.createQuery("select a.id, a.name from Amenity a where a.id in :ids", Object[].class)
                .setParameter("ids", ids).getResultList()) {
            names.put((Long) row[0], (String) row[1]);
        }
        return names;
    }

    static ChangeRequestDiff.Display display(Map<Long, String> amenityNames) {
        return (field, raw, normalized) -> {
            if ("weekendPrice".equals(field)) return normalized.isEmpty() ? "Bằng giá ngày thường" : money(normalized);
            if (normalized.isEmpty()) return "";
            return switch (field) {
                case "amenityIds" -> raw instanceof Collection<?> list
                        ? list.stream().map(v -> v instanceof Number n ? amenityNames.getOrDefault(n.longValue(), "#" + n) : String.valueOf(v))
                                .sorted().collect(Collectors.joining(", "))
                        : normalized;
                case "privateBathroom" -> switch (normalized) {
                    case "YES" -> "Có phòng tắm riêng";
                    case "NO" -> "Dùng chung";
                    default -> "Chưa xác định";
                };
                case "status" -> "ACTIVE".equals(normalized) ? "Mở bán" : "INACTIVE".equals(normalized) ? "Ngừng bán" : normalized;
                case "basePrice", "price" -> money(normalized);
                case "areaSqm" -> normalized + " m²";
                case "beds" -> raw instanceof Collection<?> list
                        ? list.stream().map(ChangeRequestPresenter::bed).filter(b -> !b.isEmpty()).collect(Collectors.joining(", "))
                        : normalized;
                case "periodStart", "periodEnd" -> date(normalized);
                case "visibility" -> "PUBLISHED".equals(normalized) ? "Công khai" : "DRAFT".equals(normalized) ? "Bản nháp" : normalized;
                case "refundOnLateCancel" -> "FULL_REFUND".equals(normalized) ? "Hoàn toàn bộ tiền"
                        : "NO_REFUND".equals(normalized) ? "Không hoàn tiền" : normalized;
                case "freeCancelCutoffHours" -> normalized + " giờ";
                default -> normalized;
            };
        };
    }

    /** "2 giường đôi" — giống cách Cổng NCC hiển thị giường của loại phòng. */
    private static String bed(Object value) {
        if (!(value instanceof Map<?, ?> map)) return ChangeRequestDiff.norm(value);
        String type = ChangeRequestDiff.norm(map.get("bedType"));
        String quantity = ChangeRequestDiff.norm(map.get("quantity"));
        return (quantity + " " + type.toLowerCase(VI)).trim();
    }

    private static String money(String normalized) {
        try {
            return NumberFormat.getIntegerInstance(VI).format(new BigDecimal(normalized)) + " đ";
        } catch (NumberFormatException ex) {
            return normalized;
        }
    }

    private static String date(String normalized) {
        try {
            return LocalDate.parse(normalized).format(DATE);
        } catch (DateTimeParseException ex) {
            return normalized;
        }
    }
}

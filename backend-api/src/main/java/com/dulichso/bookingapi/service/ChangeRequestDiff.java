package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.FieldChangeDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.FieldDiffDto;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Xác định các trường NCC được phép đề xuất thay đổi và so sánh nội dung cũ/mới để Admin duyệt.
 * Chỉ các trường trong danh sách mới được lưu vào yêu cầu (id, trạng thái hiển thị, ảnh... không bao giờ đi theo đường này).
 */
final class ChangeRequestDiff {
    private ChangeRequestDiff() {}

    static final Map<String, String> HOMESTAY = fields(
            "name", "Tên Homestay", "description", "Mô tả", "address", "Địa chỉ", "regionId", "Khu vực (mã)",
            "latitude", "Vĩ độ", "longitude", "Kinh độ", "googleMapLink", "Link Google Maps", "accessNote", "Hướng dẫn đường đi", "contactPhone", "Số điện thoại",
            "contactEmail", "Email", "reviewVideoUrl", "Video review TikTok", "facebookUrl", "Fanpage Facebook", "amenities", "Tiện nghi",
            "viewHighlight", "Điểm nổi bật / view", "suitability", "Nhóm khách phù hợp",
            "checkInFrom", "Giờ nhận phòng", "checkOutUntil", "Giờ trả phòng", "processingStartTime", "Bắt đầu xử lý đơn", "processingEndTime", "Kết thúc xử lý đơn","houseRules", "Nội quy",
            "surchargeNote", "Phụ thu", "childrenPolicy", "Chính sách trẻ em", "petsPolicy", "Chính sách thú cưng",
            "policyName", "Tên chính sách hủy", "cancellationPolicy", "Nội dung chính sách hủy",
            "freeCancelCutoffHours", "Số giờ hủy miễn phí", "refundOnLateCancel", "Hoàn tiền khi hủy muộn");

    /** Trường loại phòng theo đúng thứ tự và nhãn của form NCC (Cổng NCC → Loại phòng). */
    static final Map<String, String> ROOM = fields(
            "name", "Tên loại phòng", "totalRoomCount", "Tổng số phòng", "maxOccupancy", "Khách tối đa mỗi phòng",
            "areaSqm", "Diện tích (m²)", "privateBathroom", "Phòng tắm riêng", "basePrice", "Giá ngày thường / phòng / đêm",
            "weekendPrice", "Giá cuối tuần (T7, CN)", "beds", "Giường ngủ", "viewDescription", "Vị trí / hướng nhìn",
            "description", "Mô tả", "amenityIds", "Tiện nghi phòng", "status", "Trạng thái bán");

    /** Giá theo mùa của loại phòng, theo form NCC. */
    static final Map<String, String> PRICE = fields(
            "name", "Tên đợt giá", "periodStart", "Từ ngày", "periodEnd", "Đến ngày", "price", "Giá / phòng / đêm");

    /** Chuyển giá trị gốc của một trường thành chuỗi hiển thị cho Admin (vd mã tiện nghi → tên); so sánh vẫn dùng {@link #norm}. */
    @FunctionalInterface
    interface Display {
        String of(String field, Object raw, String normalized);

        Display RAW = (field, raw, normalized) -> normalized;
    }

    private static Map<String, String> fields(String... pairs) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) map.put(pairs[i], pairs[i + 1]);
        return java.util.Collections.unmodifiableMap(map);
    }

    static Map<String, String> fieldsOf(ChangeTargetType type) {
        return switch (type) {
            case HOMESTAY -> HOMESTAY;
            case ROOM_TYPE -> ROOM;
            case ROOM_PRICE -> PRICE;
        };
    }

    /** Chỉ giữ các trường được phép của đối tượng; null nếu nguồn null. */
    static Map<String, Object> pick(ChangeTargetType type, Map<String, Object> source) {
        if (source == null) return null;
        Map<String, Object> out = new LinkedHashMap<>();
        for (String key : fieldsOf(type).keySet()) out.put(key, source.get(key));
        return out;
    }

    /** Danh sách trường có thay đổi giữa nội dung cũ và mới của một yêu cầu. */
    static List<FieldChangeDto> changes(PartnerChangeRequest request) {
        return changes(request, Display.RAW);
    }

    /** Như {@link #changes(PartnerChangeRequest)} nhưng giá trị hiển thị theo {@code display}. */
    static List<FieldChangeDto> changes(PartnerChangeRequest request, Display display) {
        return fields(request, display).stream().filter(FieldDiffDto::changed)
                .map(f -> new FieldChangeDto(f.field(), f.label(), f.before(), f.after())).toList();
    }

    static List<FieldDiffDto> fields(PartnerChangeRequest request) {
        return fields(request, Display.RAW);
    }

    /**
     * Toàn bộ trường của đối tượng trong yêu cầu theo thứ tự hiển thị, kể cả trường không đổi (before = after),
     * để Admin xem đủ nội dung: trường có thay đổi so sánh cũ/mới, trường không đổi giữ nguyên giá trị.
     * Việc so sánh luôn dùng giá trị chuẩn hóa ({@link #norm}); {@code display} chỉ quyết định chuỗi hiển thị.
     */
    static List<FieldDiffDto> fields(PartnerChangeRequest request, Display display) {
        Map<String, Object> before = request.getBeforeData();
        Map<String, Object> after = request.getPayload();
        // HOM-MGT-BR-04: yêu cầu xuất bản không nằm trong danh sách trường whitelist của HOMESTAY (visibility
        // không phải trường NCC được sửa nội dung) — hiển thị riêng một dòng "Trạng thái hiển thị".
        if (request.getOperation() == ChangeOperation.PUBLISH) {
            return List.of(diff("visibility", "Trạng thái hiển thị", value(before, "visibility"), value(after, "visibility"), false, display));
        }
        // Chuyển NCC: cũng không nằm trong whitelist trường HOMESTAY — hiển thị riêng một dòng "Nhà cung cấp quản lý".
        if (request.getOperation() == ChangeOperation.TRANSFER) {
            return List.of(diff("providerId", "Nhà cung cấp quản lý", value(before, "providerName"), value(after, "providerName"), false, display));
        }
        boolean delete = request.getOperation() == ChangeOperation.DELETE;
        List<FieldDiffDto> out = new ArrayList<>();
        for (Map.Entry<String, String> field : fieldsOf(request.getTargetType()).entrySet()) {
            out.add(diff(field.getKey(), field.getValue(), value(before, field.getKey()), value(after, field.getKey()), delete, display));
        }
        return out;
    }

    private static Object value(Map<String, Object> data, String key) {
        return data == null ? null : data.get(key);
    }

    private static FieldDiffDto diff(String field, String label, Object before, Object after, boolean delete, Display display) {
        String oldNorm = norm(before);
        String newNorm = delete ? "(xóa)" : norm(after);
        String oldText = display.of(field, before, oldNorm);
        String newText = delete ? "(xóa)" : display.of(field, after, newNorm);
        return new FieldDiffDto(field, label, oldText, newText, !oldNorm.equals(newNorm));
    }

    /** Các trường có thay đổi giữa hai bản dữ liệu (không gắn với một yêu cầu cụ thể). */
    static List<String> changedFields(ChangeTargetType type, Map<String, Object> before, Map<String, Object> after) {
        List<String> out = new ArrayList<>();
        for (String key : fieldsOf(type).keySet()) {
            String a = before == null ? "" : norm(before.get(key));
            String b = after == null ? "" : norm(after.get(key));
            if (!a.equals(b)) out.add(key);
        }
        return out;
    }

    /** Chuẩn hóa để so sánh/hiển thị: null và chuỗi rỗng như nhau, số không phân biệt 500000 với 500000.0, danh sách không phân biệt thứ tự. */
    static String norm(Object value) {
        if (value == null) return "";
        if (value instanceof Number number) {
            try {
                BigDecimal decimal = new BigDecimal(number.toString()).stripTrailingZeros();
                return decimal.scale() < 0 ? decimal.setScale(0).toPlainString() : decimal.toPlainString();
            } catch (NumberFormatException ex) {
                return number.toString();
            }
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(ChangeRequestDiff::norm).filter(s -> !s.isEmpty()).sorted().collect(Collectors.joining(", "));
        }
        if (value instanceof Map<?, ?> map) {
            Object bedType = map.get("bedType");
            Object quantity = map.get("quantity");
            if (bedType != null && quantity != null) return norm(bedType) + " ×" + norm(quantity);
            return map.entrySet().stream().map(e -> e.getKey() + "=" + norm(e.getValue())).sorted().collect(Collectors.joining(", "));
        }
        return value.toString().trim();
    }

    /** Tên hiển thị của đối tượng bị thay đổi. */
    static String targetName(PartnerChangeRequest request) {
        Object name = request.getPayload() != null ? request.getPayload().get("name") : null;
        if (name == null && request.getBeforeData() != null) name = request.getBeforeData().get("name");
        if (name == null || name.toString().isBlank()) name = request.getPlace().getName();
        return name.toString();
    }

    /** Tóm tắt các trường thay đổi, ví dụ "Tên loại phòng, Giá cơ bản". */
    static String summary(PartnerChangeRequest request) {
        if (request.getOperation() == ChangeOperation.DELETE) return "Xóa " + targetName(request);
        if (request.getOperation() == ChangeOperation.CREATE) return "Tạo mới " + targetName(request);
        if (request.getOperation() == ChangeOperation.PUBLISH) return "Yêu cầu xuất bản " + targetName(request);
        if (request.getOperation() == ChangeOperation.TRANSFER) {
            Object providerName = request.getPayload() == null ? null : request.getPayload().get("providerName");
            return "Chuyển quản lý sang " + (providerName == null ? "NCC khác" : providerName);
        }
        return changes(request).stream().map(FieldChangeDto::label).collect(Collectors.joining(", "));
    }

    /** Bản tóm tắt của yêu cầu; gọi trong transaction vì đọc các quan hệ lazy. */
    static ChangeRequestSummaryDto toSummary(PartnerChangeRequest r) {
        return new ChangeRequestSummaryDto(r.getId(), r.getTargetType(), r.getOperation(), r.getStatus(),
                r.getPlace().getId(), r.getPlace().getName(), r.getProvider().getId(), r.getProvider().getName(),
                r.getTargetId(), r.getRoomTypeId(), targetName(r), summary(r),
                r.getSubmittedBy().getFullName(), r.getSubmittedAt(),
                r.getReviewedBy() == null ? null : r.getReviewedBy().getFullName(), r.getReviewedAt(), r.getReviewNote());
    }
}

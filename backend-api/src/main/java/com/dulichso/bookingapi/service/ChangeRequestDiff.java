package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.dto.ChangeRequestDtos.FieldChangeDto;
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
            "latitude", "Vĩ độ", "longitude", "Kinh độ", "accessNote", "Hướng dẫn đường đi", "contactPhone", "Số điện thoại",
            "contactEmail", "Email", "reviewVideoUrl", "Video review TikTok", "amenities", "Tiện nghi",
            "checkInFrom", "Giờ nhận phòng", "checkOutUntil", "Giờ trả phòng", "processingStartTime", "Bắt đầu xử lý đơn", "processingEndTime", "Kết thúc xử lý đơn","houseRules", "Nội quy",
            "surchargeNote", "Phụ thu", "childrenPolicy", "Chính sách trẻ em", "petsPolicy", "Chính sách thú cưng",
            "guestPolicy", "Chính sách khách", "policyName", "Tên chính sách hủy", "cancellationPolicy", "Nội dung chính sách hủy",
            "freeCancelCutoffHours", "Số giờ hủy miễn phí", "refundOnLateCancel", "Hoàn tiền khi hủy muộn");

    static final Map<String, String> ROOM = fields(
            "name", "Tên loại phòng", "description", "Mô tả", "maxOccupancy", "Số khách tối đa", "totalRoomCount", "Tổng số phòng",
            "privateBathroom", "Phòng tắm riêng", "areaSqm", "Diện tích (m²)", "basePrice", "Giá cơ bản", "weekendPrice", "Giá cuối tuần",
            "status", "Trạng thái", "viewDescription", "Tầm nhìn", "beds", "Giường", "amenityIds", "Tiện nghi phòng (mã)");

    static final Map<String, String> PRICE = fields(
            "name", "Tên bảng giá", "periodStart", "Từ ngày", "periodEnd", "Đến ngày", "price", "Giá");

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
        Map<String, String> labels = fieldsOf(request.getTargetType());
        Map<String, Object> before = request.getBeforeData();
        Map<String, Object> after = request.getPayload();
        boolean delete = request.getOperation() == ChangeOperation.DELETE;
        List<FieldChangeDto> out = new ArrayList<>();
        for (Map.Entry<String, String> field : labels.entrySet()) {
            String oldValue = before == null ? "" : norm(before.get(field.getKey()));
            String newValue = delete ? "(xóa)" : after == null ? "" : norm(after.get(field.getKey()));
            if (!oldValue.equals(newValue)) out.add(new FieldChangeDto(field.getKey(), field.getValue(), oldValue, newValue));
        }
        return out;
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

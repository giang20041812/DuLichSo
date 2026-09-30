package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.RefundType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Phần "trưng bày" của một cơ sở dùng ở màn chi tiết phía Admin (Duyệt điểm đến, Hồ sơ nhà cung cấp): hình ảnh,
 * tiện nghi và chính sách lưu trú. Chỉ đọc — lấy từ place_media, place_amenity, homestay_profile + cancellation_policy.
 */
public final class PlaceShowcaseDtos {
    private PlaceShowcaseDtos() {}

    /** Một ảnh của cơ sở; {@code cover} = ảnh bìa. */
    public record ImageDto(String url, String caption, boolean cover) {}

    /** Chính sách lưu trú của Homestay; các trường chữ để rỗng khi NCC chưa khai. */
    public record StayPolicyDto(String checkInFrom, String checkOutUntil, String houseRules, String surchargeNote,
                                String childrenPolicy, String petsPolicy, String suitability,
                                String cancellationPolicyName, String cancellationPolicy, Integer freeCancelCutoffHours,
                                RefundType refundOnLateCancel) {}

    /** Giá theo mùa của một loại phòng. */
    public record SeasonalPriceDto(String name, LocalDate periodStart, LocalDate periodEnd, BigDecimal price) {}

    /**
     * Loại phòng với đủ các trường NCC khai ở Cổng NCC → Loại phòng. {@code privateBathroom}: AmenityValue,
     * {@code status}: ACTIVE / INACTIVE; {@code beds} đã ghép sẵn dạng "2 giường đôi".
     */
    public record RoomShowcaseDto(Long id, String name, Integer totalRoomCount, Integer maxOccupancy, BigDecimal areaSqm,
                                  String privateBathroom, BigDecimal basePrice, BigDecimal weekendPrice, String status,
                                  String viewDescription, String description, List<String> beds, List<String> amenities,
                                  List<SeasonalPriceDto> seasonalPrices) {}

    /**
     * {@code placeId}/{@code placeName}: cơ sở làm nguồn dữ liệu (null khi chưa có cơ sở nào, vd hồ sơ NCC chưa được duyệt).
     * {@code stayPolicy} null khi cơ sở không phải Homestay hoặc chưa khai chính sách; {@code rooms} rỗng khi không phải Homestay.
     */
    public record PlaceShowcaseDto(Long placeId, String placeName, List<ImageDto> images, List<String> amenities,
                                   StayPolicyDto stayPolicy, List<RoomShowcaseDto> rooms) {
        public static PlaceShowcaseDto empty() {
            return new PlaceShowcaseDto(null, null, List.of(), List.of(), null, List.of());
        }
    }
}

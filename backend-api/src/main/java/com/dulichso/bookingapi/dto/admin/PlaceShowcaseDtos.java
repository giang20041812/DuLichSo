package com.dulichso.bookingapi.dto.admin;

import com.dulichso.bookingapi.entity.enums.RefundType;

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
                                String childrenPolicy, String petsPolicy, String guestPolicy,
                                String cancellationPolicyName, String cancellationPolicy, Integer freeCancelCutoffHours,
                                RefundType refundOnLateCancel) {}

    /**
     * {@code placeId}/{@code placeName}: cơ sở làm nguồn dữ liệu (null khi chưa có cơ sở nào, vd hồ sơ NCC chưa được duyệt).
     * {@code stayPolicy} null khi cơ sở không phải Homestay hoặc chưa khai chính sách.
     */
    public record PlaceShowcaseDto(Long placeId, String placeName, List<ImageDto> images, List<String> amenities,
                                   StayPolicyDto stayPolicy) {
        public static PlaceShowcaseDto empty() {
            return new PlaceShowcaseDto(null, null, List.of(), List.of(), null);
        }
    }
}

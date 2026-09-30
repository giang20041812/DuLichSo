package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.AmenityScope;

/** Một tiện ích dùng cho bộ lọc tìm kiếm công khai; {@code code} là giá trị gửi lại qua tham số {@code amenities}. */
public record PublicAmenityDto(String code, String name, AmenityScope scope) {}

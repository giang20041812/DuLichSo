package com.dulichso.bookingapi.dto;

/**
 * Lỗi gắn với một trường nhập cụ thể (vd email đã được sử dụng) để frontend hiển thị ngay dưới ô tương ứng.
 * {@code field} là đúng tên thuộc tính trong request body (vd "email", "contactPhone", "businessLicenseNo").
 */
public record FieldErrorDto(String field, String message) {}

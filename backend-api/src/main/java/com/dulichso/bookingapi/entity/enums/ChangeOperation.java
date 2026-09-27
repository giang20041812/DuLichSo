package com.dulichso.bookingapi.entity.enums;

public enum ChangeOperation {
    CREATE, UPDATE, DELETE,
    /** HOM-MGT-BR-04: NCC yêu cầu đưa Homestay từ chưa công khai (DRAFT/UNPUBLISHED) sang PUBLISHED lần đầu — chờ Admin duyệt. */
    PUBLISH,
    /** Xác nhận nghiệp vụ (2026-09-28): NCC hiện tại xin chuyển Homestay sang NCC khác quản lý — chờ Admin duyệt. */
    TRANSFER
}

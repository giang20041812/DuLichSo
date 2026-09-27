package com.dulichso.bookingapi.entity.enums;

/** PENDING → APPROVED (đã ghi vào dữ liệu chính thức) | REJECTED (Admin từ chối) | CANCELLED (NCC rút lại hoặc bị yêu cầu mới thay thế). */
public enum ChangeRequestStatus {
    PENDING, APPROVED, REJECTED, CANCELLED
}

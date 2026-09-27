package com.dulichso.bookingapi.entity.enums;

/** Loại ghi chú giám sát của Admin trên một Booking. */
public enum BookingNoteKind {
    /** Thông tin được làm rõ/xác minh trong quá trình kiểm tra (FR-AD-09). */
    VERIFICATION,
    /** Kết quả kiểm tra và hướng xử lý/hỗ trợ (FR-AD-10). */
    OUTCOME
}

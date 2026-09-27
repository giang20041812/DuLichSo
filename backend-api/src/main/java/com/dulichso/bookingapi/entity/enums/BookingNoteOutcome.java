package com.dulichso.bookingapi.entity.enums;

/** Kết luận khi ghi nhận kết quả giám sát Booking. */
public enum BookingNoteOutcome {
    /** Đã kiểm tra, không có vấn đề. */
    NO_ISSUE,
    /** Đã hỗ trợ khách/NCC xong. */
    SUPPORTED,
    /** Đã chuyển NCC/bộ phận liên quan xử lý. */
    ESCALATED,
    /** Cần tiếp tục theo dõi — Booking vẫn nằm trong danh sách cần chú ý. */
    FOLLOW_UP
}

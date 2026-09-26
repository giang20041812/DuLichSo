package com.dulichso.bookingapi.entity.enums;

public enum ReviewStatus {
    /** Đang hiển thị công khai. */
    VISIBLE,
    /** Admin đã ẩn (có thể khôi phục). */
    HIDDEN,
    /** Admin đã gỡ vì vi phạm tiêu chuẩn (không khôi phục). */
    REMOVED
}

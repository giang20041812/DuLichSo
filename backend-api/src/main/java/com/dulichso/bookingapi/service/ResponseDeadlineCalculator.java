package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.HomestayProfile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * BOOK-BR-11: NCC có tối đa 120 phút để phản hồi đơn, chỉ tính trong khung giờ xử lý của Homestay.
 * Ngoài khung giờ thì tạm dừng đếm, sang khung giờ hôm sau đếm tiếp.
 * Khung giờ do NCC tự chọn trên trang Homestay; chưa chọn thì dùng mặc định 05:00 - 21:00.
 *
 * Ví dụ với khung 05:00 - 21:00: tạo đơn 20:30 -> còn 30 phút hôm nay, 90 phút còn lại tính từ 05:00 hôm sau -> hạn 06:30.
 * Tạo đơn 23:00 -> bắt đầu đếm từ 05:00 hôm sau -> hạn 07:00.
 */
public final class ResponseDeadlineCalculator {
    public static final LocalTime DEFAULT_START = LocalTime.of(5, 0);
    public static final LocalTime DEFAULT_END = LocalTime.of(21, 0);
    public static final Duration RESPONSE_BUDGET = Duration.ofMinutes(120);

    private ResponseDeadlineCalculator() {}

    /** Khung giờ hợp lệ: nằm trong một ngày, giờ bắt đầu trước giờ kết thúc. */
    public static boolean isValidWindow(LocalTime start, LocalTime end) {
        return start != null && end != null && start.isBefore(end);
    }

    /** Hạn phản hồi theo khung giờ của Homestay (profile có thể null hoặc chưa chọn khung giờ). */
    public static LocalDateTime deadline(LocalDateTime createdAt, HomestayProfile profile) {
        LocalTime start = profile == null ? null : profile.getProcessingStartTime();
        LocalTime end = profile == null ? null : profile.getProcessingEndTime();
        return deadline(createdAt, start, end, RESPONSE_BUDGET);
    }

    /** Cộng {@code budget} vào {@code createdAt}, chỉ tính thời gian nằm trong khung [start, end) mỗi ngày. */
    public static LocalDateTime deadline(LocalDateTime createdAt, LocalTime start, LocalTime end, Duration budget) {
        if (!isValidWindow(start, end)) { start = DEFAULT_START; end = DEFAULT_END; }
        Duration remaining = budget;
        LocalDateTime t = createdAt;
        while (true) {
            LocalDateTime windowStart = t.toLocalDate().atTime(start);
            LocalDateTime windowEnd = t.toLocalDate().atTime(end);
            if (t.isBefore(windowStart)) t = windowStart;
            if (!t.isBefore(windowEnd)) { t = windowStart.plusDays(1); continue; }
            Duration available = Duration.between(t, windowEnd);
            if (remaining.compareTo(available) <= 0) return t.plus(remaining);
            remaining = remaining.minus(available);
            t = windowStart.plusDays(1);
        }
    }
}

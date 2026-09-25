package com.dulichso.bookingapi.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Giới hạn số lần gọi theo khóa (thường là IP + tên hành động) trong một cửa sổ thời gian cố định.
 * Chỉ trong bộ nhớ một instance — đủ chặn dò mã đơn / spam đăng ký ở mức cơ bản; chạy nhiều instance thì chuyển sang Redis.
 */
@Component
public class SimpleRateLimiter {
    private record Window(long startedAt, int count) {}
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public void check(HttpServletRequest request, String action, int limit, Duration window) {
        String key = action + ":" + request.getRemoteAddr();
        long now = System.currentTimeMillis();
        Window updated = windows.compute(key, (k, w) -> w == null || now - w.startedAt() >= window.toMillis()
                ? new Window(now, 1) : new Window(w.startedAt(), w.count() + 1));
        if (updated.count() > limit)
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.");
        if (windows.size() > 10_000) windows.entrySet().removeIf(e -> now - e.getValue().startedAt() >= window.toMillis());
    }
}

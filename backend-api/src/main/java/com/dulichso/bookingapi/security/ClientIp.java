package com.dulichso.bookingapi.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Lấy địa chỉ IP client để ghi audit log. Chỉ phục vụ ghi vết, KHÔNG dùng để ra quyết định
 * bảo mật vì X-Forwarded-For có thể bị client giả mạo.
 */
public final class ClientIp {

    private static final int MAX_LENGTH = 64;

    private ClientIp() {}

    /** IP của request đang xử lý trên thread hiện tại; null nếu không nằm trong request. */
    public static String current() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        return attributes instanceof ServletRequestAttributes servlet ? of(servlet.getRequest()) : null;
    }

    public static String of(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
        if (ip == null) return null;
        return ip.length() > MAX_LENGTH ? ip.substring(0, MAX_LENGTH) : ip;
    }
}

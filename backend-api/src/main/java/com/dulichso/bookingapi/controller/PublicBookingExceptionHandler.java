package com.dulichso.bookingapi.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

/** Chuẩn hóa lỗi nghiệp vụ cho API đặt phòng công khai, gồm cả gửi đánh giá. */
@RestControllerAdvice(assignableTypes = PublicBookingController.class)
public class PublicBookingExceptionHandler {

    private static ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(Map.of("status", status.value(), "message", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, messageOrDefault(ex, "Yêu cầu không hợp lệ."));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> conflict(IllegalStateException ex) {
        return body(HttpStatus.CONFLICT, messageOrDefault(ex, "Thao tác không được phép ở trạng thái hiện tại."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .filter(defaultMessage -> defaultMessage != null && !defaultMessage.isBlank())
                .findFirst()
                .orElse("Dữ liệu gửi lên không hợp lệ.");
        return body(HttpStatus.BAD_REQUEST, message);
    }

    private static String messageOrDefault(RuntimeException ex, String fallback) {
        return ex.getMessage() != null && !ex.getMessage().isBlank() ? ex.getMessage() : fallback;
    }
}

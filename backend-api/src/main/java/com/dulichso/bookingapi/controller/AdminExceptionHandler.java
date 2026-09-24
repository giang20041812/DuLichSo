package com.dulichso.bookingapi.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

/**
 * Chuẩn hóa lỗi cho các API admin: trả JSON {status, message} thay vì 403 rỗng
 * (lỗi không bắt sẽ bị forward sang /error và bị Spring Security chặn thành 403).
 */
@RestControllerAdvice(assignableTypes = {
        AdminAccountController.class,
        AdminBookingController.class,
        AdminReportController.class,
        AdminFinanceController.class,
        AdminDashboardController.class,
        AdminSosController.class
})
public class AdminExceptionHandler {

    private static ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("status", status.value(), "message", message));
    }

    /** Dữ liệu không hợp lệ hoặc trùng lặp (email/SĐT đã tồn tại, không tìm thấy...). */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage() != null ? ex.getMessage() : "Yêu cầu không hợp lệ.");
    }

    /** Thao tác bị từ chối do trạng thái hiện tại (vd: tự khóa chính mình). */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> conflict(IllegalStateException ex) {
        return body(HttpStatus.CONFLICT, ex.getMessage() != null ? ex.getMessage() : "Thao tác không được phép ở trạng thái hiện tại.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getDefaultMessage())
                .findFirst().orElse("Dữ liệu gửi lên không hợp lệ.");
        return body(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> unreadable(Exception ex) {
        return body(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng.");
    }
}

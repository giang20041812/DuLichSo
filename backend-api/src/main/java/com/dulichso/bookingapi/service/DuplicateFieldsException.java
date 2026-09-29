package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.FieldErrorDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Đăng ký bị trùng thông tin (409): mang theo đủ danh sách các trường bị trùng — không dừng ở trường đầu tiên — để
 * frontend báo lỗi dưới từng ô. {@link #getReason()} là câu tổng hợp cho nơi chỉ hiển thị được một thông báo.
 */
public class DuplicateFieldsException extends ResponseStatusException {
    private final transient List<FieldErrorDto> fieldErrors;

    public DuplicateFieldsException(List<FieldErrorDto> fieldErrors) {
        super(HttpStatus.CONFLICT, fieldErrors.stream().map(FieldErrorDto::message).collect(Collectors.joining(". ")) + ".");
        this.fieldErrors = List.copyOf(fieldErrors);
    }

    public List<FieldErrorDto> getFieldErrors() {
        return fieldErrors;
    }
}

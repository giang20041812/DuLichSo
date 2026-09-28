package com.dulichso.bookingapi.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestControllerAdvice(assignableTypes={PartnerRoomController.class,PartnerOfferController.class,PartnerBookingController.class,
        PartnerReviewController.class,PartnerMediaController.class,ProviderApplicationController.class,
        PartnerGeocodeController.class,PartnerCalendarController.class,PartnerChangeRequestController.class})
public class PartnerOperationErrors {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String,String>> status(ResponseStatusException ex) {return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message",ex.getReason()==null?"Yêu cầu không hợp lệ.":ex.getReason()));}
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException ex) {
        // Thông báo tiếng Việt khai báo sẵn trên DTO (vd "Giá phòng phải lớn hơn 0") được hiển thị nguyên văn theo đặc tả.
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getDefaultMessage() != null && e.getDefaultMessage().chars().anyMatch(c -> c > 127)
                        ? e.getDefaultMessage() : "Dữ liệu không hợp lệ: " + e.getField() + " " + e.getDefaultMessage())
                .findFirst().orElse("Vui lòng kiểm tra các thông tin được đánh dấu.");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}

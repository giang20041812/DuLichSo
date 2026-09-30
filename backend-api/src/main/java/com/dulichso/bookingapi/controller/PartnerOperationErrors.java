package com.dulichso.bookingapi.controller;
import com.dulichso.bookingapi.service.DuplicateFieldsException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestControllerAdvice(assignableTypes={PartnerRoomController.class,PartnerOfferController.class,PartnerBookingController.class,
        PartnerReviewController.class,PartnerMediaController.class,ProviderApplicationController.class,
        PartnerGeocodeController.class,PartnerCalendarController.class,PartnerChangeRequestController.class,
        PartnerAccountController.class})
public class PartnerOperationErrors {
    /** Đăng ký trùng thông tin: trả thêm danh sách trường bị trùng để form báo lỗi dưới từng ô. */
    @ExceptionHandler(DuplicateFieldsException.class)
    public ResponseEntity<Map<String,Object>> duplicate(DuplicateFieldsException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason(), "fieldErrors", ex.getFieldErrors()));
    }
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
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage() == null ? "Yêu cầu không hợp lệ." : ex.getMessage()));
    }
}

package com.dulichso.bookingapi.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestControllerAdvice(assignableTypes={PartnerRoomController.class,PartnerOfferController.class,PartnerBookingController.class,
        PartnerReviewController.class,PartnerMediaController.class,ProviderApplicationController.class,
        PartnerGeocodeController.class,PartnerCalendarController.class})
public class PartnerOperationErrors {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String,String>> status(ResponseStatusException ex) {return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message",ex.getReason()==null?"Yêu cầu không hợp lệ.":ex.getReason()));}
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException ex) {return ResponseEntity.badRequest().body(Map.of("message","Dữ liệu không hợp lệ: "+ex.getBindingResult().getFieldErrors().stream().map(e->e.getField()+" "+e.getDefaultMessage()).findFirst().orElse("Kiểm tra các trường bắt buộc.")));}
}

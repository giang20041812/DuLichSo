package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.BookingResponseDto;
import com.dulichso.bookingapi.dto.CreateBookingRequest;
import com.dulichso.bookingapi.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, maxAge = 3600)
public class PublicBookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponseDto> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingResponseDto response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<java.util.List<BookingResponseDto>> getMyBookings(
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "codes", required = false) java.util.List<String> codes) {
        return ResponseEntity.ok(bookingService.findMyBookings(email, phone, codes));
    }

    @GetMapping("/{bookingCode}")
    public ResponseEntity<BookingResponseDto> getBookingByCode(
            @PathVariable("bookingCode") String bookingCode,
            @RequestParam(value = "phone", required = true) String phone) {
        BookingResponseDto response = bookingService.getBookingByCode(bookingCode, phone);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{bookingCode}/review")
    public ResponseEntity<com.dulichso.bookingapi.dto.ReviewDto> createBookingReview(
            @PathVariable("bookingCode") String bookingCode,
            @Valid @RequestBody com.dulichso.bookingapi.dto.CreateReviewRequest request) {
        com.dulichso.bookingapi.dto.ReviewDto review = bookingService.createBookingReview(bookingCode, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @PutMapping("/{bookingCode}/review")
    public ResponseEntity<com.dulichso.bookingapi.dto.ReviewDto> updateBookingReview(
            @PathVariable("bookingCode") String bookingCode,
            @Valid @RequestBody com.dulichso.bookingapi.dto.CreateReviewRequest request) {
        com.dulichso.bookingapi.dto.ReviewDto review = bookingService.updateBookingReview(bookingCode, request);
        return ResponseEntity.ok(review);
    }

    @DeleteMapping("/{bookingCode}/review")
    public ResponseEntity<Void> deleteBookingReview(@PathVariable("bookingCode") String bookingCode) {
        bookingService.deleteBookingReview(bookingCode);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bookingCode}/review")
    public ResponseEntity<com.dulichso.bookingapi.dto.ReviewDto> getBookingReview(
            @PathVariable("bookingCode") String bookingCode) {
        com.dulichso.bookingapi.dto.ReviewDto review = bookingService.getBookingReview(bookingCode);
        return ResponseEntity.ok(review);
    }

    @PostMapping("/{bookingCode}/cancel")
    public ResponseEntity<BookingResponseDto> cancelBooking(
            @PathVariable("bookingCode") String bookingCode,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null && body.get("reason") != null ? body.get("reason") : "Khách yêu cầu hủy phòng";
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(bookingService.cancelBooking(bookingCode, reason, note));
    }

    @PutMapping("/{bookingCode}")
    public ResponseEntity<BookingResponseDto> updateBooking(
            @PathVariable("bookingCode") String bookingCode,
            @Valid @RequestBody com.dulichso.bookingapi.dto.UpdateBookingDetailsRequest request) {
        BookingResponseDto response = bookingService.updateBookingDetails(bookingCode, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{bookingCode}/change-requests")
    public ResponseEntity<java.util.List<com.dulichso.bookingapi.dto.BookingChangeRequestDto>> getBookingChangeRequests(
            @PathVariable("bookingCode") String bookingCode) {
        return ResponseEntity.ok(bookingService.getChangeRequestsByBookingCode(bookingCode));
    }

    @GetMapping("/rooms/{roomTypeId}/booked-dates")
    public ResponseEntity<java.util.List<com.dulichso.bookingapi.dto.BookedDateRangeDto>> getBookedDatesByRoomType(
            @PathVariable("roomTypeId") Long roomTypeId,
            @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        return ResponseEntity.ok(bookingService.getBookedDatesByRoomType(roomTypeId, startDate, endDate));
    }

    @GetMapping("/places/{placeId}/booked-dates")
    public ResponseEntity<java.util.List<com.dulichso.bookingapi.dto.BookedDateRangeDto>> getBookedDatesByPlace(
            @PathVariable("placeId") Long placeId,
            @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        return ResponseEntity.ok(bookingService.getBookedDatesByPlace(placeId, startDate, endDate));
    }

    @GetMapping("/rooms/{roomTypeId}/check-availability")
    public ResponseEntity<com.dulichso.bookingapi.dto.CheckAvailabilityResponse> checkAvailability(
            @PathVariable("roomTypeId") Long roomTypeId,
            @RequestParam("checkIn") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate checkIn,
            @RequestParam("checkOut") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate checkOut,
            @RequestParam(value = "roomCount", defaultValue = "1") int roomCount,
            @RequestParam(value = "excludeBookingCode", required = false) String excludeBookingCode) {
        return ResponseEntity.ok(bookingService.checkAvailability(roomTypeId, checkIn, checkOut, roomCount, excludeBookingCode));
    }
}


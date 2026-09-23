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

    @GetMapping("/{bookingCode}")
    public ResponseEntity<BookingResponseDto> getBookingByCode(@PathVariable("bookingCode") String bookingCode) {
        BookingResponseDto response = bookingService.getBookingByCode(bookingCode);
        return ResponseEntity.ok(response);
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
}

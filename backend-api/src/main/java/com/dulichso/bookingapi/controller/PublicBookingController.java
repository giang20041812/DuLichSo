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
@CrossOrigin(origins = "*", maxAge = 3600)
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
}

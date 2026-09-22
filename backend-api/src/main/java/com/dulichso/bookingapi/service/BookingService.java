package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.BookingResponseDto;
import com.dulichso.bookingapi.dto.CreateBookingRequest;

public interface BookingService {
    BookingResponseDto createBooking(CreateBookingRequest request);
    BookingResponseDto getBookingByCode(String bookingCode);
}

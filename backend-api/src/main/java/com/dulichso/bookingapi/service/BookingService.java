package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.BookedDateRangeDto;
import com.dulichso.bookingapi.dto.BookingResponseDto;
import com.dulichso.bookingapi.dto.CreateBookingRequest;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {
    BookingResponseDto createBooking(CreateBookingRequest request);
    BookingResponseDto getBookingByCode(String bookingCode);
    List<BookedDateRangeDto> getBookedDatesByRoomType(Long roomTypeId, LocalDate startDate, LocalDate endDate);
    List<BookedDateRangeDto> getBookedDatesByPlace(Long placeId, LocalDate startDate, LocalDate endDate);
}

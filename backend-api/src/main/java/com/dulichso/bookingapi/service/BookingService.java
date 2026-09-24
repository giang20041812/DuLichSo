package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.BookedDateRangeDto;
import com.dulichso.bookingapi.dto.BookingResponseDto;
import com.dulichso.bookingapi.dto.CreateBookingRequest;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {
    BookingResponseDto createBooking(CreateBookingRequest request);
    BookingResponseDto getBookingByCode(String bookingCode);
    List<BookingResponseDto> findMyBookings(String email, String phone, List<String> codes);
    com.dulichso.bookingapi.dto.ReviewDto createBookingReview(String bookingCode, com.dulichso.bookingapi.dto.CreateReviewRequest request);
    com.dulichso.bookingapi.dto.ReviewDto getBookingReview(String bookingCode);
    BookingResponseDto cancelBooking(String bookingCode, String reason, String note);
    List<BookedDateRangeDto> getBookedDatesByRoomType(Long roomTypeId, LocalDate startDate, LocalDate endDate);
    List<BookedDateRangeDto> getBookedDatesByPlace(Long placeId, LocalDate startDate, LocalDate endDate);
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.BookedDateRangeDto;
import com.dulichso.bookingapi.dto.BookingResponseDto;
import com.dulichso.bookingapi.dto.CreateBookingRequest;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {
    BookingResponseDto createBooking(CreateBookingRequest request);
    BookingResponseDto getBookingByCode(String bookingCode, String phone);
    List<BookingResponseDto> findMyBookings(String email, String phone, List<String> codes);
    com.dulichso.bookingapi.dto.ReviewDto createBookingReview(String bookingCode, com.dulichso.bookingapi.dto.CreateReviewRequest request);
    com.dulichso.bookingapi.dto.ReviewDto updateBookingReview(String bookingCode, com.dulichso.bookingapi.dto.CreateReviewRequest request);
    void deleteBookingReview(String bookingCode);
    com.dulichso.bookingapi.dto.ReviewDto getBookingReview(String bookingCode);
    BookingResponseDto cancelBooking(String bookingCode, String reason, String note);
    List<BookedDateRangeDto> getBookedDatesByRoomType(Long roomTypeId, LocalDate startDate, LocalDate endDate);
    List<BookedDateRangeDto> getBookedDatesByPlace(Long placeId, LocalDate startDate, LocalDate endDate);
    BookingResponseDto updateBookingDetails(String bookingCode, com.dulichso.bookingapi.dto.UpdateBookingDetailsRequest request);
    List<com.dulichso.bookingapi.dto.BookingChangeRequestDto> getChangeRequestsByBookingCode(String bookingCode);
    BookingResponseDto reviewBookingChangeRequest(Long changeRequestId, boolean approved, String rejectionReason, Long reviewerId);
    com.dulichso.bookingapi.dto.CheckAvailabilityResponse checkAvailability(Long roomTypeId, LocalDate checkIn, LocalDate checkOut, int roomCount, String excludeBookingCode);
    com.dulichso.bookingapi.dto.BookingQuoteResponse quote(Long roomTypeId, LocalDate checkIn, LocalDate checkOut, int roomCount, int guestCount);
    // MON-BR-03/04: cố ý KHÔNG có phương thức đổi trạng thái Booking chung chung dùng được cho Admin.
    // Trước đây có updateBookingStatus(...) bị AdminBookingController dùng để cho Admin tự xác nhận/từ chối/hoàn tiền
    // Booking thay NCC — vi phạm nghiệp vụ nên đã gỡ bỏ. Chỉ NCC (PartnerBookingService, qua accept/reject/stay) được
    // đổi trạng thái Booking do quyết định nghiệp vụ; các thay đổi khác (hủy do khách, thanh toán...) đi qua các
    // phương thức nghiệp vụ cụ thể ở trên, không qua một hàm "set trạng thái bất kỳ" chung.
}

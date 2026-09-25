package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.service.AdminBookingService;
import com.dulichso.bookingapi.service.AdminBookingService.BookingDto;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

/** Danh sách đơn đặt phòng toàn hệ thống — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin/bookings")
public class AdminBookingController {

    private final AdminBookingService adminBookingService;
    private final com.dulichso.bookingapi.service.BookingService clientBookingService;
    private final com.dulichso.bookingapi.repository.BookingChangeRequestRepository bookingChangeRequestRepository;

    public AdminBookingController(AdminBookingService adminBookingService,
                                  com.dulichso.bookingapi.service.BookingService clientBookingService,
                                  com.dulichso.bookingapi.repository.BookingChangeRequestRepository bookingChangeRequestRepository) {
        this.adminBookingService = adminBookingService;
        this.clientBookingService = clientBookingService;
        this.bookingChangeRequestRepository = bookingChangeRequestRepository;
    }

    @GetMapping("/change-requests")
    public ResponseEntity<java.util.List<com.dulichso.bookingapi.dto.BookingChangeRequestDto>> getAllChangeRequests() {
        return ResponseEntity.ok(bookingChangeRequestRepository.findAllWithBookingAndPlace(null).stream().map(cr ->
                com.dulichso.bookingapi.dto.BookingChangeRequestDto.builder()
                        .id(cr.getId())
                        .bookingId(cr.getBooking().getId())
                        .bookingCode(cr.getBooking().getBookingCode())
                        .status(cr.getStatus())
                        .guestName(cr.getGuestName())
                        .guestPhone(cr.getGuestPhone())
                        .guestEmail(cr.getGuestEmail())
                        .guestNote(cr.getGuestNote())
                        .checkIn(cr.getCheckIn())
                        .checkOut(cr.getCheckOut())
                        .roomCount(cr.getRoomCount())
                        .guestCount(cr.getGuestCount())
                        .reason(cr.getReason())
                        .rejectionReason(cr.getRejectionReason())
                        .reviewedBy(cr.getReviewedBy())
                        .reviewedAt(cr.getReviewedAt())
                        .createdAt(cr.getCreatedAt())
                        .build()
        ).collect(java.util.stream.Collectors.toList()));
    }

    @org.springframework.web.bind.annotation.PostMapping("/change-requests/{id}/review")
    public ResponseEntity<com.dulichso.bookingapi.dto.BookingResponseDto> reviewChangeRequest(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.dulichso.bookingapi.security.UserPrincipal principal,
            @org.springframework.web.bind.annotation.PathVariable("id") Long id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> body) {
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String rejectionReason = body.get("rejectionReason") != null ? String.valueOf(body.get("rejectionReason")) : null;
        Long reviewerId = principal != null ? principal.accountId() : null;

        return ResponseEntity.ok(clientBookingService.reviewBookingChangeRequest(id, approved, rejectionReason, reviewerId));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/status")
    public ResponseEntity<com.dulichso.bookingapi.dto.BookingResponseDto> updateStatus(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.dulichso.bookingapi.security.UserPrincipal principal,
            @org.springframework.web.bind.annotation.PathVariable("id") Long id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> body) {
        String statusStr = body.get("status") != null ? String.valueOf(body.get("status")) : null;
        if (statusStr == null) return ResponseEntity.badRequest().build();
        BookingStatus status = BookingStatus.valueOf(statusStr);
        String reason = body.get("reason") != null ? String.valueOf(body.get("reason")) : null;
        Long reviewerId = principal != null ? principal.accountId() : null;

        return ResponseEntity.ok(clientBookingService.updateBookingStatus(id, status, reason, reviewerId));
    }

    @GetMapping
    public ResponseEntity<Page<BookingDto>> search(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminBookingService.search(status, keyword, providerId,
                checkInFrom, checkInTo, createdFrom, createdTo, sortBy, sortDir, page, size));
    }

    /** Số đơn theo trạng thái (cho chip đếm). */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> summary() {
        return ResponseEntity.ok(adminBookingService.countByStatus());
    }
}

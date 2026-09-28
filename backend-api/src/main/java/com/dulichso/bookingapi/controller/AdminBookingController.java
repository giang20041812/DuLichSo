package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.service.AdminBookingService;
import com.dulichso.bookingapi.service.AdminBookingService.BookingDto;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.dulichso.bookingapi.entity.enums.BookingNoteKind;
import com.dulichso.bookingapi.entity.enums.BookingNoteOutcome;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminBookingMonitorService;
import com.dulichso.bookingapi.service.AdminBookingMonitorService.AttentionItem;
import com.dulichso.bookingapi.service.AdminBookingMonitorService.BookingDetailDto;
import com.dulichso.bookingapi.service.AdminBookingMonitorService.NoteDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Danh sách đơn đặt phòng toàn hệ thống — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin/bookings")
public class AdminBookingController {

    private final AdminBookingService adminBookingService;
    private final com.dulichso.bookingapi.repository.BookingChangeRequestRepository bookingChangeRequestRepository;

    private final AdminBookingMonitorService monitorService;

    public AdminBookingController(AdminBookingService adminBookingService,
                                  AdminBookingMonitorService monitorService,
                                  com.dulichso.bookingapi.repository.BookingChangeRequestRepository bookingChangeRequestRepository) {
        this.adminBookingService = adminBookingService;
        this.monitorService = monitorService;
        this.bookingChangeRequestRepository = bookingChangeRequestRepository;
    }

    /**
     * MON-BR-01/02: chỉ đọc — danh sách yêu cầu thay đổi Booking toàn hệ thống để Admin theo dõi.
     * MON-BR-04: Admin KHÔNG được duyệt/từ chối yêu cầu này thay NCC; việc xét duyệt thuộc PartnerBookingController.
     */
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

    @GetMapping
    public ResponseEntity<Page<BookingDto>> search(
            @RequestParam(required = false) java.util.List<BookingStatus> status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String guest,
            @RequestParam(required = false) String place,
            @RequestParam(required = false) Long placeId,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // status nhận một hoặc nhiều giá trị phân tách bằng dấu phẩy (vd: status=PENDING,AWAITING_PAYMENT) để lọc theo nhóm.
        return ResponseEntity.ok(adminBookingService.searchByStatuses(status, keyword, guest, place, placeId, providerId,
                checkInFrom, checkInTo, createdFrom, createdTo, sortBy, sortDir, page, size));
    }

    /** Số đơn theo trạng thái (cho chip đếm). */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> summary() {
        return ResponseEntity.ok(adminBookingService.countByStatus());
    }

    /** Booking cần Admin quan tâm (FR-AD-07). */
    @GetMapping("/attention")
    public ResponseEntity<List<AttentionItem>> attention() {
        return ResponseEntity.ok(monitorService.attention());
    }

    /** Chi tiết đầy đủ một Booking (FR-AD-08). */
    @GetMapping("/{id}")
    public ResponseEntity<BookingDetailDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(monitorService.detail(id));
    }

    /** Ghi nhận thông tin xác minh / kết quả giám sát (FR-AD-09, FR-AD-10). */
    @PostMapping("/{id}/notes")
    public ResponseEntity<NoteDto> addNote(@PathVariable Long id,
                                           @RequestBody NoteRequest request,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        Long callerId = principal != null ? principal.accountId() : null;
        return ResponseEntity.status(201).body(
                monitorService.addNote(id, request.kind(), request.outcome(), request.content(), callerId));
    }

    public record NoteRequest(BookingNoteKind kind, BookingNoteOutcome outcome, String content) {}
}

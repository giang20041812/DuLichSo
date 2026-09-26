package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.AcceptInput;
import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.BookingDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.InfoRequestInput;
import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.StayActionInput;
import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.RejectInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminBookingService;
import com.dulichso.bookingapi.service.PartnerBookingService;
import jakarta.validation.Valid;
import com.dulichso.bookingapi.service.AdminBookingService.BookingDto;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

/**
 * Đơn đặt phòng của chính nhà cung cấp đang đăng nhập (row-level: providerId luôn lấy từ tài khoản,
 * không nhận từ client).
 */
@RestController
@RequestMapping("/api/v1/partner/bookings")
public class PartnerBookingController {

    private final AdminBookingService bookingService;
    private final com.dulichso.bookingapi.service.BookingService clientBookingService;
    private final AccountRepository accountRepository;
    private final com.dulichso.bookingapi.repository.BookingChangeRequestRepository bookingChangeRequestRepository;
    private final PartnerBookingService partnerBookingService;

    public PartnerBookingController(AdminBookingService bookingService,
                                    com.dulichso.bookingapi.service.BookingService clientBookingService,
                                    AccountRepository accountRepository,
                                    com.dulichso.bookingapi.repository.BookingChangeRequestRepository bookingChangeRequestRepository,
                                    PartnerBookingService partnerBookingService) {
        this.partnerBookingService = partnerBookingService;
        this.bookingService = bookingService;
        this.clientBookingService = clientBookingService;
        this.accountRepository = accountRepository;
        this.bookingChangeRequestRepository = bookingChangeRequestRepository;
    }

    @GetMapping
    public ResponseEntity<Page<BookingDto>> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long providerId = resolveProviderId(principal);
        if (providerId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(bookingService.search(status, keyword, providerId,
                checkInFrom, checkInTo, createdFrom, createdTo, sortBy, sortDir, page, size));
    }

    @GetMapping("/change-requests")
    public ResponseEntity<java.util.List<com.dulichso.bookingapi.dto.BookingChangeRequestDto>> getChangeRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long providerId = resolveProviderId(principal);
        if (providerId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(bookingChangeRequestRepository.findAllWithBookingAndPlace(providerId).stream().map(cr ->
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
            @AuthenticationPrincipal UserPrincipal principal,
            @org.springframework.web.bind.annotation.PathVariable("id") Long id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> body) {
        Long providerId = resolveProviderId(principal);
        if (providerId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        // Row-level authorization (NFR-SEC-02): chỉ duyệt yêu cầu thay đổi của đơn thuộc chính nhà cung cấp này.
        boolean owned = bookingChangeRequestRepository.findById(id)
                .map(cr -> cr.getBooking() != null && cr.getBooking().getProvider() != null
                        && providerId.equals(cr.getBooking().getProvider().getId()))
                .orElse(false);
        if (!owned) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String rejectionReason = body.get("rejectionReason") != null ? String.valueOf(body.get("rejectionReason")) : null;
        Long reviewerId = principal != null ? principal.accountId() : null;

        return ResponseEntity.ok(clientBookingService.reviewBookingChangeRequest(id, approved, rejectionReason, reviewerId));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/status")
    public ResponseEntity<com.dulichso.bookingapi.dto.BookingResponseDto> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @org.springframework.web.bind.annotation.PathVariable("id") Long id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> body) {
        Long providerId = resolveProviderId(principal);
        if (providerId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        // Legacy endpoint cannot bypass ownership, transitions or inventory in accept/reject.
        return ResponseEntity.status(HttpStatus.GONE).build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> summary(@AuthenticationPrincipal UserPrincipal principal) {
        Long providerId = resolveProviderId(principal);
        if (providerId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(bookingService.countByStatus(providerId));
    }

    /** Chi tiết + kết quả kiểm tra + phương án phòng để xử lý đơn (FR-NCC-12..18). */
    @GetMapping("/{id}")
    public BookingDetailDto detail(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return partnerBookingService.detail(principal, id);
    }

    @PostMapping("/{id}/accept")
    public BookingDetailDto accept(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                   @Valid @RequestBody AcceptInput input) {
        return partnerBookingService.accept(principal, id, input);
    }

    @PostMapping("/{id}/reject")
    public BookingDetailDto reject(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                   @Valid @RequestBody RejectInput input) {
        return partnerBookingService.reject(principal, id, input);
    }

    /** Nhận phòng / trả phòng / hoàn thành / khách không đến cho đơn đã xác nhận. */
    @PostMapping("/{id}/stay")
    public BookingDetailDto stay(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                 @Valid @RequestBody StayActionInput input) {
        return partnerBookingService.stayAction(principal, id, input);
    }

    /** FR-NCC-14: yêu cầu khách bổ sung/điều chỉnh thông tin. */
    @PostMapping("/{id}/info-requests")
    public BookingDetailDto requestInfo(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                        @Valid @RequestBody InfoRequestInput input) {
        return partnerBookingService.requestInfo(principal, id, input);
    }

    private Long resolveProviderId(UserPrincipal principal) {
        if (principal == null || principal.role() != AccountRole.PROVIDER) return null;
        return accountRepository.findByIdentifier(principal.identifier())
                .map(Account::getProvider)
                .map(p -> p.getId())
                .orElse(null);
    }
}

package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.AcceptInput;
import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.BookingDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerBookingDtos.InfoRequestInput;
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
    private final AccountRepository accountRepository;
    private final PartnerBookingService partnerBookingService;

    public PartnerBookingController(AdminBookingService bookingService, AccountRepository accountRepository,
                                    PartnerBookingService partnerBookingService) {
        this.partnerBookingService = partnerBookingService;
        this.bookingService = bookingService;
        this.accountRepository = accountRepository;
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

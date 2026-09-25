package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.PartnerHomestayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/partner/homestays")
public class PartnerHomestayController {
    private final PartnerHomestayService service;

    @GetMapping
    public PartnerHomestayPageResponse list(@AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String keyword, @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String operationStatus) {
        return service.getHomestays(principal, keyword, visibility, operationStatus);
    }

    @GetMapping("/options")
    public HomestayOptionsDto options(@AuthenticationPrincipal UserPrincipal principal) { return service.options(principal); }

    @GetMapping("/{id}")
    public PartnerHomestayDetailDto detail(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return service.getHomestayDetail(principal, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PartnerHomestayDetailDto create(@AuthenticationPrincipal UserPrincipal principal, @RequestBody PartnerHomestayDetailDto dto) {
        return service.createHomestay(principal, dto);
    }

    @PutMapping("/{id}")
    public PartnerHomestayDetailDto update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
            @RequestBody PartnerHomestayDetailDto dto) { return service.saveHomestayDetail(principal, id, dto); }

    @PatchMapping("/{id}/status")
    public PartnerHomestaySummaryDto status(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) { return service.updateStatus(principal, id, request); }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> error(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason() == null ? "Yêu cầu không hợp lệ." : ex.getReason()));
    }
}

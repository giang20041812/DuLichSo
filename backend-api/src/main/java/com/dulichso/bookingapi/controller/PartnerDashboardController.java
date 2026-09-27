package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerDashboardDtos.PartnerDashboardSummaryDto;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.PartnerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/partner/dashboard")
public class PartnerDashboardController {
    private final PartnerDashboardService service;

    @GetMapping("/summary")
    public PartnerDashboardSummaryDto getSummary(@AuthenticationPrincipal UserPrincipal principal) {
        return service.getDashboardSummary(principal);
    }
}

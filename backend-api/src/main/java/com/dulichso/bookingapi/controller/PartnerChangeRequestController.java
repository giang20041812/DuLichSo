package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.ChangeRequestSummaryDto;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.PartnerChangeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** NCC xem trạng thái các yêu cầu thay đổi của mình và rút lại yêu cầu đang chờ duyệt. Chỉ thấy yêu cầu thuộc NCC của mình. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/partner/change-requests")
public class PartnerChangeRequestController {
    private final PartnerChangeService service;

    @GetMapping
    public Page<ChangeRequestSummaryDto> list(@AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ChangeRequestStatus status, @RequestParam(required = false) Long placeId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.list(principal, status, placeId, page, size);
    }

    /** Rút lại yêu cầu đang chờ duyệt. */
    @DeleteMapping("/{id}")
    public ChangeRequestSummaryDto cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return service.cancel(principal, id);
    }
}

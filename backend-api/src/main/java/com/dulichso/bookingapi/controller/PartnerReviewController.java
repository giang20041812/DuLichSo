package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerReviewDtos.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.PartnerReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/partner/reviews")
public class PartnerReviewController {
    private final PartnerReviewService service;

    @GetMapping
    public List<ReviewDto> list(@AuthenticationPrincipal UserPrincipal p, @RequestParam(required = false) Long placeId) {return service.list(p, placeId);}

    @PutMapping("/{id}/reply")
    public ReviewDto reply(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody ReplyInput input) {return service.reply(p, id, input);}

    @DeleteMapping("/{id}/reply")
    public ReviewDto removeReply(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {return service.removeReply(p, id);}
}

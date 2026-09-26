package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.ChangeLogDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.HomestayBlockInput;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.PartnerRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/** Lịch phục vụ cả Homestay và lịch sử thay đổi giá / số phòng / lịch bán (FR-NCC-08/09, NFR-AUD-02). */
@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/partner/homestays/{placeId}")
public class PartnerCalendarController {
    private final PartnerRoomService service;

    /** Trả về số ngày-loại phòng đã có đơn trong khoảng bị đóng (các đơn đó vẫn giữ nguyên). */
    @PutMapping("/calendar-block")
    public Map<String, Integer> block(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @Valid @RequestBody HomestayBlockInput input) {
        return Map.of("bookedDays", service.blockHomestay(p, placeId, input));
    }

    @GetMapping("/change-log")
    public List<ChangeLogDto> changeLog(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId) {return service.changeLog(p, placeId);}
}

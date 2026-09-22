package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.*;
import com.dulichso.bookingapi.service.PartnerHomestayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/partner/homestays")
public class PartnerHomestayController {

    private final PartnerHomestayService partnerHomestayService;

    public PartnerHomestayController(PartnerHomestayService partnerHomestayService) {
        this.partnerHomestayService = partnerHomestayService;
    }

    /**
     * UC-10: Lấy danh sách Homestay của NCC, hỗ trợ bộ lọc và QA Sandbox
     */
    @GetMapping
    public ResponseEntity<PartnerHomestayPageResponse> getHomestays(
            @RequestParam(required = false, defaultValue = "DEFAULT") String scenario,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String operationStatus
    ) {
        PartnerHomestayPageResponse response = partnerHomestayService.getHomestays(scenario, keyword, visibility, operationStatus);
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật trạng thái hiển thị (Visibility) hoặc vận hành (Operation Status)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<PartnerHomestaySummaryDto> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request
    ) {
        PartnerHomestaySummaryDto updated = partnerHomestayService.updateStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Tạo Homestay mới (Mặc định trạng thái DRAFT)
     */
    @PostMapping
    public ResponseEntity<PartnerHomestaySummaryDto> createHomestay(
            @RequestBody QuickCreateHomestayRequest request
    ) {
        PartnerHomestaySummaryDto created = partnerHomestayService.createQuickHomestay(request);
        return ResponseEntity.ok(created);
    }

    /**
     * Lấy thông tin chi tiết Homestay phục vụ màn hình Chỉnh sửa
     */
    @GetMapping("/{id}")
    public ResponseEntity<PartnerHomestayDetailDto> getHomestayDetail(@PathVariable Long id) {
        PartnerHomestayDetailDto detail = partnerHomestayService.getHomestayDetail(id);
        return ResponseEntity.ok(detail);
    }

    /**
     * Cập nhật toàn bộ thông tin chi tiết Homestay
     */
    @PutMapping("/{id}")
    public ResponseEntity<PartnerHomestayDetailDto> updateHomestayDetail(
            @PathVariable Long id,
            @RequestBody PartnerHomestayDetailDto dto
    ) {
        PartnerHomestayDetailDto updated = partnerHomestayService.saveHomestayDetail(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Đặt lại dữ liệu chuẩn ban đầu
     */
    @PostMapping("/reset")
    public ResponseEntity<Void> resetDefault() {
        partnerHomestayService.resetToDefault();
        return ResponseEntity.ok().build();
    }
}

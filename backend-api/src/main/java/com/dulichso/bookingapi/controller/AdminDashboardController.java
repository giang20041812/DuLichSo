package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminDashboardDtos.AdminDashboardSummaryDto;
import com.dulichso.bookingapi.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    /**
     * GET /api/v1/admin/dashboard/summary
     * Lấy dữ liệu thống kê tổng quan thời gian thực toàn hệ thống.
     */
    @GetMapping("/summary")
    public ResponseEntity<AdminDashboardSummaryDto> getSummary() {
        return ResponseEntity.ok(adminDashboardService.getSummary());
    }
}

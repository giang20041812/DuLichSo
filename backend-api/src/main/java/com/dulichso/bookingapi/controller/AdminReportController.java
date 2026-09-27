package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.service.AdminReportService;
import com.dulichso.bookingapi.service.AdminReportService.OverviewReport;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Báo cáo & thống kê — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin/reports")
public class AdminReportController {

    private final AdminReportService reportService;

    public AdminReportController(AdminReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/overview")
    public ResponseEntity<OverviewReport> overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long providerId,
            @RequestParam(defaultValue = "ALL") String group) {
        return ResponseEntity.ok(reportService.overview(from, to, providerId, group));
    }
}

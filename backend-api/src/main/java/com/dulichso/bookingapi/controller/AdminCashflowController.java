package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowLevel;
import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowReportDto;
import com.dulichso.bookingapi.service.AdminCashflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Dòng tiền theo NCC/Homestay — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/finance/cashflow")
public class AdminCashflowController {
    private final AdminCashflowService service;

    @GetMapping
    public ResponseEntity<CashflowReportDto> report(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "PROVIDER") CashflowLevel level,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "net") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.report(from, to, level, providerId, keyword, sortBy, sortDir, page, size));
    }
}

package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.admin.AdminAuditLogDtos.AuditLogDto;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.service.AdminAuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** FR-AD-17: tra cứu Audit Log chỉ đọc — chỉ ADMIN (SecurityConfig: /api/v1/admin/**). Không có API ghi/sửa/xóa. */
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
public class AdminAuditLogController {

    private final AdminAuditLogService auditLogService;

    public AdminAuditLogController(AdminAuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Page<AuditLogDto>> search(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) ActorType actor,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) java.util.List<String> actionCodes,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogService.search(from, to, actor, actorId, action, entityType, entityId, result,
                keyword, actionCodes, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.detail(id));
    }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminAuditLogDtos.AuditLogDto;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.AuditLog;
import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.AuditLogRepository;
import com.dulichso.bookingapi.repository.TravelerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** FR-AD-17: tra cứu Audit Log chỉ đọc. */
@ExtendWith(MockitoExtension.class)
class AdminAuditLogServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private TravelerRepository travelerRepository;

    private AdminAuditLogService service;

    @BeforeEach
    void setUp() {
        service = new AdminAuditLogService(auditLogRepository, accountRepository, travelerRepository);
    }

    private AuditLog log(long id, ActorType actor, Long actorId) {
        return AuditLog.builder().id(id).actor(actor).actorId(actorId).action("UPDATE_ACCOUNT_STATUS").entityType("Account")
                .entityId(5L).result("SUCCESS").ip("10.0.0.1").reason("Vi phạm")
                .beforeData(Map.of("status", "ACTIVE")).afterData(Map.of("status", "INACTIVE"))
                .createdAt(LocalDateTime.of(2026, 9, 1, 10, 0)).build();
    }

    @Test
    @DisplayName("Danh sách: trả tên người thao tác đúng theo loại actor và KHÔNG trả before/after")
    void search_resolvesNamesAndOmitsSnapshots() {
        AuditLog adminLog = log(1L, ActorType.ADMIN, 3L);
        AuditLog customerLog = log(2L, ActorType.CUSTOMER, 3L); // cùng id 3 nhưng là khách, không phải admin
        when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(adminLog, customerLog)));
        when(accountRepository.findAllById(any())).thenReturn(List.of(Account.builder().id(3L).fullName("Admin A").build()));
        when(travelerRepository.findAllById(any())).thenReturn(List.of(Traveler.builder().id(3L).fullName("Khách B").build()));

        Page<AuditLogDto> page = service.search(null, null, null, null, null, null, null, null, 0, 20);

        assertEquals("Admin A", page.getContent().get(0).getActorName());
        assertEquals("Khách B", page.getContent().get(1).getActorName());
        assertNull(page.getContent().get(0).getBeforeData());
        assertNull(page.getContent().get(0).getAfterData());
        assertEquals("10.0.0.1", page.getContent().get(0).getIp());
    }

    @Test
    @DisplayName("Danh sách: giới hạn kích thước trang tối đa 100 và sắp xếp mới nhất trước")
    void search_capsPageSizeAndSortsNewestFirst() {
        when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty());

        service.search(null, null, null, null, null, null, null, null, -3, 5000);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(auditLogRepository).findAll(any(Specification.class), pageable.capture());
        assertEquals(100, pageable.getValue().getPageSize());
        assertEquals(0, pageable.getValue().getPageNumber());
        assertEquals("DESC", pageable.getValue().getSort().getOrderFor("createdAt").getDirection().name());
    }

    @Test
    @DisplayName("Danh sách: khoảng thời gian ngược (to < from) bị từ chối")
    void search_rejectsInvertedDateRange() {
        assertThrows(IllegalArgumentException.class, () -> service.search(
                LocalDate.of(2026, 9, 10), LocalDate.of(2026, 9, 1), null, null, null, null, null, null, 0, 20));
        verifyNoInteractions(auditLogRepository);
    }

    @Test
    @DisplayName("Chi tiết: trả đầy đủ before/after")
    void detail_includesSnapshots() {
        when(auditLogRepository.findById(1L)).thenReturn(Optional.of(log(1L, ActorType.SYSTEM, null)));

        AuditLogDto dto = service.detail(1L);

        assertEquals(Map.of("status", "ACTIVE"), dto.getBeforeData());
        assertEquals(Map.of("status", "INACTIVE"), dto.getAfterData());
        assertNull(dto.getActorName(), "actor SYSTEM không có tên");
    }

    @Test
    @DisplayName("Chi tiết: không tìm thấy bản ghi")
    void detail_notFound() {
        when(auditLogRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.detail(99L));
    }

    @Test
    @DisplayName("mask: che email và số điện thoại trước khi ghi log")
    void mask_hidesIdentifier() {
        assertEquals("n***@gmail.com", AuditLogService.mask("nguyenvan@gmail.com"));
        assertEquals("*******678", AuditLogService.mask("0912345678"));
        assertEquals("***", AuditLogService.mask("ab"));
        assertEquals("", AuditLogService.mask(null));
    }
}

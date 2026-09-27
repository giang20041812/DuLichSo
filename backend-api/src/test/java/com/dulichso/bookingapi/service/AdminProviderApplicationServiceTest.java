package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminProviderApplicationDtos.ApplicationDetailDto;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ProviderApplicationRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** FR-AD-16: duyệt hoặc từ chối hồ sơ đăng ký NCC. */
@ExtendWith(MockitoExtension.class)
class AdminProviderApplicationServiceTest {
    @Mock ProviderApplicationRepository applications;
    @Mock ProviderRepository providers;
    @Mock AccountRepository accounts;
    @Mock AuditLogService auditLogService;
    @Mock NotificationRecorder notifications;

    AdminProviderApplicationService service;
    ProviderApplication application;

    @BeforeEach
    void setup() {
        service = new AdminProviderApplicationService(applications, providers, accounts, auditLogService, notifications);
        application = ProviderApplication.builder().id(5L).businessName("HTX Mù Cang Chải").contactName("Chị Mai")
                .contactPhone("0912345678").contactEmail("Mai@Example.Test").address("La Pán Tẩn").passwordHash("$2a$10$hashedByRegister")
                .description("Mô tả cơ sở").build();
        lenient().when(applications.findByIdForUpdate(5L)).thenReturn(Optional.of(application));
        lenient().when(applications.findById(5L)).thenReturn(Optional.of(application));
        lenient().when(accounts.findByIdentifier(any())).thenReturn(Optional.empty());
        lenient().when(providers.save(any(Provider.class))).thenAnswer(inv -> {
            Provider p = inv.getArgument(0);
            p.setId(33L);
            return p;
        });
        lenient().when(accounts.save(any(Account.class))).thenAnswer(inv -> {
            Account a = inv.getArgument(0);
            a.setId(44L);
            return a;
        });
    }

    @Test
    @DisplayName("Duyệt: tạo Provider ACTIVE + Account PROVIDER giữ nguyên mật khẩu đã băm, hồ sơ APPROVED, ghi audit và thông báo NCC")
    void approve_createsProviderAndAccount() {
        ApplicationDetailDto detail = service.approve(5L, 1L, "Hồ sơ hợp lệ");

        ArgumentCaptor<Provider> provider = ArgumentCaptor.forClass(Provider.class);
        verify(providers).save(provider.capture());
        assertEquals("HTX Mù Cang Chải", provider.getValue().getName());
        assertEquals(ProviderStatus.ACTIVE, provider.getValue().getStatus());

        ArgumentCaptor<Account> account = ArgumentCaptor.forClass(Account.class);
        verify(accounts).save(account.capture());
        assertEquals(AccountRole.PROVIDER, account.getValue().getRole());
        assertEquals(AccountStatus.ACTIVE, account.getValue().getStatus());
        assertEquals("$2a$10$hashedByRegister", account.getValue().getPasswordHash(), "Không được băm lại mật khẩu đã băm");
        assertEquals("mai@example.test", account.getValue().getEmail());
        assertEquals("0912345678", account.getValue().getPhone());
        assertSame(provider.getValue(), account.getValue().getProvider());

        assertEquals(ProviderApplicationStatus.APPROVED, application.getStatus());
        assertEquals(33L, application.getProviderId());
        assertEquals(1L, application.getReviewedBy());
        assertNotNull(application.getReviewedAt());
        assertEquals(ProviderApplicationStatus.APPROVED, detail.summary().status());
        verify(auditLogService).record(eq(1L), eq("PROVIDER_APPLICATION_APPROVED"), eq("ProviderApplication"), eq(5L), eq("Hồ sơ hợp lệ"), anyMap(), anyMap());
        verify(notifications).toCustomer(eq("PROVIDER_APPLICATION_APPROVED"), eq("0912345678"), eq("Mai@Example.Test"), eq("provider_application"), eq(5L), anyMap());
    }

    @Test
    @DisplayName("Duyệt: SĐT đã thuộc tài khoản khác thì từ chối thao tác, không tạo Provider/Account, hồ sơ vẫn PENDING")
    void approve_blockedWhenIdentifierTaken() {
        when(accounts.findByIdentifier("0912345678")).thenReturn(Optional.of(Account.builder().id(9L).build()));

        assertThrows(IllegalStateException.class, () -> service.approve(5L, 1L, null));

        verify(providers, never()).save(any());
        verify(accounts, never()).save(any());
        assertEquals(ProviderApplicationStatus.PENDING, application.getStatus());
        verifyNoInteractions(auditLogService, notifications);
    }

    @Test
    @DisplayName("Từ chối: bắt buộc có lý do, không tạo tài khoản, lưu lý do và phản hồi cho NCC")
    void reject_requiresReasonAndNotifies() {
        assertThrows(IllegalArgumentException.class, () -> service.reject(5L, 1L, "  "));
        assertEquals(ProviderApplicationStatus.PENDING, application.getStatus());

        service.reject(5L, 1L, "Thiếu giấy phép kinh doanh");

        assertEquals(ProviderApplicationStatus.REJECTED, application.getStatus());
        assertEquals("Thiếu giấy phép kinh doanh", application.getReviewNote());
        assertNull(application.getProviderId());
        verify(providers, never()).save(any());
        verify(accounts, never()).save(any());
        verify(auditLogService).record(eq(1L), eq("PROVIDER_APPLICATION_REJECTED"), eq("ProviderApplication"), eq(5L), eq("Thiếu giấy phép kinh doanh"), anyMap(), anyMap());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> payload = ArgumentCaptor.forClass(Map.class);
        verify(notifications).toCustomer(eq("PROVIDER_APPLICATION_REJECTED"), any(), any(), eq("provider_application"), eq(5L), payload.capture());
        assertEquals("Thiếu giấy phép kinh doanh", payload.getValue().get("reason"));
    }

    @Test
    @DisplayName("Hồ sơ đã xử lý không bị ghi đè: duyệt/từ chối lại đều bị chặn")
    void alreadyProcessed_cannotBeOverwritten() {
        application.setStatus(ProviderApplicationStatus.REJECTED);

        assertThrows(IllegalStateException.class, () -> service.approve(5L, 1L, null));
        assertThrows(IllegalStateException.class, () -> service.reject(5L, 1L, "Lý do"));
        verify(providers, never()).save(any());
        assertEquals(ProviderApplicationStatus.REJECTED, application.getStatus());
    }

    @Test
    @DisplayName("Không xác định được Admin thao tác (accountId null): từ chối")
    void unknownAdmin_rejected() {
        assertThrows(IllegalStateException.class, () -> service.approve(5L, null, null));
        assertThrows(IllegalStateException.class, () -> service.reject(5L, null, "Lý do"));
        verify(providers, never()).save(any());
    }

    @Test
    @DisplayName("Chi tiết: báo SĐT/email đã có tài khoản khi hồ sơ đang chờ; không lộ băm mật khẩu")
    void detail_flagsTakenIdentifiers() {
        when(accounts.findByIdentifier("0912345678")).thenReturn(Optional.of(Account.builder().id(9L).build()));

        ApplicationDetailDto detail = service.detail(5L);

        assertTrue(detail.phoneTaken());
        assertFalse(detail.emailTaken());
        assertEquals("Mô tả cơ sở", detail.description());
        assertFalse(detail.toString().contains("hashedByRegister"));
    }

    @Test
    @DisplayName("Tìm kiếm: khoảng ngày ngược bị từ chối; hồ sơ không tồn tại báo lỗi")
    void search_validation() {
        assertThrows(IllegalArgumentException.class, () -> service.search(null, null,
                LocalDate.of(2026, 9, 10), LocalDate.of(2026, 9, 1), "desc", 0, 20));
        when(applications.findByIdForUpdate(404L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.approve(404L, 1L, null));
        assertEquals(List.of(), List.of());
    }
}

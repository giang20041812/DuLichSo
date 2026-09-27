package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.auth.PortalAuthDtos.PortalLoginRequest;
import com.dulichso.bookingapi.dto.auth.PortalAuthDtos.PortalLoginResponse;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** NFR-SEC-05 (log xác thực) và NFR-SEC-03 (token mang phiên bản, đăng xuất thu hồi phiên). */
@ExtendWith(MockitoExtension.class)
class AccountAuthServiceTest {

    private static final String IDENTIFIER = "admin@example.test";
    private static final String PASSWORD = "Correct#Pass1";

    @Mock private AccountRepository accountRepository;
    @Mock private AuditLogService auditLogService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private JwtUtils jwtUtils;
    private AccountAuthService service;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "unit-test-secret-key-at-least-32-bytes-long!!");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3_600_000L);
        service = new AccountAuthService(accountRepository, jwtUtils, encoder, auditLogService, false);
    }

    private Account account() {
        return Account.builder().id(7L).email(IDENTIFIER).passwordHash(encoder.encode(PASSWORD))
                .role(AccountRole.ADMIN).status(AccountStatus.ACTIVE).tokenVersion(4).build();
    }

    private PortalLoginRequest request(String identifier, String password) {
        PortalLoginRequest request = new PortalLoginRequest();
        request.setIdentifier(identifier);
        request.setPassword(password);
        return request;
    }

    @Test
    @DisplayName("Đăng nhập thành công: token mang phiên bản token, ghi LOGIN_SUCCESS")
    void loginSuccess_tokenCarriesVersionAndEventLogged() {
        Account account = account();
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(account));

        PortalLoginResponse response = service.login(request(IDENTIFIER, PASSWORD));

        assertEquals(4, jwtUtils.getTokenVersionFromToken(response.getToken()));
        assertNotNull(account.getLastActivityAt(), "Đăng nhập phải khởi tạo thời điểm hoạt động của phiên");
        verify(auditLogService).recordEvent(eq(ActorType.ADMIN), eq(7L), eq("LOGIN_SUCCESS"), eq("Account"), eq(7L),
                eq(AuditLogService.RESULT_SUCCESS), any(), isNull(), anyMap());
    }

    @Test
    @DisplayName("Sai mật khẩu: ghi LOGIN_FAILED, định danh bị che và không lộ mật khẩu")
    void wrongPassword_logsFailureWithMaskedIdentifier() {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(account()));

        assertThrows(AccountAuthService.BadCredentialsException.class, () -> service.login(request(IDENTIFIER, "Wrong#Pass9")));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> details = ArgumentCaptor.forClass(Map.class);
        verify(auditLogService).recordEvent(eq(ActorType.ADMIN), eq(7L), eq("LOGIN_FAILED"), eq("Account"), eq(7L),
                eq(AuditLogService.RESULT_FAILURE), any(), anyString(), details.capture());
        assertEquals("a***@example.test", details.getValue().get("identifier"));
        assertFalse(details.getValue().toString().contains("Wrong#Pass9"));
    }

    @Test
    @DisplayName("Tài khoản không tồn tại: ghi LOGIN_FAILED với actor SYSTEM")
    void unknownAccount_logsFailureAsSystem() {
        when(accountRepository.findByIdentifier("ghost@example.test")).thenReturn(Optional.empty());

        assertThrows(AccountAuthService.BadCredentialsException.class, () -> service.login(request("ghost@example.test", "x")));

        verify(auditLogService).recordEvent(eq(ActorType.SYSTEM), isNull(), eq("LOGIN_FAILED"), eq("Account"), isNull(),
                eq(AuditLogService.RESULT_FAILURE), any(), anyString(), anyMap());
    }

    @Test
    @DisplayName("Tài khoản bị vô hiệu hóa: ghi LOGIN_BLOCKED (DENIED)")
    void inactiveAccount_logsBlocked() {
        Account account = account();
        account.setStatus(AccountStatus.INACTIVE);
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(account));

        assertThrows(AccountAuthService.AccountInactiveException.class, () -> service.login(request(IDENTIFIER, PASSWORD)));

        verify(auditLogService).recordEvent(eq(ActorType.ADMIN), eq(7L), eq("LOGIN_BLOCKED"), eq("Account"), eq(7L),
                eq(AuditLogService.RESULT_DENIED), any(), anyString(), anyMap());
        verify(auditLogService, never()).recordEvent(any(), any(), eq("LOGIN_SUCCESS"), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Đăng xuất: tăng phiên bản token để thu hồi JWT đang giữ và ghi LOGOUT")
    void logout_bumpsTokenVersion() {
        Account account = account();
        account.setLastActivityAt(java.time.LocalDateTime.now());
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(account));

        service.logout(IDENTIFIER);

        assertEquals(5, account.getTokenVersion());
        assertNull(account.getLastActivityAt());
        verify(accountRepository).save(account);
        verify(auditLogService).recordEvent(eq(ActorType.ADMIN), eq(7L), eq("LOGOUT"), eq("Account"), eq(7L),
                eq(AuditLogService.RESULT_SUCCESS), any(), isNull(), anyMap());
    }

    @Test
    @DisplayName("Đăng xuất với định danh không tồn tại: không lỗi, không ghi gì")
    void logout_unknownIdentifier_noop() {
        when(accountRepository.findByIdentifier("ghost@example.test")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service.logout("ghost@example.test"));
        assertDoesNotThrow(() -> service.logout(null));
        verifyNoInteractions(auditLogService);
    }
}

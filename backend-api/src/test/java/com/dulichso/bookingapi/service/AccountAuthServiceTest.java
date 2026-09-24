package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.auth.PortalAuthDtos.PortalLoginRequest;
import com.dulichso.bookingapi.dto.auth.PortalAuthDtos.PortalLoginResponse;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountAuthServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private JwtUtils jwtUtils;

    private AccountAuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AccountAuthService(accountRepository, jwtUtils, new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(), true);
    }

    @Test
    @DisplayName("Kịch bản 5: OK - Admin login thành công và chuyển hướng /admin")
    void testAdminLoginSuccess() {
        when(accountRepository.findByIdentifier(anyString())).thenReturn(Optional.empty());
        when(jwtUtils.generateToken(anyString(), anyString())).thenReturn("mock_admin_token");

        PortalLoginRequest request = PortalLoginRequest.builder()
                .identifier("admin@taybactrails.vn")
                .password("Admin@123456")
                .build();

        PortalLoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals(AccountRole.ADMIN, response.getRole());
        assertEquals("/admin", response.getRedirectUrl());
        assertEquals("mock_admin_token", response.getToken());
    }

    @Test
    @DisplayName("Kịch bản 6: OK - NCC login thành công và chuyển hướng /partner")
    void testNccLoginSuccess() {
        when(accountRepository.findByIdentifier(anyString())).thenReturn(Optional.empty());
        when(jwtUtils.generateToken(anyString(), anyString())).thenReturn("mock_ncc_token");

        PortalLoginRequest request = PortalLoginRequest.builder()
                .identifier("ncc@taybactrails.vn")
                .password("Ncc@123456")
                .build();

        PortalLoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals(AccountRole.PROVIDER, response.getRole());
        assertEquals("/partner", response.getRedirectUrl());
        assertNotNull(response.getProvider());
        assertEquals("Bản Lìm Mông Eco Lodge", response.getProvider().getName());
    }

    @Test
    @DisplayName("Kịch bản 2: Sai thông tin trả về BadCredentialsException (Security BV-08)")
    void testBadCredentials() {
        when(accountRepository.findByIdentifier(anyString())).thenReturn(Optional.empty());

        PortalLoginRequest request = PortalLoginRequest.builder()
                .identifier("admin@taybactrails.vn")
                .password("WrongPassword123")
                .build();

        assertThrows(AccountAuthService.BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Kịch bản 3: Tài khoản vô hiệu hoá ném AccountInactiveException (403)")
    void testAccountInactive() {
        when(accountRepository.findByIdentifier(anyString())).thenReturn(Optional.empty());

        PortalLoginRequest request = PortalLoginRequest.builder()
                .identifier("inactive_user@taybactrails.vn")
                .password("Pass@123456")
                .build();

        assertThrows(AccountAuthService.AccountInactiveException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Kịch bản 4: NCC bị đình chỉ ném ProviderSuspendedException (403)")
    void testProviderSuspended() {
        when(accountRepository.findByIdentifier(anyString())).thenReturn(Optional.empty());

        PortalLoginRequest request = PortalLoginRequest.builder()
                .identifier("ncc_suspended@taybactrails.vn")
                .password("Pass@123456")
                .build();

        assertThrows(AccountAuthService.ProviderSuspendedException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Kịch bản 7: Mô phỏng lỗi 500 ném RuntimeException")
    void testSimulate500Error() {
        PortalLoginRequest request = PortalLoginRequest.builder()
                .identifier("sim_500@taybactrails.vn")
                .password("AnyPassword")
                .simulateError500(true)
                .build();

        assertThrows(RuntimeException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("login: Tài khoản NCC lưu mật khẩu BCrypt (tạo qua Admin) đăng nhập được")
    void login_BcryptPassword_Success() {
        String hash = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("Secret@123");
        com.dulichso.bookingapi.entity.Provider provider = com.dulichso.bookingapi.entity.Provider.builder()
                .id(5L).name("NCC Test").status(com.dulichso.bookingapi.entity.enums.ProviderStatus.ACTIVE).build();
        com.dulichso.bookingapi.entity.Account acc = com.dulichso.bookingapi.entity.Account.builder()
                .id(9L).email("bcrypt@ncc.vn").passwordHash(hash)
                .role(com.dulichso.bookingapi.entity.enums.AccountRole.PROVIDER)
                .status(com.dulichso.bookingapi.entity.enums.AccountStatus.ACTIVE).provider(provider).build();
        org.mockito.Mockito.when(accountRepository.findByIdentifier("bcrypt@ncc.vn")).thenReturn(java.util.Optional.of(acc));
        org.mockito.Mockito.when(jwtUtils.generateToken(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString())).thenReturn("tok");

        var res = authService.login(com.dulichso.bookingapi.dto.auth.PortalAuthDtos.PortalLoginRequest.builder()
                .identifier("bcrypt@ncc.vn").password("Secret@123").build());
        org.junit.jupiter.api.Assertions.assertEquals("tok", res.getToken());
    }
}

package com.dulichso.bookingapi.security;

import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** NFR-SEC-03: phiên bị thu hồi khi khóa/đổi quyền/đổi phiên bản token và hết phiên khi không hoạt động. */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String IDENTIFIER = "admin@taybactrails.vn";

    @Mock private AccountRepository accountRepository;
    @Mock private FilterChain chain;

    private JwtUtils jwtUtils;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "unit-test-secret-key-at-least-32-bytes-long!!");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3_600_000L);
        filter = new JwtAuthenticationFilter(jwtUtils, accountRepository, 30);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Account admin(int tokenVersion, LocalDateTime lastActivity) {
        return Account.builder().id(1L).email(IDENTIFIER).role(AccountRole.ADMIN).status(AccountStatus.ACTIVE)
                .tokenVersion(tokenVersion).lastActivityAt(lastActivity).build();
    }

    private MockHttpServletRequest requestWith(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/admin/accounts");
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }

    @Test
    @DisplayName("Token hợp lệ, cùng phiên bản, còn hoạt động: xác thực thành công")
    void validSession_authenticates() throws Exception {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(admin(2, LocalDateTime.now().minusMinutes(5))));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN", 2);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWith(token), response, chain);

        verify(chain).doFilter(any(), any());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(200, response.getStatus());
    }

    @Test
    @DisplayName("Phiên bản token đã bị tăng (đổi quyền/khóa/đặt lại mật khẩu/đăng xuất): 401 SESSION_REVOKED")
    void outdatedTokenVersion_rejected() throws Exception {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(admin(3, LocalDateTime.now())));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN", 2);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWith(token), response, chain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("SESSION_REVOKED"));
        verify(chain, never()).doFilter(any(), any());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Token cấp trước khi có cơ chế thu hồi (không có claim tv): 401 SESSION_REVOKED")
    void tokenWithoutVersion_rejected() throws Exception {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(admin(0, LocalDateTime.now())));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWith(token), response, chain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("SESSION_REVOKED"));
    }

    @Test
    @DisplayName("Quyền trong DB khác quyền trong token: 401 SESSION_REVOKED, không tin claim trong token")
    void roleChangedInDatabase_rejected() throws Exception {
        Account provider = Account.builder().id(1L).email(IDENTIFIER).role(AccountRole.PROVIDER).status(AccountStatus.ACTIVE)
                .provider(Provider.builder().id(9L).status(ProviderStatus.ACTIVE).build())
                .tokenVersion(0).lastActivityAt(LocalDateTime.now()).build();
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(provider));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN", 0);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWith(token), response, chain);

        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Không hoạt động quá 30 phút: 401 SESSION_EXPIRED")
    void idleTooLong_expired() throws Exception {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(admin(0, LocalDateTime.now().minusMinutes(31))));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN", 0);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWith(token), response, chain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("SESSION_EXPIRED"));
        verify(accountRepository, never()).touchActivity(anyLong(), any());
    }

    @Test
    @DisplayName("Hoạt động gần nhất đã quá 60 giây: cập nhật lại thời điểm hoạt động")
    void activeSession_touchesLastActivity() throws Exception {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(admin(0, LocalDateTime.now().minusMinutes(10))));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN", 0);

        filter.doFilter(requestWith(token), new MockHttpServletResponse(), chain);

        verify(accountRepository).touchActivity(eq(1L), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Hoạt động vừa được ghi (< 60 giây): không UPDATE lại")
    void recentActivity_notTouchedAgain() throws Exception {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(admin(0, LocalDateTime.now().minusSeconds(10))));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN", 0);

        filter.doFilter(requestWith(token), new MockHttpServletResponse(), chain);

        verify(accountRepository, never()).touchActivity(anyLong(), any());
    }

    @Test
    @DisplayName("Tài khoản bị vô hiệu hóa: 403 ACCOUNT_INACTIVE dù token còn hạn")
    void inactiveAccount_rejected() throws Exception {
        Account inactive = admin(0, LocalDateTime.now());
        inactive.setStatus(AccountStatus.INACTIVE);
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.of(inactive));
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN", 0);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWith(token), response, chain);

        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("ACCOUNT_INACTIVE"));
    }

    @Test
    @DisplayName("Tài khoản QA mẫu không có trong DB: giữ hành vi cũ, không kiểm tra phiên")
    void unknownAccount_keepsLegacyBehaviour() throws Exception {
        when(accountRepository.findByIdentifier(IDENTIFIER)).thenReturn(Optional.empty());
        String token = jwtUtils.generateToken(IDENTIFIER, "ROLE_ADMIN");

        filter.doFilter(requestWith(token), new MockHttpServletResponse(), chain);

        verify(chain).doFilter(any(), any());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }
}

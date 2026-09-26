package com.dulichso.bookingapi.security;

import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Filter chạy 1 lần mỗi request để xác thực JWT token từ Authorization header.
 * Nếu token hợp lệ: set UserPrincipal vào SecurityContextHolder.
 *
 * NFR-SEC-03: phiên của Admin/NCC bị từ chối khi tài khoản bị khóa, đổi quyền, đổi phiên bản token
 * (đặt lại mật khẩu/đăng xuất) hoặc không hoạt động quá {@code app.security.idle-timeout-minutes}.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    /** Chỉ ghi lại hoạt động nếu lần ghi trước đã quá khoảng này, tránh UPDATE trên mỗi request. */
    static final Duration TOUCH_INTERVAL = Duration.ofSeconds(60);

    private final JwtUtils jwtUtils;
    private final AccountRepository accountRepository;
    private final Duration idleTimeout;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, AccountRepository accountRepository,
                                   @Value("${app.security.idle-timeout-minutes:30}") long idleTimeoutMinutes) {
        this.jwtUtils = jwtUtils;
        this.accountRepository = accountRepository;
        this.idleTimeout = Duration.ofMinutes(idleTimeoutMinutes);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null && jwtUtils.validateToken(token)) {
            try {
                String username = jwtUtils.getUsernameFromToken(token);
                String roleStr  = jwtUtils.getRoleFromToken(token);

                // roleStr dạng "ROLE_ADMIN" → lấy phần sau "ROLE_"
                AccountRole role = AccountRole.valueOf(
                        roleStr.startsWith("ROLE_") ? roleStr.substring(5) : roleStr
                );

                // NCC bị đình chỉ / chấm dứt (hoặc tài khoản bị vô hiệu hóa) mất quyền ngay,
                // kể cả khi đang giữ token còn hạn.
                // accountId không lưu trong token nên tra DB theo identifier. Cần cho kiểm tra
                // "không tự khóa mình" và ghi nhận người thao tác trong audit log.
                Account account = accountRepository.findByIdentifier(username).orElse(null);
                if (account != null && account.getStatus() != AccountStatus.ACTIVE) {
                    if (role == AccountRole.PROVIDER) {
                        rejectSuspended(response);
                    } else {
                        rejectInactive(response);
                    }
                    return;
                }
                if (role == AccountRole.PROVIDER && isProviderBlocked(account)) {
                    rejectSuspended(response);
                    return;
                }

                // Tài khoản QA mẫu không có trong DB (account == null): giữ hành vi cũ, không kiểm tra phiên.
                if (account != null) {
                    // Quyền lấy từ DB, không tin claim trong token: đổi quyền có hiệu lực ngay.
                    Integer tokenVersion = jwtUtils.getTokenVersionFromToken(token);
                    if (account.getRole() != role || tokenVersion == null || tokenVersion != account.getTokenVersion()) {
                        rejectSession(response, "SESSION_REVOKED",
                                "Phiên đăng nhập không còn hiệu lực do thay đổi tài khoản hoặc quyền. Vui lòng đăng nhập lại.");
                        return;
                    }
                    LocalDateTime now = LocalDateTime.now();
                    LocalDateTime lastActivity = account.getLastActivityAt();
                    if (lastActivity != null && lastActivity.plus(idleTimeout).isBefore(now)) {
                        rejectSession(response, "SESSION_EXPIRED",
                                "Phiên đăng nhập đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.");
                        return;
                    }
                    if (lastActivity == null || lastActivity.plus(TOUCH_INTERVAL).isBefore(now)) {
                        accountRepository.touchActivity(account.getId(), now);
                    }
                }

                Long accountId = account != null ? account.getId() : null;
                Long providerId = account != null && account.getProvider() != null ? account.getProvider().getId() : null;
                UserPrincipal principal = new UserPrincipal(accountId, username, role, providerId);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ex) {
                log.warn("Không thể set authentication từ JWT token: {}", ex.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isProviderBlocked(Account account) {
        if (account == null) return false; // tài khoản mẫu QA không có trong DB: giữ hành vi cũ
        if (account.getStatus() != AccountStatus.ACTIVE) return true;
        return account.getProvider() == null || account.getProvider().getStatus() != ProviderStatus.ACTIVE;
    }

    private void rejectInactive(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":403,\"errorCode\":\"ACCOUNT_INACTIVE\","
                + "\"message\":\"Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị hệ thống.\"}");
    }

    private void rejectSuspended(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":403,\"errorCode\":\"PROVIDER_SUSPENDED\","
                + "\"message\":\"Tài khoản của bạn đang bị đình chỉ. Vui lòng liên hệ để được mở lại.\"}");
    }

    private void rejectSession(HttpServletResponse response, String errorCode, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":401,\"errorCode\":\"" + errorCode + "\",\"message\":\"" + message + "\"}");
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}

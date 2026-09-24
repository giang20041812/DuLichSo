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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter chạy 1 lần mỗi request để xác thực JWT token từ Authorization header.
 * Nếu token hợp lệ: set UserPrincipal vào SecurityContextHolder.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtils jwtUtils;
    private final AccountRepository accountRepository;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, AccountRepository accountRepository) {
        this.jwtUtils = jwtUtils;
        this.accountRepository = accountRepository;
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
                if (role == AccountRole.PROVIDER && isProviderBlocked(username)) {
                    rejectSuspended(response);
                    return;
                }

                // accountId không lưu trong token — nếu cần phải query DB,
                // nhưng để giữ stateless ta để null, service sẽ dùng identifier nếu cần.
                UserPrincipal principal = new UserPrincipal(null, username, role, null);

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

    private boolean isProviderBlocked(String identifier) {
        Account account = accountRepository.findByIdentifier(identifier).orElse(null);
        if (account == null) return false; // tài khoản mẫu QA không có trong DB: giữ hành vi cũ
        if (account.getStatus() != AccountStatus.ACTIVE) return true;
        return account.getProvider() == null || account.getProvider().getStatus() != ProviderStatus.ACTIVE;
    }

    private void rejectSuspended(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":403,\"errorCode\":\"PROVIDER_SUSPENDED\","
                + "\"message\":\"Tài khoản của bạn đang bị đình chỉ. Vui lòng liên hệ để được mở lại.\"}");
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}

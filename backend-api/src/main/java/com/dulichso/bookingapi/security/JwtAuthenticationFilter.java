package com.dulichso.bookingapi.security;

import com.dulichso.bookingapi.entity.enums.AccountRole;
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

    public JwtAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
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

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}

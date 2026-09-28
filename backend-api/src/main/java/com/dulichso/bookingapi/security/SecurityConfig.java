package com.dulichso.bookingapi.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cấu hình Spring Security:
 * - Stateless JWT (không dùng session)
 * - RBAC: /api/v1/admin/** → ADMIN, /api/v1/partner/** → PROVIDER/ADMIN
 * - /api/public/** → permitAll (bao gồm SOS khẩn cấp)
 * - /api/v1/auth/** → permitAll (đăng nhập)
 * - CORS restricted theo danh sách origin cho phép (không dùng *)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuditingAccessDeniedHandler accessDeniedHandler;

    /** Danh sách origin frontend được phép, cấu hình qua CORS_ALLOWED_ORIGINS (phân tách bằng dấu phẩy). */
    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, AuditingAccessDeniedHandler accessDeniedHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public: không cần đăng nhập (SOS khẩn cấp, info công khai, error dispatch)
                        .requestMatchers("/api/public/**", "/error").permitAll()
                        // Auth endpoints (đăng nhập portal, google)
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Admin endpoints: chỉ ADMIN, phân theo cấp (thứ tự khai báo quan trọng — khớp quy tắc đầu tiên).
                        //   Cấp 1 = toàn quyền · Cấp 2 = vận hành (duyệt, xử lý) · Cấp 3 = xem + kiểm duyệt đánh giá + ghi nhận giám sát.
                        // Mọi ADMIN: thông tin cấp của chính mình và thông báo của mình.
                        .requestMatchers("/api/v1/admin/accounts/me", "/api/v1/admin/notifications/**").hasRole("ADMIN")
                        // Cấp 2: khóa/mở khóa và đặt lại mật khẩu (dịch vụ chặn cấp 2 tác động lên tài khoản Admin).
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/admin/accounts/*/status", "/api/v1/admin/accounts/*/reset-password").hasAuthority("ADMIN_L2")
                        // Cấp 1: quản lý tài khoản (tạo Admin, đổi quyền/cấp), tài chính, xóa điểm đến.
                        .requestMatchers("/api/v1/admin/accounts/**", "/api/v1/admin/finance/**").hasAuthority("ADMIN_L1")
                        .requestMatchers(HttpMethod.POST, "/api/v1/admin/places/delete").hasAuthority("ADMIN_L1")
                        // Cấp 3 trở lên được ghi nhận giám sát Booking và kiểm duyệt đánh giá.
                        .requestMatchers(HttpMethod.POST, "/api/v1/admin/reviews/*/moderate", "/api/v1/admin/bookings/*/notes").hasAuthority("ADMIN_L3")
                        // Nhật ký hoạt động và hàng đợi hồ sơ NCC / yêu cầu thay đổi (chứa SĐT, email, thông tin cơ sở): từ cấp 2.
                        .requestMatchers(HttpMethod.GET, "/api/v1/admin/audit-logs/**", "/api/v1/admin/dashboard/activity",
                                "/api/v1/admin/provider-applications/**", "/api/v1/admin/change-requests/**").hasAuthority("ADMIN_L2")
                        // Còn lại: đọc dữ liệu (mọi cấp), ghi/xử lý (từ cấp 2).
                        .requestMatchers(HttpMethod.GET, "/api/v1/admin/**").hasAuthority("ADMIN_L3")
                        .requestMatchers("/api/v1/admin/**").hasAuthority("ADMIN_L2")
                        // Partner endpoints: PROVIDER hoặc ADMIN
                        .requestMatchers("/api/v1/partner/**").hasAnyRole("PROVIDER", "ADMIN")
                        // Tất cả còn lại: phải đăng nhập
                        .anyRequest().authenticated()
                )
                // NFR-SEC-05: ghi audit log khi người dùng đã đăng nhập bị từ chối truy cập.
                .exceptionHandling(ex -> ex.accessDeniedHandler(accessDeniedHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        java.util.List<String> patterns = new java.util.ArrayList<>(java.util.List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*:*",
                "http://10.*:*",
                "http://172.16.*:*",
                "https://*.ngrok-free.app",
                "https://*.ngrok.io",
                "https://*.ngrok-free.dev",
                "https://*.loca.lt",
                "https://*.trycloudflare.com",
                "https://*.vercel.app",
                "https://*.onrender.com"
        ));
        if (allowedOrigins != null) {
            for (String o : allowedOrigins) {
                String trimmed = o.trim();
                if (!trimmed.isEmpty() && !patterns.contains(trimmed)) {
                    patterns.add(trimmed);
                }
            }
        }
        config.setAllowedOriginPatterns(patterns);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition", "ngrok-skip-browser-warning"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

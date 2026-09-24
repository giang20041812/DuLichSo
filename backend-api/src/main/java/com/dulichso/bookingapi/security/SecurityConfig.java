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

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
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
                        // Public: không cần đăng nhập (SOS khẩn cấp, info công khai)
                        .requestMatchers("/api/public/**").permitAll()
                        // Auth endpoints (đăng nhập portal, google)
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Admin endpoints: chỉ ADMIN
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        // Partner endpoints: PROVIDER hoặc ADMIN
                        .requestMatchers("/api/v1/partner/**").hasAnyRole("PROVIDER", "ADMIN")
                        // Tất cả còn lại: phải đăng nhập
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Chỉ cho phép các origin cụ thể — KHÔNG dùng * theo AGENTS.md
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",    // Vite dev server
                "http://localhost:3000",
                "https://taybactrails.vn"  // Production domain
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

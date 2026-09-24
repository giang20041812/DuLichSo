package com.dulichso.bookingapi.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * Tiện ích JWT: tạo, xác thực và đọc claims từ JWT token.
 * Dùng HS256 với secret key từ application.yml (biến jwt.secret).
 */
@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Tạo JWT token chứa username và role.
     *
     * @param username identifier (email hoặc phone)
     * @param role     dạng "ROLE_ADMIN" hoặc "ROLE_PROVIDER"
     * @return JWT token string
     */
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Kiểm tra JWT token có hợp lệ không (chữ ký + chưa hết hạn).
     *
     * @param token JWT token string
     * @return true nếu hợp lệ
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.warn("JWT không hợp lệ: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.warn("JWT đã hết hạn: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("JWT không được hỗ trợ: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims rỗng: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Lấy username (subject) từ token.
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Lấy role claim từ token.
     */
    public String getRoleFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }
}

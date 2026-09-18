package com.dulichso.bookingapi.security;

import org.springframework.stereotype.Component;

@Component
public class JwtUtils {

    // TODO: Bổ sung Secret Key và Expiration Time từ application.yml

    public String generateToken(String username, String role) {
        // TODO: Tạo JWT Token với username và role (sử dụng jjwt)
        return "mock_jwt_token";
    }

    public boolean validateToken(String token) {
        // TODO: Kiểm tra signature và expiration của token
        return true;
    }

    public String getUsernameFromToken(String token) {
        // TODO: Giải mã token lấy username
        return "mock_username";
    }
}

package com.dulichso.bookingapi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Xác minh Google ID token (từ Google Identity Services) qua endpoint tokeninfo của Google.
 * Chỉ chấp nhận token có audience khớp GOOGLE_OAUTH_CLIENT_ID và email đã được Google xác minh.
 */
@Service
public class GoogleTokenVerifier {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.oauth.client-id}")
    private String clientId;

    public record GoogleProfile(String email, String fullName, String picture) {}

    public static class InvalidGoogleTokenException extends RuntimeException {
        public InvalidGoogleTokenException(String message) {
            super(message);
        }
    }

    public GoogleProfile verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new InvalidGoogleTokenException("Thiếu Google ID token.");
        }
        if (clientId == null || clientId.isBlank() || clientId.startsWith("your_")) {
            throw new IllegalStateException("Chưa cấu hình GOOGLE_OAUTH_CLIENT_ID ở backend.");
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TOKENINFO_URL + URLEncoder.encode(idToken, StandardCharsets.UTF_8)))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new InvalidGoogleTokenException("Google ID token không hợp lệ hoặc đã hết hạn.");
            }

            JsonNode body = objectMapper.readTree(response.body());
            if (!clientId.equals(body.path("aud").asText())) {
                throw new InvalidGoogleTokenException("Google ID token không dành cho ứng dụng này.");
            }
            if (!"true".equals(body.path("email_verified").asText())) {
                throw new InvalidGoogleTokenException("Email Google chưa được xác minh.");
            }
            String email = body.path("email").asText("");
            if (email.isBlank()) {
                throw new InvalidGoogleTokenException("Google ID token không chứa email.");
            }
            return new GoogleProfile(email, body.path("name").asText(email), body.path("picture").asText(null));
        } catch (InvalidGoogleTokenException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Bị ngắt khi xác minh Google token.", ex);
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể xác minh Google token.", ex);
        }
    }
}

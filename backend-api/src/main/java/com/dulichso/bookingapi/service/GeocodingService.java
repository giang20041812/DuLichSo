package com.dulichso.bookingapi.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Tra tọa độ từ địa chỉ bằng VietMap Search API.
 */
@Service
@Slf4j
public class GeocodingService {

    public record GeocodeResult(double latitude, double longitude, String displayName) {}

    private static final int CACHE_LIMIT = 500;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, Optional<GeocodeResult>> cache = new LinkedHashMap<>(16, 0.75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, Optional<GeocodeResult>> eldest) {return size() > CACHE_LIMIT;}
    };
    private long lastCallAt;

    @Value("${app.geocoding.vietmap-url:https://maps.vietmap.vn/api/search/v3}")
    private String endpoint;

    @Value("${app.geocoding.vietmap-place-url:https://maps.vietmap.vn/api/place/v3}")
    private String placeEndpoint;

    @Value("${app.geocoding.vietmap-api-key:${VIETMAP_API_KEY:}}")
    private String apiKey;

    /** Optional.empty() khi không tìm thấy địa chỉ. */
    public Optional<GeocodeResult> geocode(String address) {
        String key = address.trim().replaceAll("\\s+", " ").toLowerCase();
        synchronized (cache) {
            if (cache.containsKey(key)) return cache.get(key);
        }
        Optional<GeocodeResult> result = call(address.trim());
        synchronized (cache) {
            cache.put(key, result);
        }
        return result;
    }

    private synchronized Optional<GeocodeResult> call(String address) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Chưa cấu hình VIETMAP_API_KEY");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ bản đồ chưa được cấu hình. Bạn có thể nhập tọa độ thủ công.");
        }
        waitForSlot();
        java.net.URI url = UriComponentsBuilder.fromHttpUrl(endpoint)
                .queryParam("apikey", apiKey)
                .queryParam("text", address)
                .build().encode().toUri();
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        try {
            JsonNode[] body = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), JsonNode[].class).getBody();
            if (body != null && body.length > 0) {
                JsonNode first = body[0];
                // Search v3 returns ref_id; coordinates are provided by Place v3.
                // https://maps.vietmap.vn/docs/vi/map-api/geocodev3/
                String refId = first.path("ref_id").asText("");
                if (refId.isBlank()) throw invalidResponse();
                java.net.URI placeUrl = UriComponentsBuilder.fromHttpUrl(placeEndpoint)
                        .queryParam("apikey", apiKey)
                        .queryParam("refid", refId)
                        .build().encode().toUri();
                JsonNode place = restTemplate.exchange(placeUrl, HttpMethod.GET,
                        new HttpEntity<>(headers), JsonNode.class).getBody();
                if (place != null && place.path("lat").isNumber() && place.path("lng").isNumber()) {
                    double lat = place.get("lat").asDouble();
                    double lon = place.get("lng").asDouble();
                    String display = first.has("display") ? first.get("display").asText() : (first.has("name") ? first.get("name").asText() : address);
                    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                        return Optional.of(new GeocodeResult(lat, lon, display));
                    }
                }
                throw invalidResponse();
            }
            if (body == null) throw invalidResponse();
            return Optional.empty();
        } catch (RestClientResponseException e) {
            // Log only the status: URLs and response bodies may contain credentials.
            int status = e.getStatusCode().value();
            log.warn("VietMap API HTTP status={}", status);
            String message = switch (status) {
                case 401, 403 -> "VietMap từ chối quyền truy cập. Hãy kiểm tra API key và quyền Search/Place của key.";
                case 423 -> "VietMap chưa bật API cho key này hoặc đã hết hạn mức. Hãy dùng Services key có quyền Search/Place và kiểm tra hạn mức trong VietMap Console.";
                case 429 -> "Dịch vụ bản đồ đang giới hạn lượt gọi. Vui lòng thử lại sau.";
                default -> "Dịch vụ bản đồ từ chối yêu cầu (HTTP " + status + "). Bạn có thể nhập tọa độ thủ công.";
            };
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
        } catch (RestClientException e) {
            // Exception messages can contain the request URL, including the API key.
            log.warn("Không gọi được Vietmap API ({})", e.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Không kết nối được dịch vụ bản đồ. Bạn có thể nhập tọa độ thủ công.");
        } finally {
            lastCallAt = System.currentTimeMillis();
        }
    }

    private ResponseStatusException invalidResponse() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Dịch vụ bản đồ trả về dữ liệu tọa độ không hợp lệ. Bạn có thể nhập tọa độ thủ công.");
    }

    private void waitForSlot() {
        long wait = 1000 - (System.currentTimeMillis() - lastCallAt);
        if (wait <= 0) return;
        try {
            Thread.sleep(wait);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

}

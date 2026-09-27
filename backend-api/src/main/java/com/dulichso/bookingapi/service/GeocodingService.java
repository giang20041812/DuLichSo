package com.dulichso.bookingapi.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
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
            return Optional.empty();
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
                if (first.has("lat") && first.has("lng")) {
                    double lat = first.get("lat").asDouble();
                    double lon = first.get("lng").asDouble();
                    String display = first.has("display") ? first.get("display").asText() : (first.has("name") ? first.get("name").asText() : address);
                    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                        return Optional.of(new GeocodeResult(lat, lon, display));
                    }
                }
            }
            return Optional.empty();
        } catch (RestClientException e) {
            log.warn("Không gọi được Vietmap API: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Không kết nối được dịch vụ bản đồ. Bạn có thể nhập tọa độ thủ công.");
        } finally {
            lastCallAt = System.currentTimeMillis();
        }
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

package com.dulichso.bookingapi.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Tra tọa độ từ địa chỉ bằng Nominatim (OpenStreetMap) — cùng nguồn bản đồ với OpenStreetMapView ở frontend, không cần API key.
 * Theo Nominatim Usage Policy (https://operations.osmfoundation.org/policies/nominatim/): tối đa 1 request/giây,
 * phải có User-Agent định danh ứng dụng, nên backend gọi thay trình duyệt, xếp hàng 1 request/giây và cache kết quả.
 * Endpoint: https://nominatim.org/release-docs/latest/api/Search/
 * TODO: verify against docs — chưa xác minh với API thật (field lat/lon trả dạng chuỗi, display_name, importance).
 */
@Service
@Slf4j
public class GeocodingService {

    /** Một phần tử trong mảng kết quả /search?format=jsonv2. TODO: verify against docs — chưa xác minh với API thật */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NominatimPlace(String lat, String lon, @JsonProperty("display_name") String displayName) {}

    public record GeocodeResult(double latitude, double longitude, String displayName) {}

    private static final int CACHE_LIMIT = 500;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, Optional<GeocodeResult>> cache = new LinkedHashMap<>(16, 0.75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, Optional<GeocodeResult>> eldest) {return size() > CACHE_LIMIT;}
    };
    private long lastCallAt;

    @Value("${app.geocoding.nominatim-url:https://nominatim.openstreetmap.org/search}")
    private String endpoint;

    @Value("${app.geocoding.user-agent:DuLichSo/1.0 (homestay partner portal)}")
    private String userAgent;

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
        waitForSlot();
        // Truyền java.net.URI (đã encode một lần) để RestTemplate không encode lại, tránh hỏng tiếng Việt có dấu.
        java.net.URI url = UriComponentsBuilder.fromHttpUrl(endpoint)
                .queryParam("q", address).queryParam("format", "jsonv2").queryParam("limit", 1)
                .queryParam("countrycodes", "vn").queryParam("accept-language", "vi")
                .build().encode().toUri();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, userAgent);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        try {
            NominatimPlace[] body = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), NominatimPlace[].class).getBody();
            return Arrays.stream(body == null ? new NominatimPlace[0] : body).findFirst().flatMap(GeocodingService::toResult);
        } catch (RestClientException e) {
            log.warn("Không gọi được Nominatim: {}", e.getMessage());
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

    private static Optional<GeocodeResult> toResult(NominatimPlace place) {
        try {
            double lat = Double.parseDouble(place.lat());
            double lon = Double.parseDouble(place.lon());
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return Optional.empty();
            return Optional.of(new GeocodeResult(lat, lon, place.displayName()));
        } catch (NumberFormatException | NullPointerException e) {
            return Optional.empty();
        }
    }
}

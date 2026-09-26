package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.MediaProvider;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Cloudflare Images — Direct Creator Upload: backend xin uploadURL dùng một lần, trình duyệt upload thẳng lên Cloudflare,
 * sau đó backend kiểm tra lại ảnh (GET) trước khi gắn vào Homestay/phòng. API token chỉ nằm ở backend.
 *
 * Endpoint theo https://developers.cloudflare.com/images/upload-images/direct-creator-upload/ và
 * https://developers.cloudflare.com/api/resources/images/subresources/v1/
 * TODO: verify against docs — chưa xác minh với API thật (cấu trúc envelope, field `draft`, `meta`, `variants`).
 */
@Service
@Slf4j
public class CloudflareImagesService implements MediaStorageProvider {

    private static final String API = "https://api.cloudflare.com/client/v4/accounts/%s/images";

    /** Envelope chung của Cloudflare API v4. TODO: verify against docs — chưa xác minh với API thật */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Envelope<T>(boolean success, List<Map<String, Object>> errors, T result) {}

    /** POST /images/v2/direct_upload → result. TODO: verify against docs — chưa xác minh với API thật */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DirectUpload(String id, String uploadURL) {}

    /** GET /images/v1/{id} → result. draft=true khi uploadURL đã cấp nhưng chưa có file. TODO: verify against docs — chưa xác minh với API thật */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImageDetails(String id, String filename, Map<String, Object> meta, Boolean requireSignedURLs,
                               List<String> variants, String uploaded, Boolean draft) {}

    @Value("${cloudflare.account-id}")
    private String accountId;

    @Value("${cloudflare.api-token}")
    private String apiToken;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper json = new ObjectMapper();

    @Override
    public MediaProvider getProviderType() {
        return MediaProvider.CLOUDFLARE_IMAGES;
    }

    @Override
    public Map<String, Object> getUploadConfig() {
        DirectUpload upload = createDirectUpload(Map.of());
        Map<String, Object> config = new HashMap<>();
        config.put("provider", getProviderType().name());
        config.put("uploadUrl", upload.uploadURL());
        config.put("id", upload.id());
        return config;
    }

    /** metadata được Cloudflare lưu kèm ảnh, dùng để kiểm tra ảnh thuộc đúng nhà cung cấp khi gắn vào Homestay. */
    public DirectUpload createDirectUpload(Map<String, Object> metadata) {
        requireConfigured();
        var form = new LinkedMultiValueMap<String, Object>();
        form.add("requireSignedURLs", "false");
        try {
            form.add("metadata", json.writeValueAsString(metadata));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException("Metadata ảnh không hợp lệ", e);
        }
        HttpHeaders headers = auth();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        Envelope<DirectUpload> body = call(String.format(API, accountId) + "/v2/direct_upload", HttpMethod.POST,
                new HttpEntity<>(form, headers), new ParameterizedTypeReference<>() {});
        if (body.result() == null || body.result().uploadURL() == null) throw unavailable("Cloudflare không trả về đường dẫn upload.");
        return body.result();
    }

    /** Optional.empty() khi ảnh không tồn tại. */
    public Optional<ImageDetails> getImage(String imageId) {
        requireConfigured();
        try {
            Envelope<ImageDetails> body = call(String.format(API, accountId) + "/v1/" + imageId, HttpMethod.GET,
                    new HttpEntity<>(auth()), new ParameterizedTypeReference<>() {});
            return Optional.ofNullable(body.result());
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        }
    }

    /** Xóa ảnh trên Cloudflare; lỗi chỉ ghi log vì bản ghi trong DB đã được gỡ. */
    public void deleteImageQuietly(String imageId) {
        if (!configured()) return;
        try {
            restTemplate.exchange(String.format(API, accountId) + "/v1/" + imageId, HttpMethod.DELETE, new HttpEntity<>(auth()), String.class);
        } catch (RestClientException e) {
            log.warn("Không xóa được ảnh Cloudflare {}: {}", imageId, e.getMessage());
        }
    }

    /** Ưu tiên variant tên "public" (mặc định của Cloudflare Images), không có thì lấy variant đầu tiên. */
    public static String deliveryUrl(ImageDetails image) {
        List<String> variants = image.variants() == null ? List.of() : image.variants();
        return variants.stream().filter(v -> v.endsWith("/public")).findFirst().orElse(variants.isEmpty() ? null : variants.get(0));
    }

    private <T> Envelope<T> call(String url, HttpMethod method, HttpEntity<?> entity, ParameterizedTypeReference<Envelope<T>> type) {
        try {
            ResponseEntity<Envelope<T>> response = restTemplate.exchange(url, method, entity, type);
            Envelope<T> body = response.getBody();
            if (body == null || !body.success()) throw unavailable("Cloudflare Images từ chối yêu cầu: " + (body == null ? "không có nội dung" : body.errors()));
            return body;
        } catch (HttpClientErrorException.NotFound e) {
            throw e;
        } catch (RestClientException e) {
            log.warn("Lỗi gọi Cloudflare Images: {}", e.getMessage());
            throw unavailable("Không kết nối được dịch vụ lưu ảnh. Vui lòng thử lại sau.");
        }
    }

    private HttpHeaders auth() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiToken);
        return headers;
    }

    private boolean configured() {
        return accountId != null && !accountId.isBlank() && !accountId.startsWith("your_")
                && apiToken != null && !apiToken.isBlank() && !apiToken.startsWith("your_");
    }

    private void requireConfigured() {
        if (!configured()) throw unavailable("Chưa cấu hình Cloudflare Images (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN) ở backend.");
    }

    private static ResponseStatusException unavailable(String message) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}

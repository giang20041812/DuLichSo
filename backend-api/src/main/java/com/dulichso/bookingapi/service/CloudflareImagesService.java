package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.MediaProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.MediaType;

import java.util.Map;
import java.util.HashMap;

@Service
public class CloudflareImagesService implements MediaStorageProvider {

    @Value("${cloudflare.account-id}")
    private String accountId;

    @Value("${cloudflare.api-token}")
    private String apiToken;

    private final RestTemplate restTemplate;

    public CloudflareImagesService() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public MediaProvider getProviderType() {
        return MediaProvider.CLOUDFLARE_IMAGES;
    }

    @Override
    public Map<String, Object> getUploadConfig() {
        String url = String.format("https://api.cloudflare.com/client/v4/accounts/%s/images/v2/direct_upload", accountId);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>("{}", headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Boolean success = (Boolean) body.get("success");
                if (Boolean.TRUE.equals(success)) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> result = (Map<String, Object>) body.get("result");
                    
                    Map<String, Object> config = new HashMap<>();
                    config.put("provider", getProviderType().name());
                    config.put("uploadUrl", result.get("uploadURL"));
                    config.put("id", result.get("id"));
                    return config;
                }
            }
            throw new RuntimeException("Failed to get Direct Upload URL from Cloudflare Images: " + response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Cloudflare API", e);
        }
    }
}

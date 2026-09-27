package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.MediaProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.time.Instant;

@Service
public class CloudinaryService implements MediaStorageProvider {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    @Override
    public MediaProvider getProviderType() {
        return MediaProvider.CLOUDINARY;
    }

    @Override
    public Map<String, Object> getUploadConfig() {
        long timestamp = Instant.now().getEpochSecond();
        String toSign = "timestamp=" + timestamp + apiSecret;
        String signature = sha1Hex(toSign);

        Map<String, Object> config = new HashMap<>();
        config.put("provider", getProviderType().name());
        config.put("cloudName", cloudName);
        config.put("apiKey", apiKey);
        config.put("timestamp", timestamp);
        config.put("signature", signature);
        
        return config;
    }

    private String sha1Hex(String input) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 algorithm not available", e);
        }
    }
}

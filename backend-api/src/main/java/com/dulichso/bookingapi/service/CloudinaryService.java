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
        // In a real implementation, you would use Cloudinary's Java SDK to generate the signature
        // e.g. cloudinary.utils.apiSignRequest(params, apiSecret)
        long timestamp = Instant.now().getEpochSecond();
        
        // Mocking signature for now as SDK is not installed.
        // The real project would either install cloudinary SDK or implement SHA-1 HMAC manually.
        String signature = "mock_signature_for_timestamp_" + timestamp;

        Map<String, Object> config = new HashMap<>();
        config.put("provider", getProviderType().name());
        config.put("cloudName", cloudName);
        config.put("apiKey", apiKey);
        config.put("timestamp", timestamp);
        config.put("signature", signature);
        
        return config;
    }
}

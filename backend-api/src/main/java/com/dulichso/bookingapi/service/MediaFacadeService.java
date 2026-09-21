package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.MediaProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MediaFacadeService {

    private final List<MediaStorageProvider> providers;
    
    @Value("${app.media.active-provider}")
    private String activeProviderName;

    @Autowired
    public MediaFacadeService(List<MediaStorageProvider> providers) {
        this.providers = providers;
    }

    /**
     * Gets the upload configuration from the currently active provider.
     * The active provider is configured via `app.media.active-provider` in application.yml.
     */
    public Map<String, Object> getActiveUploadConfig() {
        MediaProvider activeProviderEnum = MediaProvider.valueOf(activeProviderName);
        
        Optional<MediaStorageProvider> activeProvider = providers.stream()
                .filter(p -> p.getProviderType() == activeProviderEnum)
                .findFirst();
                
        if (activeProvider.isEmpty()) {
            throw new RuntimeException("Active media provider not found or not supported: " + activeProviderName);
        }
        
        return activeProvider.get().getUploadConfig();
    }
}

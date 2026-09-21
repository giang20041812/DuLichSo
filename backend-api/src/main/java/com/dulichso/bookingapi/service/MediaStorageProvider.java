package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.MediaProvider;
import java.util.Map;

public interface MediaStorageProvider {
    
    /**
     * @return The provider type this service implements
     */
    MediaProvider getProviderType();

    /**
     * Generates required details for the client to upload a file directly to the provider.
     * This could be a presigned URL, a direct upload URL, or a signature.
     * 
     * @return A map containing configuration/URL for the frontend.
     */
    Map<String, Object> getUploadConfig();
}

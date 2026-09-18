package com.dulichso.bookingapi.service;

import org.springframework.stereotype.Service;

@Service
public class CloudinaryService {
    
    public String generateUploadSignature() {
        // TODO: Dùng CLOUDINARY_API_SECRET để tạo chữ ký (signature) cho client upload trực tiếp
        // Trả về timestamp, signature và api_key để client dùng
        return "mock_signature";
    }
}

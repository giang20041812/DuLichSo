package com.dulichso.bookingapi.service;

import org.springframework.stereotype.Service;

@Service
public class FcmService {

    public void sendPushNotification(String deviceToken, String title, String body) {
        // TODO: Gửi HTTP Request tới FCM API hoặc dùng Firebase Admin SDK
        // mang theo FCM_SERVER_KEY để push thông báo tới thiết bị của khách
    }
}

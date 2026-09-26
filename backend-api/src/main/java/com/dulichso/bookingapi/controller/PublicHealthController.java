package com.dulichso.bookingapi.controller;

import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * NFR-AVL-01: điểm kiểm tra sức khỏe cho giám sát/uptime monitor và load balancer.
 * Trả 200 khi ứng dụng và CSDL phản hồi, 503 khi CSDL không truy cập được. Không lộ chi tiết nội bộ.
 */
@RestController
@RequestMapping("/api/public/health")
public class PublicHealthController {
    private final EntityManager em;

    public PublicHealthController(EntityManager em) {
        this.em = em;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        boolean dbUp;
        try {
            em.createNativeQuery("SELECT 1").getSingleResult();
            dbUp = true;
        } catch (Exception ex) {
            dbUp = false;
        }
        Map<String, Object> body = Map.of("status", dbUp ? "UP" : "DOWN", "database", dbUp ? "UP" : "DOWN", "time", Instant.now().toString());
        return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}

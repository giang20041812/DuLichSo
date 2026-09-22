package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.HomeResponseDto;
import com.dulichso.bookingapi.service.PublicHomeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/home")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, maxAge = 3600)
public class PublicHomeController {

    private final PublicHomeService publicHomeService;

    @GetMapping
    public ResponseEntity<?> getHomeData() {
        try {
            return ResponseEntity.ok(publicHomeService.getHomeData());
        } catch (Exception e) {
            log.error("Error in getHomeData", e);
            return ResponseEntity.status(500)
                    .body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }
}

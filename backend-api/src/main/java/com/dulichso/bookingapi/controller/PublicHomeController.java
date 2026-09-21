package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.HomeResponseDto;
import com.dulichso.bookingapi.service.PublicHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/home")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600) // Temporary broad CORS for dev, usually restrict to frontend origin
public class PublicHomeController {

    private final PublicHomeService publicHomeService;

    @GetMapping
    public ResponseEntity<HomeResponseDto> getHomeData() {
        return ResponseEntity.ok(publicHomeService.getHomeData());
    }
}

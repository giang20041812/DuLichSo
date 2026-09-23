package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.FestivalDto;
import com.dulichso.bookingapi.service.PublicFestivalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/public/festivals", "/api/v1/public/festivals"})
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, maxAge = 3600)
public class PublicFestivalController {

    private final PublicFestivalService festivalService;

    @GetMapping
    public ResponseEntity<List<FestivalDto>> getPublishedFestivals() {
        List<FestivalDto> festivals = festivalService.getPublishedFestivals();
        return ResponseEntity.ok(festivals);
    }
}

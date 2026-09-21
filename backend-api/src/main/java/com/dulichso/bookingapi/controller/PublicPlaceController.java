package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.PlaceSummaryDto;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.service.PublicPlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/public/places")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class PublicPlaceController {

    private final PublicPlaceService publicPlaceService;

    @GetMapping
    public ResponseEntity<Page<PlaceSummaryDto>> getPlaces(
            @RequestParam(required = false) CategoryKind kind,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(required = false) List<String> amenities,
            @PageableDefault(size = 20) Pageable pageable) {
            
        return ResponseEntity.ok(publicPlaceService.getPlaces(kind, minPrice, maxPrice, minRating, amenities, pageable));
    }
}

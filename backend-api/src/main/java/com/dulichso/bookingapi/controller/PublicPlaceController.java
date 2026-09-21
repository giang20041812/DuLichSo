package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.MapContextDto;
import com.dulichso.bookingapi.dto.PlaceDetailDto;
import com.dulichso.bookingapi.dto.PlaceSummaryDto;
import com.dulichso.bookingapi.dto.RoomTypeDetailDto;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.service.PlaceDetailService;
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
@RequestMapping({"/api/v1/public/places", "/api/public/places"})
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, maxAge = 3600)
public class PublicPlaceController {

    private final PublicPlaceService publicPlaceService;
    private final PlaceDetailService placeDetailService;

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

    @GetMapping("/{slug}")
    public ResponseEntity<PlaceDetailDto> getPlaceDetail(@PathVariable String slug) {
        return ResponseEntity.ok(placeDetailService.getPlaceDetail(slug));
    }

    @GetMapping("/{slug}/rooms")
    public ResponseEntity<List<RoomTypeDetailDto>> getPlaceRooms(@PathVariable String slug) {
        return ResponseEntity.ok(placeDetailService.getPlaceRooms(slug));
    }

    @GetMapping("/{slug}/map-context")
    public ResponseEntity<MapContextDto> getMapContext(@PathVariable String slug) {
        return ResponseEntity.ok(placeDetailService.getMapContext(slug));
    }
}

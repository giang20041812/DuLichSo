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
import java.time.LocalDate;
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
            @RequestParam(value = "kind", required = false) CategoryKind kind,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "minRating", required = false) BigDecimal minRating,
            @RequestParam(value = "amenities", required = false) List<String> amenities,
            @RequestParam(value = "checkIn", required = false) LocalDate checkIn,
            @RequestParam(value = "checkOut", required = false) LocalDate checkOut,
            @PageableDefault(size = 20) Pageable pageable) {
            
        return ResponseEntity.ok(publicPlaceService.getPlaces(kind, minPrice, maxPrice, minRating, amenities, checkIn, checkOut, pageable));
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<PlaceDetailDto> getPlaceDetail(@PathVariable("identifier") String identifier) {
        if (identifier.matches("^\\d+$")) {
            return ResponseEntity.ok(publicPlaceService.getPlaceDetail(Long.parseLong(identifier)));
        } else {
            return ResponseEntity.ok(placeDetailService.getPlaceDetail(identifier));
        }
    }

    @GetMapping("/{identifier}/nearby")
    public ResponseEntity<List<com.dulichso.bookingapi.dto.NearbyPlaceDto>> getNearbyPlaces(
            @PathVariable("identifier") String identifier,
            @RequestParam(value = "radius", defaultValue = "10.0") double radius) {
        Long id = identifier.matches("^\\d+$") ? Long.parseLong(identifier) : 1L;
        return ResponseEntity.ok(publicPlaceService.getNearbyPlaces(id, radius));
    }

    @GetMapping("/{slug}/rooms")
    public ResponseEntity<List<RoomTypeDetailDto>> getPlaceRooms(@PathVariable("slug") String slug) {
        return ResponseEntity.ok(placeDetailService.getPlaceRooms(slug));
    }

    @GetMapping("/{slug}/map-context")
    public ResponseEntity<MapContextDto> getMapContext(@PathVariable("slug") String slug) {
        return ResponseEntity.ok(placeDetailService.getMapContext(slug));
    }
}

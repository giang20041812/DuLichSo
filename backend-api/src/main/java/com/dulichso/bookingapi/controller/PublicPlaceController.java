package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.MapContextDto;
import com.dulichso.bookingapi.dto.PlaceDetailDto;
import com.dulichso.bookingapi.dto.RoomTypeDetailDto;
import com.dulichso.bookingapi.service.PlaceDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/places")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PublicPlaceController {

    private final PlaceDetailService placeDetailService;

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

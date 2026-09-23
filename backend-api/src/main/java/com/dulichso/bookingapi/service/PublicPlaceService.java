package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.PlaceDetailDto;
import com.dulichso.bookingapi.dto.PlaceSummaryDto;
import com.dulichso.bookingapi.dto.RoomTypeDto;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.repository.PlaceAmenityRepository;
import com.dulichso.bookingapi.repository.PlaceMediaRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.PlaceSpecification;
import com.dulichso.bookingapi.repository.RoomTypeMediaRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicPlaceService {

    private final PlaceRepository placeRepository;
    private final PlaceMediaRepository placeMediaRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomTypeMediaRepository roomTypeMediaRepository;
    private final PlaceAmenityRepository placeAmenityRepository;
    private final com.dulichso.bookingapi.repository.PlaceContactRepository placeContactRepository;

    @Transactional(readOnly = true)
    public Page<PlaceSummaryDto> getPlaces(CategoryKind kind, BigDecimal minPrice, BigDecimal maxPrice, BigDecimal minRating, List<String> amenities, LocalDate checkIn, LocalDate checkOut, Pageable pageable) {
        Specification<Place> spec = PlaceSpecification.filterPublicPlaces(kind, minPrice, maxPrice, minRating, amenities, checkIn, checkOut);
        
        Page<Place> placesPage = placeRepository.findAll(spec, pageable);
        
        List<Long> placeIds = placesPage.getContent().stream().map(Place::getId).collect(Collectors.toList());
        Map<Long, List<PlaceDetailDto.ContactItemDto>> contactsByPlaceId = new java.util.HashMap<>();
        if (!placeIds.isEmpty()) {
            List<com.dulichso.bookingapi.entity.PlaceContact> contacts = placeContactRepository.findByPlaceIdInAndIsPublicTrue(placeIds);
            for (com.dulichso.bookingapi.entity.PlaceContact c : contacts) {
                contactsByPlaceId.computeIfAbsent(c.getPlace().getId(), k -> new ArrayList<>())
                        .add(PlaceDetailDto.ContactItemDto.builder()
                                .id(c.getId())
                                .channel(c.getChannel())
                                .value(c.getValue())
                                .isPublic(c.getIsPublic())
                                .sortOrder(c.getSortOrder())
                                .build());
            }
        }

        return placesPage.map(p -> {
            List<String> mediaUrls = placeMediaRepository.findPublicUrlsByPlaceId(p.getId());
            String coverUrl = (mediaUrls != null && !mediaUrls.isEmpty()) ? mediaUrls.get(0) : null;
            if (coverUrl == null && p.getAttributes() != null && p.getAttributes().containsKey("coverImageUrl")) {
                coverUrl = (String) p.getAttributes().get("coverImageUrl");
            }

            PlaceSummaryDto dto = new PlaceSummaryDto(
                    p.getId(),
                    p.getSlug(),
                    p.getName(),
                    p.getRegion() != null ? p.getRegion().getName() : null,
                    coverUrl,
                    p.getDescription(),
                    p.getPriceRefMin(),
                    p.getRatingAvg(),
                    p.getRatingCount(),
                    p.getAttributes(),
                    p.getKind(),
                    p.getLatitude(),
                    p.getLongitude(),
                    p.getAddress()
            );
            dto.setContacts(contactsByPlaceId.getOrDefault(p.getId(), Collections.emptyList()));
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public PlaceDetailDto getPlaceDetail(Long id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Place not found with id: " + id));
        
        // 1. Lấy danh sách ảnh thật từ place_media JOIN media_asset (Cover đứng đầu)
        List<String> images = placeMediaRepository.findPublicUrlsByPlaceId(place.getId());
        if (images == null) {
            images = new ArrayList<>();
        }
        if (images.isEmpty() && place.getAttributes() != null && place.getAttributes().containsKey("coverImageUrl")) {
            images.add((String) place.getAttributes().get("coverImageUrl"));
        }

        // 2. Lấy tiện ích từ place_amenity JOIN amenity
        List<String> amenityNames = placeAmenityRepository.findAmenityNamesByPlaceId(place.getId());
        if (amenityNames == null || amenityNames.isEmpty()) {
            amenityNames = List.of("Wi-Fi miễn phí", "Bãi đỗ xe", "Không gian xanh", "Cảnh quan thiên nhiên");
        }

        // 3. Lấy danh sách phòng và ảnh từng phòng từ room_type JOIN room_type_media
        List<RoomType> roomTypes = roomTypeRepository.findByPlaceId(place.getId());
        List<RoomTypeDto> roomDtos = roomTypes.stream().map(rt -> {
            List<String> roomImages = roomTypeMediaRepository.findPublicUrlsByRoomTypeId(rt.getId());
            return RoomTypeDto.builder()
                    .id(rt.getId())
                    .name(rt.getName())
                    .description(rt.getDescription())
                    .maxOccupancy(rt.getMaxOccupancy())
                    .totalRoomCount(rt.getTotalRoomCount())
                    .areaSqm(rt.getAreaSqm())
                    .basePrice(rt.getBasePrice())
                    .images(roomImages != null ? roomImages : new ArrayList<>())
                    .build();
        }).collect(Collectors.toList());
        
        return PlaceDetailDto.builder()
                .id(place.getId())
                .name(place.getName())
                .description(place.getDescription())
                .kind(place.getKind())
                .address(place.getAddress())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .priceRefMin(place.getPriceRefMin())
                .priceRefMax(place.getPriceRefMax())
                .ratingAvg(place.getRatingAvg())
                .ratingCount(place.getRatingCount())
                .attributes(place.getAttributes())
                .images(images)
                .amenities(amenityNames)
                .rooms(roomDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public List<com.dulichso.bookingapi.dto.NearbyPlaceDto> getNearbyPlaces(Long id, double radiusInKm) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Place not found with id: " + id));

        if (place.getLatitude() == null || place.getLongitude() == null) {
            return new ArrayList<>();
        }

        List<com.dulichso.bookingapi.repository.NearbyPlaceProjection> projections = 
            placeRepository.findNearbyPlaces(place.getLatitude(), place.getLongitude(), radiusInKm, id, 10);

        return projections.stream().map(p -> com.dulichso.bookingapi.dto.NearbyPlaceDto.builder()
                .id(p.getId())
                .name(p.getName())
                .kind(com.dulichso.bookingapi.entity.enums.CategoryKind.valueOf(p.getKind()))
                .distance(p.getDistance())
                .build()
        ).collect(Collectors.toList());
    }
}

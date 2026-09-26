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
    private final com.dulichso.bookingapi.repository.ReviewRepository reviewRepository;
    private final com.dulichso.bookingapi.repository.RegionRepository regionRepository;

    @Transactional(readOnly = true)
    public List<com.dulichso.bookingapi.dto.PublicRegionHierarchyDto> getPublicRegions() {
        List<com.dulichso.bookingapi.entity.Region> allRegions = regionRepository.findByIsActiveTrue();
        if (allRegions == null || allRegions.isEmpty()) {
            allRegions = regionRepository.findAll();
        }

        // Nhóm theo parentId để dễ duyệt cây 3 level: 1 (Tỉnh) -> 2 (Huyện) -> 3 (Xã)
        Map<Long, List<com.dulichso.bookingapi.entity.Region>> childrenByParentId = new java.util.HashMap<>();
        for (com.dulichso.bookingapi.entity.Region r : allRegions) {
            Long pId = r.getParent() != null ? r.getParent().getId() : null;
            childrenByParentId.computeIfAbsent(pId, k -> new ArrayList<>()).add(r);
        }

        // Tìm các Province (level 1 hoặc parent_id == null)
        List<com.dulichso.bookingapi.entity.Region> provinces = allRegions.stream()
                .filter(r -> (r.getLevel() != null && r.getLevel() == 1) || r.getParent() == null)
                .collect(Collectors.toList());

        List<com.dulichso.bookingapi.dto.PublicRegionHierarchyDto> result = new ArrayList<>();

        if (!provinces.isEmpty()) {
            for (com.dulichso.bookingapi.entity.Region prov : provinces) {
                List<com.dulichso.bookingapi.entity.Region> districts = childrenByParentId.getOrDefault(prov.getId(), Collections.emptyList());
                List<com.dulichso.bookingapi.dto.PublicRegionHierarchyDto.DistrictItem> districtItems = new ArrayList<>();

                for (com.dulichso.bookingapi.entity.Region dist : districts) {
                    List<com.dulichso.bookingapi.entity.Region> wards = childrenByParentId.getOrDefault(dist.getId(), Collections.emptyList());
                    List<com.dulichso.bookingapi.dto.PublicRegionHierarchyDto.WardItem> wardItems = wards.stream()
                            .map(w -> new com.dulichso.bookingapi.dto.PublicRegionHierarchyDto.WardItem(w.getId(), w.getName()))
                            .collect(Collectors.toList());

                    districtItems.add(new com.dulichso.bookingapi.dto.PublicRegionHierarchyDto.DistrictItem(
                            dist.getId(),
                            dist.getName(),
                            wardItems
                    ));
                }

                result.add(new com.dulichso.bookingapi.dto.PublicRegionHierarchyDto(
                        prov.getId(),
                        prov.getName(),
                        districtItems
                ));
            }
        } else {
            // Fallback nếu không có phân cấp
            result.add(new com.dulichso.bookingapi.dto.PublicRegionHierarchyDto(
                    1L,
                    "Yên Bái",
                    Collections.emptyList()
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Page<PlaceSummaryDto> getPlaces(CategoryKind kind, BigDecimal minPrice, BigDecimal maxPrice, BigDecimal minRating, List<String> amenities, LocalDate checkIn, LocalDate checkOut, Pageable pageable) {
        return getPlaces(kind, minPrice, maxPrice, minRating, amenities, checkIn, checkOut, null, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<PlaceSummaryDto> getPlaces(CategoryKind kind, BigDecimal minPrice, BigDecimal maxPrice, BigDecimal minRating, List<String> amenities, LocalDate checkIn, LocalDate checkOut, String province, String ward, List<Long> attractionIds, Pageable pageable) {
        return getPlaces(kind, minPrice, maxPrice, minRating, amenities, checkIn, checkOut, province, null, ward, attractionIds, pageable);
    }

    @Transactional(readOnly = true)
    public Page<PlaceSummaryDto> getPlaces(CategoryKind kind, BigDecimal minPrice, BigDecimal maxPrice, BigDecimal minRating, List<String> amenities, LocalDate checkIn, LocalDate checkOut, String province, String district, String ward, List<Long> attractionIds, Pageable pageable) {
        Specification<Place> spec = PlaceSpecification.filterPublicPlaces(kind, minPrice, maxPrice, minRating, amenities, checkIn, checkOut, province, district, ward, attractionIds);
        
        Page<Place> placesPage = placeRepository.findAll(spec, pageable);
        
        List<Long> placeIds = placesPage.getContent().stream().map(Place::getId).collect(Collectors.toList());
        Map<Long, List<PlaceDetailDto.ContactItemDto>> contactsByPlaceId = new java.util.HashMap<>();
        Map<Long, List<String>> amenitiesByPlaceId = new java.util.HashMap<>();
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

            List<com.dulichso.bookingapi.entity.PlaceAmenity> placeAmenities = placeAmenityRepository.findByPlaceIdInWithAmenity(placeIds);
            for (com.dulichso.bookingapi.entity.PlaceAmenity pa : placeAmenities) {
                if (pa.getAmenity() != null && pa.getAmenity().getName() != null) {
                    amenitiesByPlaceId.computeIfAbsent(pa.getPlace().getId(), k -> new ArrayList<>())
                            .add(pa.getAmenity().getName());
                }
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
            dto.setIsSuitableByTime(p.getIsSuitableByTime());
            dto.setSuitableDateStart(p.getSuitableDateStart());
            dto.setSuitableDateEnd(p.getSuitableDateEnd());
            dto.setContacts(contactsByPlaceId.getOrDefault(p.getId(), Collections.emptyList()));
            dto.setAmenities(amenitiesByPlaceId.getOrDefault(p.getId(), Collections.emptyList()));
            if (p.getAttributes() != null && p.getAttributes().containsKey("tagBadge")) {
                dto.setTagBadge((String) p.getAttributes().get("tagBadge"));
            }
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
        if (amenityNames == null) {
            amenityNames = Collections.emptyList();
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
                    .weekendPrice(rt.getWeekendPrice())
                    .images(roomImages != null ? roomImages : new ArrayList<>())
                    .build();
        }).collect(Collectors.toList());
        
        // 4. Lấy danh sách contacts liên hệ (SĐT, Zalo, TikTok, Facebook,...)
        List<com.dulichso.bookingapi.entity.PlaceContact> contactEntities = placeContactRepository.findByPlaceIdAndIsPublicTrue(place.getId());
        List<PlaceDetailDto.ContactItemDto> contactDtos = contactEntities.stream().map(c -> PlaceDetailDto.ContactItemDto.builder()
                .id(c.getId())
                .channel(c.getChannel())
                .value(c.getValue())
                .isPublic(c.getIsPublic())
                .sortOrder(c.getSortOrder())
                .build()
        ).collect(Collectors.toList());

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
                .isSuitableByTime(place.getIsSuitableByTime())
                .suitableDateStart(place.getSuitableDateStart())
                .suitableDateEnd(place.getSuitableDateEnd())
                .images(images)
                .amenities(amenityNames)
                .rooms(roomDtos)
                .contacts(contactDtos)
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

        List<Long> placeIds = projections.stream().map(com.dulichso.bookingapi.repository.NearbyPlaceProjection::getId).collect(Collectors.toList());
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

        return projections.stream().map(p -> com.dulichso.bookingapi.dto.NearbyPlaceDto.builder()
                .id(p.getId())
                .name(p.getName())
                .kind(com.dulichso.bookingapi.entity.enums.CategoryKind.valueOf(p.getKind()))
                .distance(p.getDistance())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .address(p.getAddress())
                .contacts(contactsByPlaceId.getOrDefault(p.getId(), Collections.emptyList()))
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlaceSummaryDto> getRegionalDestinations(Long placeId, int limit) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new RuntimeException("Place not found with id: " + placeId));

        Long regionId = place.getRegion() != null ? place.getRegion().getId() : null;
        List<Place> destinations = placeRepository.findRegionalDestinations(placeId, regionId, limit > 0 ? limit : 4);
        
        // Nếu cùng region ít hơn 4 điểm, tìm mở rộng không giới hạn region
        if (destinations.size() < 4) {
            destinations = placeRepository.findRegionalDestinations(placeId, null, 4);
        }

        return destinations.stream().map(p -> {
            List<String> images = placeMediaRepository.findPublicUrlsByPlaceId(p.getId());
            String coverImage = (images != null && !images.isEmpty()) ? images.get(0) : 
                (p.getAttributes() != null && p.getAttributes().containsKey("coverImageUrl") ? (String) p.getAttributes().get("coverImageUrl") : null);

            return PlaceSummaryDto.builder()
                    .id(p.getId())
                    .slug(p.getSlug())
                    .name(p.getName())
                    .kind(p.getKind())
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                    .regionName(p.getRegion() != null ? p.getRegion().getName() : null)
                    .address(p.getAddress())
                    .latitude(p.getLatitude())
                    .longitude(p.getLongitude())
                    .coverImageUrl(coverImage)
                    .ratingAvg(p.getRatingAvg())
                    .ratingCount(p.getRatingCount())
                    .priceRefMin(p.getPriceRefMin())
                    .priceRefMax(p.getPriceRefMax())
                    .priceUnitNote(p.getPriceUnitNote())
                    .isSuitableByTime(p.getIsSuitableByTime())
                    .suitableDateStart(p.getSuitableDateStart())
                    .suitableDateEnd(p.getSuitableDateEnd())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.dulichso.bookingapi.dto.ReviewDto> getPlaceReviews(Long placeId) {
        List<com.dulichso.bookingapi.entity.Review> reviews = 
            reviewRepository.findByPlaceIdAndStatusWithBooking(placeId, com.dulichso.bookingapi.entity.enums.ReviewStatus.VISIBLE);

        return reviews.stream().map(r -> com.dulichso.bookingapi.dto.ReviewDto.builder()
                .id(r.getId())
                .placeId(r.getPlace().getId())
                .rating(r.getRating())
                .content(r.getContent())
                .guestName(r.getBooking() != null ? r.getBooking().getGuestName() : "Khách du lịch")
                .createdAt(r.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }
}

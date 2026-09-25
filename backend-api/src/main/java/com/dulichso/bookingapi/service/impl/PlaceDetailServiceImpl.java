package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.MapContextDto;
import com.dulichso.bookingapi.dto.PlaceDetailDto;
import com.dulichso.bookingapi.dto.RoomTypeDetailDto;
import com.dulichso.bookingapi.dto.RoomTypeDto;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.PlaceAmenity;
import com.dulichso.bookingapi.entity.PlaceContact;
import com.dulichso.bookingapi.entity.PlaceHighlight;
import com.dulichso.bookingapi.entity.PlaceMedia;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceOperationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.repository.NearbyPlaceProjection;
import com.dulichso.bookingapi.repository.PlaceAmenityRepository;
import com.dulichso.bookingapi.repository.PlaceContactRepository;
import com.dulichso.bookingapi.repository.PlaceHighlightRepository;
import com.dulichso.bookingapi.repository.PlaceMediaRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.RoomTypeMediaRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import com.dulichso.bookingapi.service.PlaceDetailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceDetailServiceImpl implements PlaceDetailService {

    private final PlaceRepository placeRepository;
    private final PlaceMediaRepository placeMediaRepository;
    private final PlaceAmenityRepository placeAmenityRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomTypeMediaRepository roomTypeMediaRepository;
    private final PlaceContactRepository placeContactRepository;
    private final PlaceHighlightRepository placeHighlightRepository;
    private final com.dulichso.bookingapi.repository.HomestayProfileRepository homestayProfileRepository;
    private final com.dulichso.bookingapi.service.HomestayOfferService offers;

    @Override
    @Transactional(readOnly = true)
    public PlaceDetailDto getPlaceDetail(String slug) {
        Place place = placeRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm với slug: " + slug));

        return buildPlaceDetailDto(place);
    }

    @Override
    @Transactional(readOnly = true)
    public PlaceDetailDto getPlaceDetailById(Long id) {
        Place place = placeRepository.findById(id)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm với ID: " + id));

        return buildPlaceDetailDto(place);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomTypeDetailDto> getPlaceRooms(String slug) {
        Place place = placeRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm với slug: " + slug));

        List<RoomType> activeRooms = roomTypeRepository.findByPlaceIdAndStatus(place.getId(), "ACTIVE");
        if (activeRooms.isEmpty()) {
            // Fallback sang tất cả phòng nếu chưa có active hoặc status khác
            activeRooms = roomTypeRepository.findByPlaceId(place.getId());
        }

        List<RoomTypeDetailDto> roomDtos = new ArrayList<>();
        for (RoomType rt : activeRooms) {
            List<String> roomImages = roomTypeMediaRepository.findPublicUrlsByRoomTypeId(rt.getId());
            if (roomImages == null) {
                roomImages = Collections.emptyList();
            }
            String coverImage = roomImages.isEmpty() ? null : roomImages.get(0);

            int totalRooms = rt.getTotalRoomCount() != null ? rt.getTotalRoomCount() : 1;
            int availableRooms = totalRooms; // Default available = total room count khi không có filter ngày

            String badgeText = availableRooms > 0 
                    ? "Còn " + availableRooms + " phòng trống"
                    : "Hết phòng";

            List<String> features = new ArrayList<>();
            if (rt.getMaxOccupancy() != null && rt.getMaxOccupancy() > 0) {
                features.add("Tối đa " + rt.getMaxOccupancy() + " người");
            }
            if (rt.getAreaSqm() != null) {
                features.add(rt.getAreaSqm() + " m²");
            }
            if (rt.getPrivateBathroom() == AmenityValue.YES) {
                features.add("Vệ sinh khép kín");
            } else if (rt.getPrivateBathroom() == AmenityValue.NO) {
                features.add("Vệ sinh chung");
            }

            roomDtos.add(RoomTypeDetailDto.builder()
                    .id(rt.getId())
                    .placeId(place.getId())
                    .name(rt.getName())
                    .description(rt.getDescription())
                    .maxOccupancy(rt.getMaxOccupancy())
                    .totalRoomCount(rt.getTotalRoomCount())
                    .privateBathroom(rt.getPrivateBathroom() != null ? rt.getPrivateBathroom() : AmenityValue.UNVERIFIED)
                    .areaSqm(rt.getAreaSqm())
                    .basePrice(rt.getBasePrice())
                    .status(rt.getStatus() != null ? rt.getStatus() : "ACTIVE")
                    .availableRooms(availableRooms)
                    .badgeText(badgeText)
                    .coverImage(coverImage)
                    .images(roomImages)
                    .bedDescription(rt.getDescription())
                    .features(features)
                    .unitNote("/ đêm")
                    .build());
        }

        return roomDtos;
    }

    @Override
    @Transactional(readOnly = true)
    public MapContextDto getMapContext(String slug) {
        Place place = placeRepository.findBySlugAndIsDeletedFalse(slug)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm với slug: " + slug));

        BigDecimal lat = place.getLatitude();
        BigDecimal lng = place.getLongitude();

        List<MapContextDto.PoiDto> pois = new ArrayList<>();
        if (lat != null && lng != null) {
            List<NearbyPlaceProjection> nearbyPlaces = placeRepository.findNearbyPlaces(
                    lat, lng, 15.0, place.getId(), 10
            );

            for (NearbyPlaceProjection np : nearbyPlaces) {
                pois.add(MapContextDto.PoiDto.builder()
                        .id(np.getId())
                        .name(np.getName())
                        .category(np.getKind())
                        .latitude(np.getLatitude())
                        .longitude(np.getLongitude())
                        .distanceKm(np.getDistance() != null 
                                ? BigDecimal.valueOf(np.getDistance()).setScale(1, RoundingMode.HALF_UP) 
                                : null)
                        .address(np.getAddress())
                        .note(np.getAddress() != null ? np.getAddress() : np.getName())
                        .build());
            }
        }

        String regionName = place.getRegion() != null ? place.getRegion().getName() : null;
        Integer altitudeMeters = resolveAltitudeMeters(place);

        String verificationBadge = place.getVerification() == PlaceVerificationStatus.VERIFIED 
                ? "GPS Verified" 
                : "Community Listed";

        List<MapContextDto.ScenarioDto> scenarios = new ArrayList<>();
        scenarios.add(MapContextDto.ScenarioDto.builder()
                .id("SCENARIO_1")
                .code("MAP-" + place.getId())
                .label("1. Chuẩn: " + place.getName())
                .targetName(place.getName())
                .latitude(lat)
                .longitude(lng)
                .zoomLevel(15)
                .altitudeMeters(altitudeMeters)
                .accessNote(place.getAccessNote() != null ? place.getAccessNote() : "Đường liên thôn vào tận nơi.")
                .isPrimary(true)
                .build());

        // Bổ sung các điểm POI lân cận vào scenarios tương tác
        int scenarioIndex = 2;
        for (MapContextDto.PoiDto poi : pois) {
            if (scenarioIndex > 4) break; // Giữ tối đa 4 scenarios
            scenarios.add(MapContextDto.ScenarioDto.builder()
                    .id("SCENARIO_" + scenarioIndex)
                    .code("POI-" + poi.getId())
                    .label(scenarioIndex + ". " + resolveCategoryLabel(poi.getCategory()) + ": " + poi.getName())
                    .targetName(poi.getName())
                    .latitude(poi.getLatitude())
                    .longitude(poi.getLongitude())
                    .zoomLevel(15)
                    .altitudeMeters(altitudeMeters)
                    .accessNote(poi.getAddress() != null ? poi.getAddress() : "Khu vực lân cận")
                    .isPrimary(false)
                    .build());
            scenarioIndex++;
        }

        return MapContextDto.builder()
                .placeId(place.getId())
                .placeSlug(place.getSlug())
                .placeName(place.getName())
                .regionName(regionName)
                .address(place.getAddress())
                .latitude(lat)
                .longitude(lng)
                .altitudeMeters(altitudeMeters)
                .accessNote(place.getAccessNote())
                .verificationBadge(verificationBadge)
                .pois(pois)
                .scenarios(scenarios)
                .build();
    }

    private PlaceDetailDto buildPlaceDetailDto(Place place) {
        // 1. Media
        List<PlaceMedia> placeMediaList = placeMediaRepository.findByPlaceIdWithMedia(place.getId());
        List<PlaceDetailDto.MediaItemDto> mediaDtoList = new ArrayList<>();
        List<String> images = new ArrayList<>();

        for (PlaceMedia pm : placeMediaList) {
            if (pm.getMedia() != null && pm.getMedia().getPublicUrl() != null) {
                String url = pm.getMedia().getPublicUrl();
                images.add(url);
                mediaDtoList.add(PlaceDetailDto.MediaItemDto.builder()
                        .id(pm.getMedia().getId())
                        .publicUrl(url)
                        .role(pm.getRole() != null ? pm.getRole().name() : "GALLERY")
                        .caption(pm.getCaption())
                        .sortOrder(pm.getSortOrder())
                        .build());
            }
        }

        // Fallback coverImageUrl từ attributes nếu chưa có media
        if (images.isEmpty() && place.getAttributes() != null && place.getAttributes().containsKey("coverImageUrl")) {
            String coverUrl = String.valueOf(place.getAttributes().get("coverImageUrl"));
            images.add(coverUrl);
            mediaDtoList.add(PlaceDetailDto.MediaItemDto.builder()
                    .id(1L)
                    .publicUrl(coverUrl)
                    .role("COVER")
                    .caption(place.getName())
                    .sortOrder(0)
                    .build());
        }

        // 2. Amenities
        List<PlaceAmenity> placeAmenities = placeAmenityRepository.findByPlaceIdWithAmenity(place.getId());
        List<String> amenityNames = new ArrayList<>();
        List<PlaceDetailDto.AmenityItemDto> amenityItems = new ArrayList<>();

        for (PlaceAmenity pa : placeAmenities) {
            if (pa.getAmenity() != null) {
                String name = pa.getAmenity().getName();
                amenityNames.add(name);
                amenityItems.add(PlaceDetailDto.AmenityItemDto.builder()
                        .id(pa.getAmenity().getId())
                        .code(pa.getAmenity().getCode())
                        .name(name)
                        .icon(resolveAmenityIcon(pa.getAmenity().getCode()))
                        .value(pa.getValue() != null ? pa.getValue().name() : "YES")
                        .note(pa.getNote())
                        .build());
            }
        }

        // 3. Rooms
        List<RoomType> roomTypes = roomTypeRepository.findByPlaceId(place.getId());
        List<RoomTypeDto> roomDtos = new ArrayList<>();
        for (RoomType rt : roomTypes) {
            List<String> roomImages = roomTypeMediaRepository.findPublicUrlsByRoomTypeId(rt.getId());
            roomDtos.add(RoomTypeDto.builder()
                    .id(rt.getId())
                    .name(rt.getName())
                    .description(rt.getDescription())
                    .maxOccupancy(rt.getMaxOccupancy())
                    .totalRoomCount(rt.getTotalRoomCount())
                    .areaSqm(rt.getAreaSqm())
                    .basePrice(rt.getBasePrice())
                    .images(roomImages != null ? roomImages : Collections.emptyList())
                    .build());
        }

        // 4. Region & Category
        String regionName = place.getRegion() != null ? place.getRegion().getName() : null;
        String categoryName = place.getCategory() != null ? place.getCategory().getName() : null;
        String categoryKindStr = place.getKind() != null ? place.getKind().name() : (place.getCategory() != null ? place.getCategory().getKind().name() : "HOMESTAY");

        // 5. Contacts (SĐT, FB, TikTok, Zalo, Google Maps...)
        List<PlaceContact> placeContacts = placeContactRepository.findByPlaceIdAndIsPublicTrue(place.getId());
        List<PlaceDetailDto.ContactItemDto> contactDtos = new ArrayList<>();
        for (PlaceContact pc : placeContacts) {
            contactDtos.add(PlaceDetailDto.ContactItemDto.builder()
                    .id(pc.getId())
                    .channel(pc.getChannel())
                    .value(pc.getValue())
                    .isPublic(pc.getIsPublic())
                    .sortOrder(pc.getSortOrder())
                    .build());
        }

        // 6. Highlights (Ưu nhược điểm từ bảng place_highlight: PRO, CON, TIP)
        List<PlaceHighlight> placeHighlights = placeHighlightRepository.findByPlaceIdAndIsPublicTrue(place.getId());
        List<PlaceDetailDto.HighlightItemDto> highlightDtos = new ArrayList<>();
        for (PlaceHighlight ph : placeHighlights) {
            highlightDtos.add(PlaceDetailDto.HighlightItemDto.builder()
                    .id(ph.getId())
                    .type(ph.getType())
                    .content(ph.getContent())
                    .build());
        }

        // 7. GPS & Altitude
        Integer altitudeMeters = resolveAltitudeMeters(place);
        String verifiedGpsText = (place.getLatitude() != null && place.getLongitude() != null)
                ? place.getLatitude() + " - " + place.getLongitude()
                : null;

        // Read the provider's saved profile rather than displaying an invented policy.
        PlaceDetailDto.HomestayProfileDto homestayProfile = homestayProfileRepository.findById(place.getId()).map(profile -> {
            var policy = profile.getCurrentPolicy();
            return PlaceDetailDto.HomestayProfileDto.builder().placeId(place.getId())
                    .checkInFrom(profile.getCheckInFrom() == null ? null : profile.getCheckInFrom().toString())
                    .checkOutUntil(profile.getCheckOutUntil() == null ? null : profile.getCheckOutUntil().toString())
                    .houseRules(profile.getHouseRules()).surchargeNote(profile.getSurchargeNote())
                    .childrenPolicy(profile.getChildrenPolicy()).petsPolicy(profile.getPetsPolicy()).guestPolicy(profile.getGuestPolicy())
                    .currentPolicy(policy == null ? null : PlaceDetailDto.PolicyDto.builder().id(policy.getId())
                            .name(policy.getName()).description(policy.getContentText()).build()).build();
        }).orElse(null);

        return PlaceDetailDto.builder()
                .id(place.getId())
                .slug(place.getSlug())
                .name(place.getName())
                .kind(place.getKind())
                .categoryKind(categoryKindStr)
                .categoryName(categoryName)
                .regionName(regionName)
                .address(place.getAddress())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .accessNote(place.getAccessNote())
                .priceRefMin(place.getPriceRefMin())
                .priceRefMax(place.getPriceRefMax())
                .priceUnitNote(place.getPriceUnitNote() != null ? place.getPriceUnitNote() : "đêm")
                .operationStatus(place.getOperationStatus() != null ? place.getOperationStatus() : PlaceOperationStatus.OPERATING)
                .verification(place.getVerification() != null ? place.getVerification() : PlaceVerificationStatus.UNVERIFIED)
                .ratingAvg(place.getRatingAvg())
                .ratingCount(place.getRatingCount() != null ? place.getRatingCount() : 0)
                .description(place.getDescription())
                .altitudeMeters(altitudeMeters)
                .verifiedGpsText(verifiedGpsText)
                .isSuitableByTime(place.getIsSuitableByTime())
                .suitableDateStart(place.getSuitableDateStart())
                .suitableDateEnd(place.getSuitableDateEnd())
                .attributes(place.getAttributes())
                .images(images)
                .amenities(amenityNames)
                .rooms(roomDtos)
                .media(mediaDtoList)
                .amenityItems(amenityItems)
                .contacts(contactDtos)
                .highlights(highlightDtos)
                .homestayProfile(homestayProfile)
                .services(offers.publicList(place.getId()))
                .build();
    }

    private Integer resolveAltitudeMeters(Place place) {
        if (place.getAttributes() != null && place.getAttributes().containsKey("altitudeMeters")) {
            Object altObj = place.getAttributes().get("altitudeMeters");
            if (altObj instanceof Number) {
                return ((Number) altObj).intValue();
            } else if (altObj instanceof String) {
                try {
                    return Integer.parseInt((String) altObj);
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    private String resolveAmenityIcon(String code) {
        if (code == null) return "CheckCircle";
        return switch (code.toUpperCase()) {
            case "WIFI", "FREE_WIFI" -> "Wifi";
            case "PARKING", "FREE_PARKING" -> "Car";
            case "KITCHEN", "FREE_KITCHEN" -> "ChefHat";
            case "MEAL", "MEAL_ON_DEMAND", "RESTAURANT" -> "Utensils";
            case "HOT_WATER" -> "ShowerHead";
            case "MOSQUITO_NET" -> "Shield";
            case "BUS_PICKUP", "TRANSPORT" -> "Bus";
            case "AIR_CONDITIONING" -> "Wind";
            case "BALCONY" -> "Maximize2";
            case "BATHTUB" -> "Bath";
            case "BBQ_AREA" -> "Flame";
            case "MOTORBIKE_RENTAL" -> "Bike";
            case "FIREPLACE" -> "Flame";
            default -> "CheckCircle";
        };
    }

    private String resolveCategoryLabel(String categoryKind) {
        if (categoryKind == null) return "Điểm đến";
        return switch (categoryKind.toUpperCase()) {
            case "ATTRACTION" -> "Danh lam thắng cảnh";
            case "RESTAURANT" -> "Nhà hàng & Quán ăn";
            case "CUISINE", "FOOD" -> "Ẩm thực & Món ngon";
            case "PHOTO" -> "Điểm & Dịch vụ Chụp ảnh";
            case "RENTAL" -> "Cho thuê trang phục & Phương tiện";
            case "TRANSPORT" -> "Di chuyển & Nhà xe";
            case "CULTURE" -> "Văn hóa & Lễ hội";
            case "MARKET" -> "Chợ & Điểm mua sắm";
            case "SERVICE" -> "Dịch vụ & Tiện ích";
            default -> "Điểm lân cận";
        };
    }
}

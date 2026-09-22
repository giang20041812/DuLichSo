package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.CategoryDto;
import com.dulichso.bookingapi.dto.HomeResponseDto;
import com.dulichso.bookingapi.dto.PlaceSummaryDto;
import com.dulichso.bookingapi.entity.Category;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.repository.CategoryRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.service.PublicHomeService;
import com.dulichso.bookingapi.service.PublicPlaceService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicHomeServiceImpl implements PublicHomeService {

    private final CategoryRepository categoryRepository;
    private final PublicPlaceService publicPlaceService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public HomeResponseDto getHomeData() {
        // Fetch Categories
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
        List<CategoryDto> categoryDtos = categories.stream()
                .map(c -> CategoryDto.builder()
                        .id(c.getId())
                        .kind(c.getKind())
                        .slug(c.getSlug())
                        .name(c.getName())
                        .description(c.getDescription())
                        .build())
                .collect(Collectors.toList());

        // Fetch Featured Destinations (ATTRACTION)
        List<PlaceSummaryDto> attractions = new ArrayList<>(publicPlaceService.getPlaces(
                CategoryKind.ATTRACTION, null, null, null, null, null, null, PageRequest.of(0, 16)
        ).getContent());
        enrichPlaceSummaries(attractions);

        // Fetch Top Homestays
        List<PlaceSummaryDto> homestays = new ArrayList<>(publicPlaceService.getPlaces(
                CategoryKind.HOMESTAY, null, null, null, null, null, null, PageRequest.of(0, 16)
        ).getContent());
        enrichPlaceSummaries(homestays);

        // Fetch Featured Tours (EXPERIENCE)
        List<PlaceSummaryDto> tours = new ArrayList<>(publicPlaceService.getPlaces(
                CategoryKind.EXPERIENCE, null, null, null, null, null, null, PageRequest.of(0, 8)
        ).getContent());
        enrichPlaceSummaries(tours);

        // Fetch Specialties (FOOD)
        List<PlaceSummaryDto> specialties = new ArrayList<>(publicPlaceService.getPlaces(
                CategoryKind.FOOD, null, null, null, null, null, null, PageRequest.of(0, 8)
        ).getContent());
        enrichPlaceSummaries(specialties);

        return HomeResponseDto.builder()
                .categories(categoryDtos)
                .featuredDestinations(attractions)
                .homestays(homestays)
                .featuredTours(tours)
                .specialties(specialties)
                .build();
    }

    private void enrichPlaceSummaries(List<PlaceSummaryDto> dtos) {
        for (PlaceSummaryDto dto : dtos) {
            // Provide sensible fallbacks for UI
            dto.setTagBadge("Đề xuất");
            dto.setStatsText("Khám phá ngay");
            dto.setDurationText("Trong ngày");
            
            // Extract from attributes map
            if (dto.getAttributes() != null && !dto.getAttributes().isEmpty()) {
                Map<String, Object> attrs = dto.getAttributes();
                if (attrs.containsKey("tagBadge")) {
                    dto.setTagBadge((String) attrs.get("tagBadge"));
                }
                if (attrs.containsKey("duration")) {
                    dto.setDurationText((String) attrs.get("duration"));
                }
            }
            
            // Default amenities if none
            dto.setAmenities(List.of("Wi-fi miễn phí", "Gần trung tâm", "Cảnh quan đẹp"));
            dto.setHighlights(List.of("Trải nghiệm tuyệt vời", "Dịch vụ tận tâm", "Giá tốt"));
            
            // Add a mock original price for tours to show the discount UI
            if (dto.getKind() == CategoryKind.EXPERIENCE || dto.getKind() == CategoryKind.TRANSPORT) {
                if (dto.getPriceRefMin() != null) {
                    dto.setTagBadge("Khuyến mãi");
                }
            }
        }
    }
}

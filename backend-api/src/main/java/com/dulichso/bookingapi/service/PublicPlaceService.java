package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.PlaceSummaryDto;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.PlaceMedia;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.PlaceSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicPlaceService {

    private final PlaceRepository placeRepository;

    @Transactional(readOnly = true)
    public Page<PlaceSummaryDto> getPlaces(CategoryKind kind, BigDecimal minPrice, BigDecimal maxPrice, BigDecimal minRating, List<String> amenities, Pageable pageable) {
        Specification<Place> spec = PlaceSpecification.filterPublicPlaces(kind, minPrice, maxPrice, minRating);
        
        Page<Place> placesPage = placeRepository.findAll(spec, pageable);
        
        return placesPage.map(p -> {
            String coverUrl = null;
            // Note: This is an N+1 query if not eager loaded, but fine for prototype
            // Alternatively, write a custom @Query returning Page<PlaceSummaryDto>
            return new PlaceSummaryDto(
                    p.getId(),
                    p.getSlug(),
                    p.getName(),
                    p.getRegion() != null ? p.getRegion().getName() : null,
                    coverUrl, // We will just map it null or dummy for now, since it requires joins
                    p.getDescription(),
                    p.getPriceRefMin(),
                    p.getRatingAvg(),
                    p.getRatingCount(),
                    p.getAttributes(),
                    p.getKind()
            );
        });
    }
}

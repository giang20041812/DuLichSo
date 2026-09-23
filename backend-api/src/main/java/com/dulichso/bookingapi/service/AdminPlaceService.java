package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminPlaceDtos.*;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.PlaceSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Service
public class AdminPlaceService {

    private final PlaceRepository placeRepository;
    private final AuditLogService auditLogService;

    public AdminPlaceService(PlaceRepository placeRepository, AuditLogService auditLogService) {
        this.placeRepository = placeRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public Page<AdminPlaceSummaryDto> getPlaces(
            String keyword,
            PlaceVisibility visibility,
            PlaceVerificationStatus verification,
            CategoryKind kind,
            Pageable pageable) {

        Specification<Place> spec = PlaceSpecification.filterAdminPlaces(keyword, visibility, verification, kind);
        return placeRepository.findAll(spec, pageable).map(this::mapToSummaryDto);
    }

    @Transactional(readOnly = true)
    public AdminPlaceDetailDto getPlaceById(Long id) {
        Place place = placeRepository.findById(id)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy địa điểm với ID: " + id));
        return mapToDetailDto(place);
    }

    @Transactional
    public AdminPlaceSummaryDto updateVerification(Long id, UpdatePlaceVerificationRequest request, Long callerAccountId) {
        Place place = placeRepository.findById(id)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy địa điểm với ID: " + id));

        PlaceVerificationStatus oldStatus = place.getVerification();
        place.setVerification(request.getVerification());
        if (request.getVerification() == PlaceVerificationStatus.VERIFIED) {
            place.setLastVerifiedAt(LocalDate.now());
        }

        Place saved = placeRepository.save(place);

        auditLogService.record(
                callerAccountId,
                "UPDATE_PLACE_VERIFICATION",
                "Place",
                saved.getId(),
                request.getReason() != null ? request.getReason() : "Kiểm duyệt trạng thái xác thực nội dung điểm đến",
                Map.of("verification", oldStatus.name()),
                Map.of("verification", saved.getVerification().name())
        );

        return mapToSummaryDto(saved);
    }

    @Transactional
    public AdminPlaceSummaryDto updateVisibility(Long id, UpdatePlaceVisibilityRequest request, Long callerAccountId) {
        Place place = placeRepository.findById(id)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy địa điểm với ID: " + id));

        PlaceVisibility oldVis = place.getVisibility();
        place.setVisibility(request.getVisibility());
        Place saved = placeRepository.save(place);

        auditLogService.record(
                callerAccountId,
                "UPDATE_PLACE_VISIBILITY",
                "Place",
                saved.getId(),
                request.getReason() != null ? request.getReason() : "Admin thay đổi hiển thị khẩn cấp",
                Map.of("visibility", oldVis.name()),
                Map.of("visibility", saved.getVisibility().name())
        );

        return mapToSummaryDto(saved);
    }

    private AdminPlaceSummaryDto mapToSummaryDto(Place p) {
        return AdminPlaceSummaryDto.builder()
                .id(p.getId())
                .slug(p.getSlug())
                .name(p.getName())
                .kind(p.getKind())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .providerId(p.getProvider() != null ? p.getProvider().getId() : null)
                .providerName(p.getProvider() != null ? p.getProvider().getName() : null)
                .regionId(p.getRegion() != null ? p.getRegion().getId() : null)
                .regionName(p.getRegion() != null ? p.getRegion().getName() : null)
                .address(p.getAddress())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .priceRefMin(p.getPriceRefMin())
                .priceRefMax(p.getPriceRefMax())
                .visibility(p.getVisibility())
                .operationStatus(p.getOperationStatus())
                .verification(p.getVerification())
                .lastVerifiedAt(p.getLastVerifiedAt())
                .ratingAvg(p.getRatingAvg())
                .ratingCount(p.getRatingCount())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private AdminPlaceDetailDto mapToDetailDto(Place p) {
        return AdminPlaceDetailDto.builder()
                .id(p.getId())
                .slug(p.getSlug())
                .name(p.getName())
                .kind(p.getKind())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .providerId(p.getProvider() != null ? p.getProvider().getId() : null)
                .providerName(p.getProvider() != null ? p.getProvider().getName() : null)
                .regionId(p.getRegion() != null ? p.getRegion().getId() : null)
                .regionName(p.getRegion() != null ? p.getRegion().getName() : null)
                .address(p.getAddress())
                .description(p.getDescription())
                .accessNote(p.getAccessNote())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .priceRefMin(p.getPriceRefMin())
                .priceRefMax(p.getPriceRefMax())
                .priceUnitNote(p.getPriceUnitNote())
                .visibility(p.getVisibility())
                .operationStatus(p.getOperationStatus())
                .verification(p.getVerification())
                .lastVerifiedAt(p.getLastVerifiedAt())
                .ratingAvg(p.getRatingAvg())
                .ratingCount(p.getRatingCount())
                .attributes(p.getAttributes())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

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

    private static final java.util.Set<String> PLACE_SORT_FIELDS = java.util.Set.of("createdAt", "updatedAt", "name", "ratingAvg");

    @Transactional(readOnly = true)
    public Page<AdminPlaceSummaryDto> getPlaces(
            String keyword,
            PlaceVisibility visibility,
            PlaceVerificationStatus verification,
            CategoryKind kind,
            Long providerId,
            Long regionId,
            LocalDate createdFrom,
            LocalDate createdTo,
            String sortBy,
            String sortDir,
            int page,
            int size) {

        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                "asc".equalsIgnoreCase(sortDir)
                        ? org.springframework.data.domain.Sort.Direction.ASC
                        : org.springframework.data.domain.Sort.Direction.DESC,
                PLACE_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt");
        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort);

        Specification<Place> spec = PlaceSpecification.filterAdminPlaces(
                keyword, visibility, verification, kind, providerId, regionId, createdFrom, createdTo);
        return placeRepository.findAll(spec, pageable).map(this::mapToSummaryDto);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByVerification() {
        Map<String, Long> counts = new java.util.LinkedHashMap<>();
        for (PlaceVerificationStatus v : PlaceVerificationStatus.values()) {
            counts.put(v.name(), placeRepository.count(
                    PlaceSpecification.filterAdminPlaces(null, null, v, null, null, null, null, null)));
        }
        return counts;
    }

    @Transactional
    public int bulkUpdateVerification(java.util.List<Long> ids, PlaceVerificationStatus verification, String reason, Long callerAccountId) {
        if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("Chưa chọn điểm đến nào.");
        if (ids.size() > 100) throw new IllegalArgumentException("Tối đa 100 điểm đến mỗi lần.");
        if (verification == null) throw new IllegalArgumentException("Thiếu trạng thái kiểm duyệt.");
        UpdatePlaceVerificationRequest req = new UpdatePlaceVerificationRequest();
        req.setVerification(verification);
        req.setReason(reason);
        for (Long id : ids) {
            updateVerification(id, req, callerAccountId);
        }
        return ids.size();
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

        if ((request.getVerification() == PlaceVerificationStatus.NEEDS_UPDATE
                || request.getVerification() == PlaceVerificationStatus.ARCHIVED)
                && (request.getReason() == null || request.getReason().isBlank())) {
            throw new IllegalArgumentException("Vui lòng nhập lý do khi yêu cầu bổ sung hoặc lưu trữ điểm đến.");
        }

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

        if (request.getVisibility() != PlaceVisibility.PUBLISHED
                && (request.getReason() == null || request.getReason().isBlank())) {
            throw new IllegalArgumentException("Vui lòng nhập lý do khi ẩn điểm đến.");
        }

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

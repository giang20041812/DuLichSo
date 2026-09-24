package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminPlaceDtos.*;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.repository.PlaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminPlaceServiceTest {

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private AuditLogService auditLogService;

    private AdminPlaceService service;

    @BeforeEach
    void setUp() {
        service = new AdminPlaceService(placeRepository, auditLogService);
    }

    @Test
    @DisplayName("getPlaces: Phân trang danh sách điểm đến toàn hệ thống")
    void getPlaces_Success() {
        Place place = Place.builder()
                .id(1L)
                .slug("homestay-ban-lim-mong")
                .name("Homestay Bản Lìm Mông")
                .kind(CategoryKind.HOMESTAY)
                .visibility(PlaceVisibility.PUBLISHED)
                .verification(PlaceVerificationStatus.VERIFIED)
                .ratingCount(10)
                .isDeleted(false)
                .build();

        Page<Place> page = new PageImpl<>(List.of(place), PageRequest.of(0, 10), 1);
        when(placeRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<AdminPlaceSummaryDto> result = service.getPlaces("lim mong", PlaceVisibility.PUBLISHED, PlaceVerificationStatus.VERIFIED, CategoryKind.HOMESTAY,
                null, null, null, null, "createdAt", "desc", 0, 10);
        assertEquals(1, result.getTotalElements());
        assertEquals("homestay-ban-lim-mong", result.getContent().get(0).getSlug());
    }

    @Test
    @DisplayName("updateVerification: Duyệt xác thực điểm đến và ghi audit log")
    void updateVerification_Success() {
        Place place = Place.builder()
                .id(2L)
                .slug("doi-mam-xoi")
                .name("Đồi Mâm Xôi")
                .verification(PlaceVerificationStatus.UNVERIFIED)
                .isDeleted(false)
                .build();

        when(placeRepository.findById(2L)).thenReturn(Optional.of(place));
        when(placeRepository.save(any(Place.class))).thenAnswer(i -> i.getArgument(0));

        UpdatePlaceVerificationRequest req = UpdatePlaceVerificationRequest.builder()
                .verification(PlaceVerificationStatus.VERIFIED)
                .reason("Nội dung đã được xác minh thực tế")
                .build();

        AdminPlaceSummaryDto dto = service.updateVerification(2L, req, 1L);
        assertEquals(PlaceVerificationStatus.VERIFIED, dto.getVerification());
        assertNotNull(dto.getLastVerifiedAt());
        verify(auditLogService, times(1)).record(eq(1L), eq("UPDATE_PLACE_VERIFICATION"), eq("Place"), eq(2L), anyString(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("updateVisibility: Admin ẩn khẩn cấp điểm đến")
    void updateVisibility_Success() {
        Place place = Place.builder()
                .id(3L)
                .slug("diem-nguy-hiem")
                .name("Điểm sạt lở nguy hiểm")
                .visibility(PlaceVisibility.PUBLISHED)
                .isDeleted(false)
                .build();

        when(placeRepository.findById(3L)).thenReturn(Optional.of(place));
        when(placeRepository.save(any(Place.class))).thenAnswer(i -> i.getArgument(0));

        UpdatePlaceVisibilityRequest req = UpdatePlaceVisibilityRequest.builder()
                .visibility(PlaceVisibility.UNPUBLISHED)
                .reason("Ẩn khẩn cấp do sạt lở mùa mưa bão")
                .build();

        AdminPlaceSummaryDto dto = service.updateVisibility(3L, req, 1L);
        assertEquals(PlaceVisibility.UNPUBLISHED, dto.getVisibility());
        verify(auditLogService, times(1)).record(eq(1L), eq("UPDATE_PLACE_VISIBILITY"), eq("Place"), eq(3L), eq("Ẩn khẩn cấp do sạt lở mùa mưa bão"), anyMap(), anyMap());
    }
}

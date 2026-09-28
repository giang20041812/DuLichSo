package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminPlaceServiceDeleteTest {

    @Mock private PlaceRepository placeRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private BookingRepository bookingRepository;

    private AdminPlaceService service;

    @BeforeEach
    void setUp() {
        service = new AdminPlaceService(placeRepository, auditLogService, bookingRepository);
    }

    private static Place place(long id) {
        Place p = new Place();
        p.setId(id);
        p.setName("Homestay " + id);
        p.setVisibility(PlaceVisibility.PUBLISHED);
        p.setIsDeleted(false);
        return p;
    }

    @Test
    @DisplayName("deletePlaces: xóa mềm, ẩn khỏi khách và ghi audit từng điểm đến")
    void deletePlaces_softDeletes() {
        Place a = place(1), b = place(2);
        when(placeRepository.findById(1L)).thenReturn(Optional.of(a));
        when(placeRepository.findById(2L)).thenReturn(Optional.of(b));
        when(bookingRepository.existsByPlaceIdAndStatusIn(anyLong(), any())).thenReturn(false);

        int deleted = service.deletePlaces(List.of(1L, 2L, 1L), "Nội dung trùng lặp", 7L);

        assertEquals(2, deleted);
        assertTrue(a.getIsDeleted());
        assertEquals(PlaceVisibility.UNPUBLISHED, a.getVisibility());
        verify(auditLogService, times(2)).record(eq(7L), eq("DELETE_PLACE"), eq("Place"), anyLong(), eq("Nội dung trùng lặp"), anyMap(), anyMap());
    }

    @Test
    @DisplayName("deletePlaces: bắt buộc lý do")
    void deletePlaces_reasonRequired() {
        assertThrows(IllegalArgumentException.class, () -> service.deletePlaces(List.of(1L), "  ", 7L));
        verifyNoInteractions(placeRepository);
    }

    @Test
    @DisplayName("deletePlaces: điểm đến còn đơn đặt phòng đang hiệu lực thì không được xóa")
    void deletePlaces_blockedByActiveBookings() {
        Place a = place(1);
        when(placeRepository.findById(1L)).thenReturn(Optional.of(a));
        when(bookingRepository.existsByPlaceIdAndStatusIn(eq(1L), any())).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.deletePlaces(List.of(1L), "Xóa", 7L));
        assertFalse(a.getIsDeleted());
        verify(placeRepository, never()).save(any());
    }

    @Test
    @DisplayName("deletePlaces: không tìm thấy hoặc đã xóa thì báo lỗi")
    void deletePlaces_notFound() {
        when(placeRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.deletePlaces(List.of(9L), "Xóa", 7L));
    }
}

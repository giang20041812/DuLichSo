package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.*;
import com.dulichso.bookingapi.entity.enums.PlaceOperationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PartnerHomestayServiceTest {

    private PartnerHomestayService service;

    @BeforeEach
    void setUp() {
        service = new PartnerHomestayService();
    }

    @Test
    @DisplayName("Kịch bản 1: Mặc định trả về đủ 3 homestay với stats chính xác")
    void testGetDefaultHomestays() {
        PartnerHomestayPageResponse response = service.getHomestays("DEFAULT", null, null, null);

        assertNotNull(response);
        assertEquals(3, response.getHomestays().size());
        assertEquals(3, response.getStats().getTotalCount());
        assertEquals(2, response.getStats().getPublishedCount());
        assertEquals(1, response.getStats().getDraftCount());
        assertFalse(response.isProviderSuspended());
    }

    @Test
    @DisplayName("Kịch bản 2: Chưa có Homestay (EMPTY) trả về danh sách rỗng")
    void testGetEmptyHomestays() {
        PartnerHomestayPageResponse response = service.getHomestays("EMPTY", null, null, null);

        assertNotNull(response);
        assertTrue(response.getHomestays().isEmpty());
        assertEquals(0, response.getStats().getTotalCount());
    }

    @Test
    @DisplayName("Kịch bản 3: NCC Bị Đình Chỉ (SUSPENDED) gắn cờ isProviderSuspended = true")
    void testGetSuspendedHomestays() {
        PartnerHomestayPageResponse response = service.getHomestays("SUSPENDED", null, null, null);

        assertNotNull(response);
        assertTrue(response.isProviderSuspended());
    }

    @Test
    @DisplayName("Lọc theo trạng thái hiển thị (Visibility)")
    void testFilterByVisibility() {
        PartnerHomestayPageResponse response = service.getHomestays("DEFAULT", null, "PUBLISHED", null);

        assertNotNull(response);
        assertEquals(2, response.getHomestays().size());
        assertTrue(response.getHomestays().stream().allMatch(h -> h.getVisibility() == PlaceVisibility.PUBLISHED));
    }

    @Test
    @DisplayName("Lọc theo trạng thái vận hành (Operation Status)")
    void testFilterByOperation() {
        PartnerHomestayPageResponse response = service.getHomestays("DEFAULT", null, null, "TEMP_CLOSED");

        assertNotNull(response);
        assertEquals(1, response.getHomestays().size());
        assertEquals("Nhà Sàn Pơ Mu Khau Phạ", response.getHomestays().get(0).getName());
    }

    @Test
    @DisplayName("Cập nhật trạng thái hiển thị Homestay (Toggle Visibility)")
    void testUpdateStatus() {
        UpdateStatusRequest req = UpdateStatusRequest.builder()
                .visibility(PlaceVisibility.UNPUBLISHED)
                .build();

        PartnerHomestaySummaryDto updated = service.updateStatus(1L, req);

        assertEquals(PlaceVisibility.UNPUBLISHED, updated.getVisibility());
        assertEquals("Vừa xong", updated.getLastUpdatedText());
    }

    @Test
    @DisplayName("Tạo nhanh Homestay mới với trạng thái mặc định DRAFT (UC-10)")
    void testCreateQuickHomestay() {
        QuickCreateHomestayRequest req = QuickCreateHomestayRequest.builder()
                .name("Homestay Nậm Khắt View")
                .address("Xã Nậm Khắt, Mù Cang Chải")
                .priceRefMin(new BigDecimal("400000"))
                .priceRefMax(new BigDecimal("650000"))
                .build();

        PartnerHomestaySummaryDto created = service.createQuickHomestay(req);

        assertNotNull(created);
        assertEquals("Homestay Nậm Khắt View", created.getName());
        assertEquals(PlaceVisibility.DRAFT, created.getVisibility());
        assertFalse(created.isReadyToPublish());
    }
}

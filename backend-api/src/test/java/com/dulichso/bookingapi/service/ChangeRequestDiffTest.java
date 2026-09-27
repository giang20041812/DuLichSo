package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.FieldChangeDto;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ChangeRequestDiffTest {

    @Test
    @DisplayName("norm: null và chuỗi rỗng như nhau, số không phân biệt 500000 với 500000.00, danh sách không phân biệt thứ tự")
    void norm_normalizesForComparison() {
        assertEquals(ChangeRequestDiff.norm(null), ChangeRequestDiff.norm("  "));
        assertEquals(ChangeRequestDiff.norm(500000), ChangeRequestDiff.norm(new BigDecimal("500000.00")));
        assertEquals("500000", ChangeRequestDiff.norm(5e5));
        assertEquals(ChangeRequestDiff.norm(List.of(3, 1, 2)), ChangeRequestDiff.norm(List.of(2, 3, 1)));
        assertEquals("Đôi ×2", ChangeRequestDiff.norm(Map.of("bedType", "Đôi", "quantity", 2)));
    }

    @Test
    @DisplayName("pick: chỉ giữ trường được phép, bỏ id và trạng thái hiển thị")
    void pick_dropsNonEditableFields() {
        Map<String, Object> picked = ChangeRequestDiff.pick(ChangeTargetType.ROOM_TYPE,
                Map.of("name", "Phòng đôi", "id", 3, "placeId", 21, "basePrice", 500000));
        assertEquals("Phòng đôi", picked.get("name"));
        assertFalse(picked.containsKey("id"));
        assertFalse(picked.containsKey("placeId"));
        assertEquals(ChangeRequestDiff.ROOM.keySet(), picked.keySet());
        assertNull(ChangeRequestDiff.pick(ChangeTargetType.ROOM_TYPE, null));
    }

    @Test
    @DisplayName("changes: chỉ trả trường thay đổi; DELETE hiển thị '(xóa)'")
    void changes_onlyDifferences() {
        PartnerChangeRequest update = PartnerChangeRequest.builder().targetType(ChangeTargetType.ROOM_PRICE).operation(ChangeOperation.UPDATE)
                .beforeData(Map.of("name", "Mùa lúa", "price", 900000, "periodStart", "2026-09-01", "periodEnd", "2026-09-30"))
                .payload(Map.of("name", "Mùa lúa", "price", 1200000.0, "periodStart", "2026-09-01", "periodEnd", "2026-09-30")).build();
        List<FieldChangeDto> changes = ChangeRequestDiff.changes(update);
        assertEquals(1, changes.size());
        assertEquals("price", changes.get(0).field());
        assertEquals("900000", changes.get(0).before());
        assertEquals("1200000", changes.get(0).after());

        PartnerChangeRequest delete = PartnerChangeRequest.builder().targetType(ChangeTargetType.ROOM_PRICE).operation(ChangeOperation.DELETE)
                .beforeData(Map.of("name", "Mùa lúa", "price", 900000)).build();
        assertTrue(ChangeRequestDiff.changes(delete).stream().allMatch(c -> "(xóa)".equals(c.after())));
    }
}

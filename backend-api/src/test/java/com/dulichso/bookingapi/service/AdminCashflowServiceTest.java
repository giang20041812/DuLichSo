package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowLevel;
import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowReportDto;
import com.dulichso.bookingapi.dto.admin.AdminCashflowDtos.CashflowRowDto;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import com.dulichso.bookingapi.entity.enums.RefundStatus;
import com.dulichso.bookingapi.repository.PaymentTransactionRepository;
import com.dulichso.bookingapi.repository.RefundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/** Dòng tiền theo NCC/Homestay từ thanh toán và hoàn tiền. */
@ExtendWith(MockitoExtension.class)
class AdminCashflowServiceTest {
    static final LocalDate FROM = LocalDate.of(2026, 9, 1);
    static final LocalDate TO = LocalDate.of(2026, 9, 30);

    @Mock PaymentTransactionRepository payments;
    @Mock RefundRepository refunds;
    AdminCashflowService service;

    @BeforeEach
    void setup() {
        service = new AdminCashflowService(payments, refunds);
        // NCC 1: Homestay 10 (thu 3 triệu/2 booking, hoàn 500k) và Homestay 11 (thu 1 triệu/1 booking); NCC 2: Homestay 20 (thu 2 triệu, đang chờ hoàn 200k)
        lenient().when(payments.sumPaidByPlace(eq(PaymentStatus.SUCCESS), any(LocalDateTime.class), any(LocalDateTime.class), any())).thenReturn(rows(
                row(10L, "Ecolodge", 1L, "NCC Một", 2L, "3000000"),
                row(11L, "Homestay B", 1L, "NCC Một", 1L, "1000000"),
                row(20L, "Hello MCC", 2L, "NCC Hai", 1L, "2000000")));
    }

    private static List<Object[]> rows(Object[]... rows) {
        return new ArrayList<>(List.of(rows));
    }

    private static Object[] row(long placeId, String place, long providerId, String provider, long bookings, String amount) {
        return new Object[]{placeId, place, providerId, provider, bookings, new BigDecimal(amount)};
    }


    @Test
    @DisplayName("Theo NCC: gộp các Homestay, net = thu - hoàn, chờ hoàn không bị trừ vào net")
    void providerLevel_aggregatesPlaces() {
        CashflowReportDto report = service.report(FROM, TO, CashflowLevel.PROVIDER, null, null, "net", "desc", 0, 20);

        List<CashflowRowDto> rows = report.rows().getContent();
        assertEquals(2, rows.size());
        CashflowRowDto one = rows.get(0);
        assertEquals("NCC Một", one.name());
        assertEquals(3L, one.paidBookings());
        assertEquals(0, new BigDecimal("4000000").compareTo(one.paidAmount()));
        assertEquals(0, new BigDecimal("4000000").compareTo(one.netAmount()));
        CashflowRowDto two = rows.get(1);
        assertEquals(0, new BigDecimal("2000000").compareTo(two.netAmount()));
        assertEquals(0, new BigDecimal("6000000").compareTo(report.totals().netAmount()));
        assertEquals(0, new BigDecimal("6000000").compareTo(report.totals().paidAmount()));
        assertEquals(4L, report.totals().paidBookings());
    }

    @Test
    @DisplayName("Theo Homestay: mỗi Homestay một dòng kèm NCC sở hữu")
    void placeLevel_rowPerPlace() {
        CashflowReportDto report = service.report(FROM, TO, CashflowLevel.PLACE, null, null, "paid", "desc", 0, 20);

        List<CashflowRowDto> rows = report.rows().getContent();
        assertEquals(3, rows.size());
        assertEquals("Ecolodge", rows.get(0).name());
        assertEquals("NCC Một", rows.get(0).providerName());
        assertEquals(1L, rows.get(0).providerId());
        assertEquals(10L, rows.get(0).id());
    }

    @Test
    @DisplayName("Lọc từ khóa: tổng tính trên tập đã lọc; phân trang giữ nguyên tổng số dòng")
    void keywordFilter_totalsFollowFilter_andPaging() {
        CashflowReportDto filtered = service.report(FROM, TO, CashflowLevel.PLACE, null, "hello", "net", "desc", 0, 20);
        assertEquals(1, filtered.rows().getTotalElements());
        assertEquals(0, new BigDecimal("2000000").compareTo(filtered.totals().netAmount()));

        CashflowReportDto page = service.report(FROM, TO, CashflowLevel.PLACE, null, null, "net", "desc", 1, 2);
        assertEquals(3, page.rows().getTotalElements());
        assertEquals(2, page.rows().getTotalPages());
        assertEquals(1, page.rows().getContent().size());
        assertEquals(0, new BigDecimal("6000000").compareTo(page.totals().netAmount()), "Tổng không phụ thuộc trang");
    }


    @Test
    @DisplayName("Truyền providerId xuống truy vấn; mặc định kỳ là đầu tháng đến hôm nay")
    void providerFilter_passedToQueries() {
        CashflowReportDto report = service.report(null, null, null, 2L, null, null, null, 0, 20);

        verify(payments).sumPaidByPlace(eq(PaymentStatus.SUCCESS), any(), any(), eq(2L));
        assertEquals(LocalDate.now().withDayOfMonth(1), report.from());
        assertEquals(LocalDate.now(), report.to());
        assertEquals(CashflowLevel.PROVIDER, report.level());
    }

    @Test
    @DisplayName("Khoảng thời gian không hợp lệ bị từ chối")
    void invalidRange_rejected() {
        assertThrows(IllegalArgumentException.class, () -> service.report(TO, FROM, null, null, null, null, null, 0, 20));
        assertThrows(IllegalArgumentException.class, () -> service.report(LocalDate.of(2020, 1, 1), LocalDate.of(2026, 1, 1), null, null, null, null, null, 0, 20));
        verifyNoInteractions(payments);
    }

    @Test
    @DisplayName("Không có giao dịch nào: trả danh sách rỗng, tổng bằng 0")
    void noData_emptyReport() {
        when(payments.sumPaidByPlace(any(), any(), any(), isNull())).thenReturn(new ArrayList<>());

        CashflowReportDto report = service.report(FROM, TO, CashflowLevel.PROVIDER, null, null, "net", "desc", 0, 20);

        assertTrue(report.rows().isEmpty());
        assertEquals(0, BigDecimal.ZERO.compareTo(report.totals().netAmount()));
    }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import com.dulichso.bookingapi.repository.BookingRepository;
import com.dulichso.bookingapi.repository.PaymentTransactionRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import com.dulichso.bookingapi.service.AdminReportService.OverviewReport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminReportServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private PaymentTransactionRepository paymentRepository;
    @Mock private ProviderRepository providerRepository;
    @Mock private PlaceRepository placeRepository;

    private AdminReportService service;

    @BeforeEach
    void setUp() {
        service = new AdminReportService(bookingRepository, paymentRepository, providerRepository, placeRepository);
    }

    private static Object[] row(String created, BookingStatus st, long amount, long pid, String pn, long plid, String pln) {
        return new Object[]{LocalDateTime.parse(created), st, BigDecimal.valueOf(amount), pid, pn, plid, pln};
    }

    private void stubBookings(Object[]... rows) {
        when(bookingRepository.findReportRows(any(), any(), any())).thenReturn(List.of(rows));
        lenient().when(paymentRepository.sumPaidInRange(eq(PaymentStatus.SUCCESS), any(), any(), any())).thenReturn(BigDecimal.ZERO);
        lenient().when(providerRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(any(), any())).thenReturn(3L);
        lenient().when(placeRepository.countByIsDeletedFalseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(any(), any())).thenReturn(5L);
    }

    @Test
    @DisplayName("overview: KPI, biểu đồ theo ngày và top NCC / homestay")
    void overview_aggregates() {
        stubBookings(
                row("2026-09-01T10:00:00", BookingStatus.CONFIRMED, 1_000_000, 1, "NCC A", 10, "Homestay A"),
                row("2026-09-01T11:00:00", BookingStatus.COMPLETED, 500_000, 1, "NCC A", 10, "Homestay A"),
                row("2026-09-02T09:00:00", BookingStatus.CANCELLED, 300_000, 2, "NCC B", 20, "Homestay B"),
                row("2026-09-03T09:00:00", BookingStatus.PENDING, 200_000, 2, "NCC B", 20, "Homestay B"));

        OverviewReport r = service.overview(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 5), null, "ALL");

        assertEquals("DAY", r.granularity());
        assertEquals(5, r.series().size());
        assertEquals(4, r.kpi().totalBookings());
        assertEquals(2, r.kpi().confirmedBookings());
        assertEquals(1, r.kpi().openBookings());
        assertEquals(1, r.kpi().lostBookings());
        assertEquals(0, BigDecimal.valueOf(1_500_000).compareTo(r.kpi().bookingValue()));
        assertEquals(0, BigDecimal.valueOf(750_000).compareTo(r.kpi().averageValue()));
        assertEquals(50.0, r.kpi().confirmationRate());
        assertEquals(3L, r.kpi().newProviders());
        assertEquals("NCC A", r.topProviders().get(0).name());
        assertEquals("Homestay A", r.topPlaces().get(0).name());
        assertEquals(2, r.series().get(0).bookings());
    }

    @Test
    @DisplayName("overview: lọc nhóm CONFIRMED chỉ tính đơn đã xác nhận / hoàn tất")
    void overview_groupFilter() {
        stubBookings(
                row("2026-09-01T10:00:00", BookingStatus.CONFIRMED, 1_000_000, 1, "NCC A", 10, "Homestay A"),
                row("2026-09-02T09:00:00", BookingStatus.CANCELLED, 300_000, 2, "NCC B", 20, "Homestay B"));

        OverviewReport r = service.overview(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 5), null, "CONFIRMED");

        assertEquals(1, r.kpi().totalBookings());
        assertEquals(1, r.topProviders().size());
        // Biểu đồ trạng thái vẫn đủ để đối chiếu
        assertEquals(1, r.byStatus().stream().filter(s -> s.status() == BookingStatus.CANCELLED).findFirst().orElseThrow().count());
    }

    @Test
    @DisplayName("overview: khoảng dài chuyển sang nhóm theo tháng, có đủ tháng trống")
    void overview_monthlyGranularity() {
        stubBookings(row("2026-03-15T10:00:00", BookingStatus.CONFIRMED, 100, 1, "NCC A", 10, "Homestay A"));

        OverviewReport r = service.overview(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30), null, null);

        assertEquals("MONTH", r.granularity());
        assertEquals(6, r.series().size());
        assertEquals(1, r.series().get(2).bookings());
    }

    @Test
    @DisplayName("overview: lọc theo NCC thì không trả số NCC/điểm đến mới")
    void overview_providerFilter() {
        stubBookings();
        OverviewReport r = service.overview(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 2), 1L, "ALL");
        assertNull(r.kpi().newProviders());
        assertNull(r.kpi().newPlaces());
        assertEquals(0, r.kpi().totalBookings());
    }

    @Test
    @DisplayName("overview: tham số không hợp lệ bị từ chối")
    void overview_invalidInput() {
        assertThrows(IllegalArgumentException.class,
                () -> service.overview(LocalDate.of(2026, 9, 5), LocalDate.of(2026, 9, 1), null, "ALL"));
        assertThrows(IllegalArgumentException.class,
                () -> service.overview(LocalDate.of(2020, 1, 1), LocalDate.of(2026, 9, 1), null, "ALL"));
        assertThrows(IllegalArgumentException.class,
                () -> service.overview(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 2), null, "BOGUS"));
    }
}

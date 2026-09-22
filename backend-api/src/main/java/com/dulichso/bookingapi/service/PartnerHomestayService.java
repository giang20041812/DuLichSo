package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.*;
import com.dulichso.bookingapi.entity.enums.PlaceOperationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartnerHomestayService {

    // Danh sách homestay mẫu chuẩn theo kịch bản UC-10 (trong bộ nhớ có thể cập nhật trạng thái runtime)
    private final List<PartnerHomestaySummaryDto> mockHomestays = new ArrayList<>();

    public PartnerHomestayService() {
        initDefaultHomestays();
    }

    private void initDefaultHomestays() {
        mockHomestays.clear();

        // 1. Bản Lìm Mông Eco Lodge
        mockHomestays.add(PartnerHomestaySummaryDto.builder()
                .id(1L)
                .code("ID: #LM-01")
                .slug("ban-lim-mong-eco-lodge")
                .name("Bản Lìm Mông Eco Lodge")
                .address("Bản Lìm Mông, Xã Cao Phạ, Huyện Mù Cang Chải")
                .coverImageUrl("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80")
                .categoryName("Lưu trú / Homestay")
                .visibility(PlaceVisibility.PUBLISHED)
                .operationStatus(PlaceOperationStatus.OPERATING)
                .roomTypesCount(3)
                .priceRefMin(new BigDecimal("450000"))
                .priceRefMax(new BigDecimal("750000"))
                .priceUnitNote("đêm")
                .lastUpdatedText("Hôm nay 08:30")
                .auditStatus("STANDARD")
                .auditStatusText("Hồ sơ chuẩn")
                .isReadyToPublish(true)
                .build());

        // 2. Nhà Sàn Pơ Mu Khau Phạ
        mockHomestays.add(PartnerHomestaySummaryDto.builder()
                .id(2L)
                .code("ID: #KP-02")
                .slug("nha-san-po-mu-khau-pha")
                .name("Nhà Sàn Pơ Mu Khau Phạ")
                .address("Đèo Khau Phạ, Huyện Mù Cang Chải, Yên Bái")
                .coverImageUrl("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80")
                .categoryName("Lưu trú / Homestay")
                .visibility(PlaceVisibility.PUBLISHED)
                .operationStatus(PlaceOperationStatus.TEMP_CLOSED)
                .alertNote("Đang hiển thị trang giới thiệu. Trên Customer Web ngừng tiếp nhận phòng do đang bảo trì mái gỗ Pơ Mu.")
                .roomTypesCount(2)
                .priceRefMin(new BigDecimal("350000"))
                .priceRefMax(new BigDecimal("600000"))
                .priceUnitNote("đêm")
                .lastUpdatedText("Hôm qua 15:45")
                .auditStatus("MAINTENANCE")
                .auditStatusText("Đang bảo trì")
                .isReadyToPublish(true)
                .build());

        // 3. Suối Khoáng Nậm Lúng Retreat
        mockHomestays.add(PartnerHomestaySummaryDto.builder()
                .id(3L)
                .code("ID: #NL-03")
                .slug("suoi-khoang-nam-lung-retreat")
                .name("Suối Khoáng Nậm Lúng Retreat")
                .address("Bản Nậm Lúng, Xã Tú Lệ, Huyện Văn Chấn")
                .coverImageUrl("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80")
                .categoryName("Lưu trú / Homestay")
                .visibility(PlaceVisibility.DRAFT)
                .operationStatus(PlaceOperationStatus.OPERATING)
                .alertNote("Chưa đủ điều kiện công khai: Thiếu ảnh đại diện mặt tiền và giấy đăng ký lưu trú cấp xã. Bổ sung để hiển thị ngay lập tức (không cần duyệt).")
                .roomTypesCount(1)
                .priceRefMin(new BigDecimal("500000"))
                .priceRefMax(new BigDecimal("500000"))
                .priceUnitNote("đêm")
                .lastUpdatedText("2 ngày trước")
                .auditStatus("NEEDS_DATA")
                .auditStatusText("Cần thêm dữ liệu")
                .isReadyToPublish(false)
                .build());
    }

    public PartnerHomestayPageResponse getHomestays(String scenario, String keyword, String visibility, String operationStatus) {
        // Kịch bản 2: Chưa có homestay nào (Empty state)
        if ("EMPTY".equalsIgnoreCase(scenario)) {
            return PartnerHomestayPageResponse.builder()
                    .homestays(List.of())
                    .stats(PartnerHomestayStatsDto.builder()
                            .totalCount(0)
                            .publishedCount(0)
                            .draftCount(0)
                            .unpublishedCount(0)
                            .operatingCount(0)
                            .tempClosedCount(0)
                            .build())
                    .cooperativeName("HỢP TÁC XÃ DU LỊCH CỘNG ĐỒNG LÌM MÔNG")
                    .providerCode("NCC-TB-0824")
                    .isProviderSuspended(false)
                    .build();
        }

        // Kịch bản 3: NCC Bị Đình Chỉ (Suspended)
        if ("SUSPENDED".equalsIgnoreCase(scenario)) {
            return PartnerHomestayPageResponse.builder()
                    .homestays(mockHomestays)
                    .stats(calculateStats(mockHomestays))
                    .cooperativeName("HỢP TÁC XÃ DU LỊCH CỘNG ĐỒNG LÌM MÔNG")
                    .providerCode("NCC-TB-0824")
                    .isProviderSuspended(true)
                    .build();
        }

        // Lọc dữ liệu theo từ khóa và trạng thái
        List<PartnerHomestaySummaryDto> filtered = mockHomestays.stream()
                .filter(h -> {
                    if (keyword != null && !keyword.trim().isEmpty()) {
                        String kw = keyword.trim().toLowerCase();
                        boolean matches = h.getName().toLowerCase().contains(kw) || h.getAddress().toLowerCase().contains(kw);
                        if (!matches) return false;
                    }

                    if (visibility != null && !visibility.trim().isEmpty() && !"ALL".equalsIgnoreCase(visibility)) {
                        try {
                            PlaceVisibility pv = PlaceVisibility.valueOf(visibility.trim().toUpperCase());
                            if (h.getVisibility() != pv) return false;
                        } catch (Exception ignored) {}
                    }

                    if (operationStatus != null && !operationStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(operationStatus)) {
                        try {
                            PlaceOperationStatus pos = PlaceOperationStatus.valueOf(operationStatus.trim().toUpperCase());
                            if (h.getOperationStatus() != pos) return false;
                        } catch (Exception ignored) {}
                    }

                    return true;
                })
                .collect(Collectors.toList());

        PartnerHomestayStatsDto stats = calculateStats(mockHomestays);

        return PartnerHomestayPageResponse.builder()
                .homestays(filtered)
                .stats(stats)
                .cooperativeName("HỢP TÁC XÃ DU LỊCH CỘNG ĐỒNG LÌM MÔNG")
                .providerCode("NCC-TB-0824")
                .isProviderSuspended(false)
                .build();
    }

    private PartnerHomestayStatsDto calculateStats(List<PartnerHomestaySummaryDto> list) {
        int total = list.size();
        int published = (int) list.stream().filter(h -> h.getVisibility() == PlaceVisibility.PUBLISHED).count();
        int draft = (int) list.stream().filter(h -> h.getVisibility() == PlaceVisibility.DRAFT).count();
        int unpublished = (int) list.stream().filter(h -> h.getVisibility() == PlaceVisibility.UNPUBLISHED).count();
        int operating = (int) list.stream().filter(h -> h.getOperationStatus() == PlaceOperationStatus.OPERATING).count();
        int tempClosed = (int) list.stream().filter(h -> h.getOperationStatus() == PlaceOperationStatus.TEMP_CLOSED).count();

        return PartnerHomestayStatsDto.builder()
                .totalCount(total)
                .publishedCount(published)
                .draftCount(draft)
                .unpublishedCount(unpublished)
                .operatingCount(operating)
                .tempClosedCount(tempClosed)
                .build();
    }

    public PartnerHomestaySummaryDto updateStatus(Long homestayId, UpdateStatusRequest request) {
        for (PartnerHomestaySummaryDto h : mockHomestays) {
            if (h.getId().equals(homestayId)) {
                if (request.getVisibility() != null) {
                    h.setVisibility(request.getVisibility());
                }
                if (request.getOperationStatus() != null) {
                    h.setOperationStatus(request.getOperationStatus());
                }
                h.setLastUpdatedText("Vừa xong");
                return h;
            }
        }
        throw new RuntimeException("Không tìm thấy Homestay với ID: " + homestayId);
    }

    public PartnerHomestaySummaryDto createQuickHomestay(QuickCreateHomestayRequest request) {
        long newId = mockHomestays.size() + 1L;
        String code = "ID: #HM-0" + newId;
        String slug = "homestay-" + newId;

        PartnerHomestaySummaryDto newHomestay = PartnerHomestaySummaryDto.builder()
                .id(newId)
                .code(code)
                .slug(slug)
                .name(request.getName() != null ? request.getName() : "Homestay Mới Tạo")
                .address(request.getAddress() != null ? request.getAddress() : "Mù Cang Chải, Yên Bái")
                .coverImageUrl("https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80")
                .categoryName("Lưu trú / Homestay")
                .visibility(PlaceVisibility.DRAFT) // UC-10: Mới tạo mặc định là DRAFT
                .operationStatus(PlaceOperationStatus.OPERATING)
                .roomTypesCount(1)
                .priceRefMin(request.getPriceRefMin() != null ? request.getPriceRefMin() : new BigDecimal("400000"))
                .priceRefMax(request.getPriceRefMax() != null ? request.getPriceRefMax() : new BigDecimal("600000"))
                .priceUnitNote("đêm")
                .lastUpdatedText("Vừa tạo")
                .auditStatus("NEEDS_DATA")
                .auditStatusText("Cần thêm dữ liệu")
                .alertNote("Chưa đủ điều kiện công khai: Vui lòng bổ sung đầy đủ thông tin phòng để xuất bản.")
                .isReadyToPublish(false)
                .build();

        mockHomestays.add(0, newHomestay);
        return newHomestay;
    }

    public PartnerHomestayDetailDto getHomestayDetail(Long id) {
        // Tìm trong mockHomestays
        PartnerHomestaySummaryDto summary = mockHomestays.stream()
                .filter(h -> h.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (summary == null && id != 1L) {
            throw new RuntimeException("Không tìm thấy thông tin Homestay với ID: " + id);
        }

        if (id == 2L) {
            return PartnerHomestayDetailDto.builder()
                    .id(2L)
                    .code("ID: #KP-02")
                    .slug("nha-san-po-mu-khau-pha")
                    .name("Nhà Sàn Pơ Mu Khau Phạ")
                    .description("Nhà sàn gỗ Pơ Mu nguyên bản ngắm trọn đỉnh đèo Khau Phạ quanh năm mây mù bao phủ.")
                    .contactPhone("0987 654 321")
                    .contactEmail("khaupha@taybactrails.vn")
                    .regionName("Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái")
                    .address("Đèo Khau Phạ, Huyện Mù Cang Chải, Yên Bái")
                    .latitude(21.782310)
                    .longitude(104.301240)
                    .accessNote("Ngay sườn đèo Khau Phạ, ô tô lên thẳng sân.")
                    .coverImageUrl("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80")
                    .galleryUrls(List.of(
                            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
                            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
                    ))
                    .amenities(List.of("Wifi tốc độ cao", "Chỗ đỗ ô tô miễn phí", "Sân lửa trại / BBQ", "View ruộng bậc thang"))
                    .checkInFrom("14:00")
                    .checkOutUntil("12:00")
                    .houseRules("Giữ gìn vệ sinh, không hút thuốc phòng ngủ.")
                    .cancellationPolicy("Miễn phí hủy trước 48h (Chính sách Tiêu chuẩn)")
                    .visibility(PlaceVisibility.PUBLISHED)
                    .operationStatus(PlaceOperationStatus.TEMP_CLOSED)
                    .isReadyToPublish(true)
                    .alertNote("Đang hiển thị trang giới thiệu. Trên Customer Web ngừng tiếp nhận phòng do đang bảo trì mái gỗ Pơ Mu.")
                    .build();
        }

        if (id == 3L) {
            return PartnerHomestayDetailDto.builder()
                    .id(3L)
                    .code("ID: #NL-03")
                    .slug("suoi-khoang-nam-lung-retreat")
                    .name("Suối Khoáng Nậm Lúng Retreat")
                    .description("Khu nghỉ dưỡng suối nước khoáng nóng tự nhiên giữa bản Nậm Lúng yên bình.")
                    .contactPhone("0901 234 567")
                    .contactEmail("namlung@taybactrails.vn")
                    .regionName("Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái")
                    .address("Bản Nậm Lúng, Xã Tú Lệ, Huyện Văn Chấn")
                    .latitude(21.734510)
                    .longitude(104.351230)
                    .accessNote("Cách quốc lộ 32 1.5km đường bê tông.")
                    .coverImageUrl("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80")
                    .galleryUrls(List.of(
                            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
                    ))
                    .amenities(List.of("Tắm lá thuốc dân tộc", "Phục vụ ẩm thực bản địa"))
                    .checkInFrom("14:00")
                    .checkOutUntil("12:00")
                    .houseRules("Giữ trật tự khu vực suối khoáng sau 21h.")
                    .cancellationPolicy("Miễn phí hủy trước 24h")
                    .visibility(PlaceVisibility.DRAFT)
                    .operationStatus(PlaceOperationStatus.OPERATING)
                    .isReadyToPublish(false)
                    .alertNote("Chưa đủ điều kiện công khai: Thiếu ảnh đại diện mặt tiền và giấy đăng ký lưu trú cấp xã. Bổ sung để hiển thị ngay lập tức (không cần duyệt).")
                    .build();
        }

        // Mặc định: Bản Lìm Mông Eco Lodge (Khớp chính xác với hình ảnh thiết kế)
        return PartnerHomestayDetailDto.builder()
                .id(1L)
                .code("ID: #LM-01")
                .slug("ban-lim-mong-eco-lodge")
                .name("Bản Lìm Mông Eco Lodge")
                .description("Ngôi nhà sàn gỗ pơ mu nguyên mộc nằm ven suối xuất hiện từ 2021, đón mùa lúa chín đẹp rực rỡ. Đón trọn vẹn không gian nếp sinh hoạt người Thái Nước cùng trải nghiệm tắm suối nước khoáng ấm.")
                .contactPhone("0984 123 456")
                .contactEmail("limmong.ecolodge@dulichso.vn")
                .regionName("Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái")
                .address("Bản Lìm Mông, Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái")
                .latitude(21.758314)
                .longitude(104.283400)
                .accessNote("Đường bê tông nông thôn mới, xe 16 chỗ vào đến tận cổng sân nhà sàn")
                .coverImageUrl("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80")
                .galleryUrls(List.of(
                        "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80",
                        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
                        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
                ))
                .amenities(List.of(
                        "Bãi đỗ xe riêng",
                        "Wifi tốc độ cao",
                        "Ẩm thực bản địa",
                        "Ngâm lá thuốc người Dao",
                        "Lửa trại giao lưu văn nghệ"
                ))
                .checkInFrom("14:00")
                .checkOutUntil("12:00")
                .houseRules("Tuyệt đối không hút thuốc trong phòng ngủ bằng gỗ. Tôn trọng không gian tập quán bản địa của người H'Mông, Thái; giữ trật tự sau 22h đêm.")
                .cancellationPolicy("Linh hoạt: Miễn phí hủy trước 3 ngày. Khách hủy đặt phòng trước 72 giờ (tính từ 14:00 ngày nhận phòng) được hoàn 100% số tiền đã cọc. Hủy sau 72 giờ: tính phí đêm đầu tiên.")
                .visibility(summary != null ? summary.getVisibility() : PlaceVisibility.PUBLISHED)
                .operationStatus(summary != null ? summary.getOperationStatus() : PlaceOperationStatus.OPERATING)
                .isReadyToPublish(true)
                .roomTypesCount(3)
                .roomTypesSummary("Phòng VIP View Ruộng Bậc Thang (x1) • Phòng Gia đình Nhà Sàn (x2) • Phòng Đơn Tiêu Chuẩn (x3)")
                .priceRefMin(new BigDecimal("450000"))
                .priceRefMax(new BigDecimal("750000"))
                .pricingSummary("Đang áp dụng: Base Price + Phụ thu Weekend (T6-T7 + 100.000đ/phòng)")
                .availabilitySummary("11 phòng sẵn sàng / Lịch 30 ngày")
                .stopSellSummary("Chặn bán (Stop Sell): 1 loại phòng đang đóng ngày hôm nay (bảo dưỡng)")
                .heroStatusBadge("🌿 Đang kinh doanh – Bật đầy đủ")
                .build();
    }

    public PartnerHomestayDetailDto saveHomestayDetail(Long id, PartnerHomestayDetailDto dto) {
        // Cập nhật summary tương ứng trong danh sách
        for (PartnerHomestaySummaryDto h : mockHomestays) {
            if (h.getId().equals(id)) {
                h.setName(dto.getName());
                h.setAddress(dto.getAddress());
                if (dto.getVisibility() != null) h.setVisibility(dto.getVisibility());
                if (dto.getOperationStatus() != null) h.setOperationStatus(dto.getOperationStatus());
                if (dto.getCoverImageUrl() != null) h.setCoverImageUrl(dto.getCoverImageUrl());
                h.setLastUpdatedText("Vừa xong");
                break;
            }
        }
        return dto;
    }

    public void resetToDefault() {
        initDefaultHomestays();
    }
}

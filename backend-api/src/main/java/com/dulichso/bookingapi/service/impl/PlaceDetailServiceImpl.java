package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.MapContextDto;
import com.dulichso.bookingapi.dto.PlaceDetailDto;
import com.dulichso.bookingapi.dto.RoomTypeDetailDto;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.enums.*;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import com.dulichso.bookingapi.service.PlaceDetailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceDetailServiceImpl implements PlaceDetailService {

    private final PlaceRepository placeRepository;
    private final RoomTypeRepository roomTypeRepository;

    @Override
    @Transactional(readOnly = true)
    public PlaceDetailDto getPlaceDetail(String slug) {
        Optional<Place> placeOpt = placeRepository.findBySlugAndIsDeletedFalse(slug);
        
        // Build rich detail object matching the exact design
        return buildRichPlaceDetail(placeOpt.orElse(null), slug);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomTypeDetailDto> getPlaceRooms(String slug) {
        return buildMockRoomList();
    }

    @Override
    @Transactional(readOnly = true)
    public MapContextDto getMapContext(String slug) {
        return MapContextDto.builder()
                .placeId(1L)
                .placeSlug(slug)
                .placeName("Bản Lìm Mông Eco Lodge")
                .regionName("Yên Bái")
                .address("Bản Lìm Mông, Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái")
                .latitude(new BigDecimal("21.751214"))
                .longitude(new BigDecimal("104.318420"))
                .altitudeMeters(850)
                .accessNote("Đường bê tông liên thôn, dốc thoai thoải, xe dưới 16 chỗ vào tận sân.")
                .verificationBadge("GPS Verified")
                .pois(List.of(
                        MapContextDto.PoiDto.builder()
                                .id(101L)
                                .name("Tạp hoá Tụ San")
                                .category("MARKET")
                                .latitude(new BigDecimal("21.755410"))
                                .longitude(new BigDecimal("104.312150"))
                                .distanceKm(new BigDecimal("0.8"))
                                .note("Bán nhu yếu phẩm, nước giải khát, sim thẻ")
                                .build(),
                        MapContextDto.PoiDto.builder()
                                .id(102L)
                                .name("Điểm Bay Dù Lượn Khau Phạ")
                                .category("ATTRACTION")
                                .latitude(new BigDecimal("21.742890"))
                                .longitude(new BigDecimal("104.319800"))
                                .distanceKm(new BigDecimal("2.4"))
                                .note("Khu cất cánh & bãi hạ cánh dù lượn ngắm thung lũng")
                                .build(),
                        MapContextDto.PoiDto.builder()
                                .id(103L)
                                .name("Le Champ Tú Lệ Resort & Hot Spring")
                                .category("SERVICE")
                                .latitude(new BigDecimal("21.758200"))
                                .longitude(new BigDecimal("104.331200"))
                                .distanceKm(new BigDecimal("3.1"))
                                .note("Khu tắm khoáng nóng tự nhiên cao cấp")
                                .build(),
                        MapContextDto.PoiDto.builder()
                                .id(104L)
                                .name("Suối khoáng nóng bản Chao")
                                .category("ATTRACTION")
                                .latitude(new BigDecimal("21.749500"))
                                .longitude(new BigDecimal("104.324500"))
                                .distanceKm(new BigDecimal("1.2"))
                                .note("Bể tắm khoáng nóng truyền thống người Thái")
                                .build()
                ))
                .scenarios(List.of(
                        MapContextDto.ScenarioDto.builder()
                                .id("SCENARIO_1")
                                .code("MAP-CUS-01")
                                .label("1. Chuẩn: Bản Lìm Mông")
                                .targetName("Bản Lìm Mông Eco Lodge")
                                .latitude(new BigDecimal("21.751214"))
                                .longitude(new BigDecimal("104.318420"))
                                .zoomLevel(15)
                                .altitudeMeters(850)
                                .accessNote("Đường bê tông liên thôn, dốc thoai thoải, xe dưới 16 chỗ vào tận sân.")
                                .isPrimary(true)
                                .build(),
                        MapContextDto.ScenarioDto.builder()
                                .id("SCENARIO_2")
                                .code("MAP-CUS-02")
                                .label("2. Dịch vụ: Giã Cốm Tú Lệ")
                                .targetName("Lò cốm truyền thống Tú Lệ")
                                .latitude(new BigDecimal("21.753800"))
                                .longitude(new BigDecimal("104.322900"))
                                .zoomLevel(16)
                                .altitudeMeters(830)
                                .accessNote("Ngay trục đường liên xã, xe ô tô dừng đỗ thoải mái.")
                                .isPrimary(false)
                                .build(),
                        MapContextDto.ScenarioDto.builder()
                                .id("SCENARIO_3")
                                .code("MAP-CUS-03")
                                .label("3. Trải nghiệm: Tắm suối khoáng")
                                .targetName("Khu tắm khoáng bản Chao")
                                .latitude(new BigDecimal("21.749500"))
                                .longitude(new BigDecimal("104.324500"))
                                .zoomLevel(15)
                                .altitudeMeters(820)
                                .accessNote("Đi xe máy hoặc đi bộ 500m từ đường lớn.")
                                .isPrimary(false)
                                .build()
                ))
                .build();
    }

    private PlaceDetailDto buildRichPlaceDetail(Place place, String slug) {
        String name = place != null ? place.getName() : "Bản Lìm Mông Eco Lodge";
        String address = place != null && place.getAddress() != null ? place.getAddress() : "Bản Lìm Mông, Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái";
        BigDecimal lat = place != null && place.getLatitude() != null ? place.getLatitude() : new BigDecimal("21.751214");
        BigDecimal lng = place != null && place.getLongitude() != null ? place.getLongitude() : new BigDecimal("104.318420");

        return PlaceDetailDto.builder()
                .id(place != null ? place.getId() : 1L)
                .slug(slug)
                .name(name)
                .categoryKind("HOMESTAY")
                .categoryName("Homestay cộng đồng")
                .regionName("Yên Bái")
                .address(address)
                .latitude(lat)
                .longitude(lng)
                .accessNote("Đường bê tông liên thôn, dốc vừa phải, ô tô 16 chỗ vào tận sân. Có biển chỉ dẫn từ đường QL32 vào 2km.")
                .priceRefMin(new BigDecimal("450000"))
                .priceRefMax(new BigDecimal("750000"))
                .priceUnitNote("đêm")
                .operationStatus(PlaceOperationStatus.OPERATING)
                .verification(PlaceVerificationStatus.VERIFIED)
                .ratingAvg(new BigDecimal("4.95"))
                .ratingCount(48)
                .altitudeMeters(850)
                .verifiedGpsText("21.751214 - 104.318420")
                .description("Nằm ôm trọn vách núi Lìm Mông hùng vĩ, Bản Lìm Mông Eco Lodge gìn giữ trọn vẹn nét văn hóa của người Thái Trắng với nếp nhà sàn pơ mu thơm lừng. Từ hiên nhà, bạn có thể phóng tầm mắt ngắm trọn thung lũng Tú Lệ trập trùng ruộng bậc thang ngát hương lúa mới.\n\nHomestay cam kết du lịch sinh thái bền vững, phục vụ các món ăn bản địa nấu từ nông sản tự cung tự cấp, nước sinh hoạt từ mạch nguồn tự nhiên mát lành.")
                .media(List.of(
                        PlaceDetailDto.MediaItemDto.builder()
                                .id(1L)
                                .publicUrl("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80")
                                .role("COVER")
                                .caption("Nhà sàn gỗ 40 năm tuổi nguyên bản giữa thung lũng Tú Lệ")
                                .sortOrder(0)
                                .build(),
                        PlaceDetailDto.MediaItemDto.builder()
                                .id(2L)
                                .publicUrl("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80")
                                .role("GALLERY")
                                .caption("Không gian hiên nhà ngắm ruộng bậc thang buổi sớm")
                                .sortOrder(1)
                                .build(),
                        PlaceDetailDto.MediaItemDto.builder()
                                .id(3L)
                                .publicUrl("https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80")
                                .role("GALLERY")
                                .caption("Phòng nghỉ ấm cúng phong cách nhà gỗ bản địa")
                                .sortOrder(2)
                                .build(),
                        PlaceDetailDto.MediaItemDto.builder()
                                .id(4L)
                                .publicUrl("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80")
                                .role("GALLERY")
                                .caption("Đường dạo quanh bản làng yên bình rợp bóng pơ mu")
                                .sortOrder(3)
                                .build(),
                        PlaceDetailDto.MediaItemDto.builder()
                                .id(5L)
                                .publicUrl("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80")
                                .role("GALLERY")
                                .caption("Góc bàn trà ngắm thung lũng mờ sương")
                                .sortOrder(4)
                                .build()
                ))
                .images(List.of(
                        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                ))
                .amenities(List.of(
                        "Phục vụ bữa ăn theo yêu cầu",
                        "Nấu nướng tự do (bếp chung có củi)",
                        "Nước nóng sinh hoạt (bình NLMT)",
                        "Màn chống muỗi từng đệm nằm riêng",
                        "Chỗ để xe máy & ô tô an toàn",
                        "Hỗ trợ đón từ xe khách (có phụ phí)"
                ))
                .amenityItems(List.of(
                        PlaceAmenityItemDto("MEAL_ON_DEMAND", "Phục vụ bữa ăn theo yêu cầu", "Utensils", "YES", "Món ăn đặc sản Thái Trắng tươi ngon"),
                        PlaceAmenityItemDto("FREE_KITCHEN", "Nấu nướng tự do (bếp chung có củi)", "ChefHat", "YES", "Có sẵn gia vị, củi khô và bếp ga"),
                        PlaceAmenityItemDto("HOT_WATER", "Nước nóng sinh hoạt (bình NLMT)", "ShowerHead", "YES", "Hệ thống nước nóng 24/7 ổn định"),
                        PlaceAmenityItemDto("MOSQUITO_NET", "Màn chống muỗi từng đệm nằm riêng", "Shield", "YES", "Đảm bảo giấc ngủ trọn vẹn an toàn"),
                        PlaceAmenityItemDto("PARKING", "Chỗ để xe máy & ô tô an toàn", "Car", "YES", "Sân bê tông rộng, có camera an ninh"),
                        PlaceAmenityItemDto("BUS_PICKUP", "Hỗ trợ đón từ xe khách (có phụ phí)", "Bus", "YES", "Đón khách từ ngã ba Tú Lệ hoặc đèo Khau Phạ")
                ))
                .contacts(List.of(
                        PlaceDetailDto.ContactItemDto.builder()
                                .id(1L)
                                .channel(ContactChannel.PHONE)
                                .value("(+84) 0376 289 712")
                                .isPublic(true)
                                .sortOrder(1)
                                .build(),
                        PlaceDetailDto.ContactItemDto.builder()
                                .id(2L)
                                .channel(ContactChannel.EMAIL)
                                .value("banlimmongecolodge@dulichso.vn")
                                .isPublic(true)
                                .sortOrder(2)
                                .build()
                ))
                .highlights(List.of(
                        PlaceDetailDto.HighlightItemDto.builder()
                                .id(1L)
                                .type(HighlightType.PRO)
                                .content("Nhà sàn 40 năm tuổi giữ nguyên kết cấu gỗ pơ mu")
                                .build(),
                        PlaceDetailDto.HighlightItemDto.builder()
                                .id(2L)
                                .type(HighlightType.PRO)
                                .content("Tầm nhìn không che chắn ra thung lũng ruộng bậc thang")
                                .build()
                ))
                .homestayProfile(PlaceDetailDto.HomestayProfileDto.builder()
                        .placeId(1L)
                        .checkInFrom("14:00")
                        .checkOutUntil("12:00")
                        .houseRules("Xuất trình CCCD/Hộ chiếu khi nhận phòng. Giữ yên lặng sau 22:30.")
                        .surchargeNote("Trẻ em dưới 6 tuổi ngủ chung miễn phí; thú cưng được phép mang theo nếu có xích/lồng riêng.")
                        .currentPolicy(PlaceDetailDto.PolicyDto.builder()
                                .id(1L)
                                .name("Chính sách hủy tiêu chuẩn 48h")
                                .description("Miễn phí hủy trước 48 giờ so với thời điểm nhận phòng (14:00). Hủy trong vòng 48 giờ mất phí 50% tổng cọc.")
                                .build())
                        .build())
                .build();
    }

    private PlaceDetailDto.AmenityItemDto PlaceAmenityItemDto(String code, String name, String icon, String value, String note) {
        return PlaceDetailDto.AmenityItemDto.builder()
                .code(code)
                .name(name)
                .icon(icon)
                .value(value)
                .note(note)
                .build();
    }

    private List<RoomTypeDetailDto> buildMockRoomList() {
        return List.of(
                RoomTypeDetailDto.builder()
                        .id(1L)
                        .placeId(1L)
                        .name("Phòng riêng Đồi view ruộng bậc thang")
                        .description("Không gian riêng tư đón trọn ánh nắng ban mai và gió thung lũng Tú Lệ mát lành.")
                        .maxOccupancy(2)
                        .totalRoomCount(3)
                        .privateBathroom(AmenityValue.YES)
                        .areaSqm(new BigDecimal("25.0"))
                        .basePrice(new BigDecimal("450000"))
                        .status("ACTIVE")
                        .availableRooms(1)
                        .badgeText("Còn 1 phòng trống")
                        .coverImage("https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80")
                        .bedDescription("1 giường 1m8")
                        .features(List.of("Tối đa 2 người", "Ban công gỗ ngắm thung lũng"))
                        .unitNote("/ đêm")
                        .build(),
                RoomTypeDetailDto.builder()
                        .id(2L)
                        .placeId(1L)
                        .name("Gian ngủ tập thể Nhà Sàn truyền thống")
                        .description("Trải nghiệm ngủ nhà sàn cộng đồng đậm đà bản sắc, thoáng mát mùa hè, ấm áp mùa đông.")
                        .maxOccupancy(12)
                        .totalRoomCount(1)
                        .privateBathroom(AmenityValue.NO)
                        .areaSqm(new BigDecimal("60.0"))
                        .basePrice(new BigDecimal("180000"))
                        .status("ACTIVE")
                        .availableRooms(6)
                        .badgeText("Còn 6 chỗ trống")
                        .coverImage("https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80")
                        .bedDescription("Đệm riêng kèm chăn màn")
                        .features(List.of("Tối đa 12 người", "Vách ngăn rèm riêng tư"))
                        .unitNote("/ người")
                        .build(),
                RoomTypeDetailDto.builder()
                        .id(3L)
                        .placeId(1L)
                        .name("Phòng Gia Đình Gắn Gác")
                        .description("Không gian rộng rãi 2 tầng gác lửng phù hợp cho cả gia đình hoặc nhóm bạn 4 người.")
                        .maxOccupancy(4)
                        .totalRoomCount(2)
                        .privateBathroom(AmenityValue.YES)
                        .areaSqm(new BigDecimal("40.0"))
                        .basePrice(new BigDecimal("750000"))
                        .status("ACTIVE")
                        .availableRooms(0)
                        .badgeText("Hết phòng")
                        .coverImage("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80")
                        .bedDescription("2 giường đôi lớn")
                        .features(List.of("Tối đa 4 người", "Phù hợp cho nhóm gia đình"))
                        .unitNote("/ đêm")
                        .build()
        );
    }
}

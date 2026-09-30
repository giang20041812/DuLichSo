package com.dulichso.bookingapi.config;

import com.dulichso.bookingapi.dto.ChangeRequestDtos.SubmittedDto;
import com.dulichso.bookingapi.dto.admin.AdminReviewDtos.ModerationAction;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.PartnerHomestayDetailDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.BedDto;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.PriceInput;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.RoomInput;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.AuditLog;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.BookingNight;
import com.dulichso.bookingapi.entity.BookingStatusHistory;
import com.dulichso.bookingapi.entity.PaymentGateway;
import com.dulichso.bookingapi.entity.PaymentTransaction;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.Refund;
import com.dulichso.bookingapi.entity.Review;
import com.dulichso.bookingapi.entity.RoomInventoryDay;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.Traveler;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.entity.enums.RefundStatus;
import com.dulichso.bookingapi.entity.enums.RefundType;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import com.dulichso.bookingapi.entity.keys.BookingNightId;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.AdminChangeRequestService;
import com.dulichso.bookingapi.service.AdminProviderApplicationService;
import com.dulichso.bookingapi.service.AdminReviewService;
import com.dulichso.bookingapi.service.NotificationRecorder;
import com.dulichso.bookingapi.service.PartnerChangeService;
import com.dulichso.bookingapi.service.PartnerHomestayService;
import com.dulichso.bookingapi.service.PartnerRoomService;
import com.dulichso.bookingapi.service.RoomCalendarService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Bộ dữ liệu mẫu khoảng 10 bản ghi cho từng chức năng phía Admin: quản trị viên, khách, đối tác NCC, điểm đến (homestay),
 * hồ sơ đăng ký NCC, yêu cầu thay đổi của NCC, đặt phòng (kèm thanh toán / hoàn tiền → dòng tiền, báo cáo), đánh giá,
 * nhật ký hoạt động và thông báo Admin.
 *
 * <p>Mỗi nhóm chạy trong một transaction riêng và chỉ nạp khi chưa có dấu nhận biết của nhóm đó, nên khởi động lại nhiều
 * lần vẫn an toàn và không đụng dữ liệu thật. Dấu nhận biết để tra cứu / xóa: email {@code demo-*@example.test},
 * giấy phép {@code DEMO-NCC-*}, mã đơn {@code VJ-D77*}, IP nhật ký {@code 203.0.113.*}. Mật khẩu mọi tài khoản mẫu:
 * {@value #PASSWORD}. Tắt cùng {@link DemoDataSeeder} bằng APP_SEED_DEMO_DATA=false.
 *
 * <p>Những gì có quy trình nghiệp vụ (tạo homestay/loại phòng, NCC gửi yêu cầu thay đổi, Admin duyệt/từ chối hồ sơ,
 * yêu cầu thay đổi, kiểm duyệt đánh giá) đi qua chính service thật để dữ liệu hợp lệ và thao tác tiếp được trên giao diện.
 */
@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.seed-demo-data", havingValue = "true")
public class AdminDemoDataSeeder implements ApplicationRunner {
    static final String PASSWORD = "Demo@12345";
    private static final String CODE_PREFIX = "VJ-D77";

    private final EntityManager em;
    private final TransactionTemplate tx;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRecorder notifications;
    private final PartnerHomestayService homestays;
    private final PartnerRoomService rooms;
    private final PartnerChangeService partnerChanges;
    private final RoomCalendarService calendar;
    private final AdminChangeRequestService changeReview;
    private final AdminProviderApplicationService applicationReview;
    private final AdminReviewService reviewModeration;

    @Override
    public void run(ApplicationArguments args) {
        step("tài khoản quản trị / khách / NCC", this::seedAccounts);
        step("homestay và loại phòng", this::seedHomestays);
        step("hồ sơ đăng ký NCC", this::seedApplications);
        step("yêu cầu thay đổi của NCC", this::seedChangeRequests);
        step("đặt phòng, thanh toán, hoàn tiền", this::seedBookings);
        step("đánh giá", this::seedReviews);
        step("nhật ký hoạt động", this::seedAuditLogs);
        step("thông báo Admin", this::seedAdminNotifications);
    }

    /** Lỗi ở một nhóm chỉ hủy nhóm đó (rollback) — không làm hỏng việc khởi động và không chặn các nhóm khác. */
    private void step(String name, Runnable body) {
        try {
            tx.executeWithoutResult(status -> body.run());
        } catch (RuntimeException ex) {
            log.warn("Không nạp được dữ liệu mẫu Admin ({}): {}", name, ex.getMessage());
        }
    }

    // ───────────────────────────── 1. Tài khoản ─────────────────────────────

    private static final String[][] ADMINS = {
            {"Nguyễn Thị Thu Hà", "1"}, {"Trần Minh Quân", "2"}, {"Lê Hoàng Yến", "2"}, {"Phạm Đức Anh", "2"},
            {"Vũ Thị Ngọc Mai", "3"}, {"Đỗ Quang Huy", "3"}, {"Bùi Thanh Tâm", "3"}, {"Hoàng Gia Bảo", "3"},
            {"Ngô Thị Kim Oanh", "3"}, {"Đinh Văn Toàn", "2"}};

    private static final String[] TRAVELERS = {
            "Nguyễn Minh Anh", "Trần Thị Bích Ngọc", "Lê Văn Khánh", "Phạm Thị Hồng Nhung", "Hoàng Đức Thịnh",
            "Vũ Thị Lan Hương", "Đặng Quốc Việt", "Bùi Thị Thảo", "Ngô Minh Tuấn", "Đỗ Thị Phương Linh"};

    /** Tên NCC, người liên hệ, địa chỉ, tên homestay, mô tả homestay. */
    private static final String[][] PROVIDERS = {
            {"Hợp tác xã Du lịch La Pán Tẩn", "Giàng A Dế", "Xã La Pán Tẩn, Mù Cang Chải, Yên Bái",
                    "Homestay Đồi Mâm Xôi", "Nhà gỗ 6 phòng ngay đồi Mâm Xôi, ngắm ruộng bậc thang mùa lúa chín từ ban công."},
            {"Nhà sàn Chế Cu Nha", "Sùng Thị Mỷ", "Xã Chế Cu Nha, Mù Cang Chải, Yên Bái",
                    "Nhà sàn Chế Cu Nha", "Nhà sàn truyền thống người Mông, bữa tối cơm lam gà đồi, có lớp thêu thổ cẩm."},
            {"Mây Homestay Dế Xu Phình", "Lý Văn Páo", "Xã Dế Xu Phình, Mù Cang Chải, Yên Bái",
                    "Mây Homestay", "Homestay trên đỉnh đèo, săn mây buổi sáng, phòng kính nhìn thẳng thung lũng."},
            {"Du lịch cộng đồng Nậm Khắt", "Hờ A Chua", "Xã Nậm Khắt, Mù Cang Chải, Yên Bái",
                    "Bungalow Suối Nậm Khắt", "Bungalow cạnh suối, có khu tắm lá thuốc và tour trekking bản Mông."},
            {"Công ty Tây Bắc Trails", "Nguyễn Hải Nam", "Thị trấn Mù Cang Chải, Yên Bái",
                    "Tây Bắc Trails Lodge", "Lodge 8 phòng tiện nghi, đưa đón xe máy trải nghiệm đèo Khau Phạ."},
            {"Homestay Tú Lệ Xanh", "Lò Thị Hoa", "Xã Tú Lệ, Văn Chấn, Yên Bái",
                    "Tú Lệ Xanh", "Nhà sàn người Thái giữa cánh đồng Tú Lệ, nổi tiếng cốm mới và suối khoáng nóng."},
            {"Suối Giàng Chè Cổ", "Vàng A Sình", "Xã Suối Giàng, Văn Chấn, Yên Bái",
                    "Suối Giàng Tea House", "Nhà gỗ giữa đồi chè Shan tuyết cổ thụ, trải nghiệm hái và sao chè."},
            {"Khau Phạ Camping", "Trần Đức Lộc", "Đèo Khau Phạ, Mù Cang Chải, Yên Bái",
                    "Khau Phạ Camping", "Khu lều cắm trại và nhà chòi dưới chân đèo, xem dù lượn mùa thu."},
            {"Nhà nghỉ Sơn Thủy", "Phạm Văn Sơn", "Xã Cao Phạ, Mù Cang Chải, Yên Bái",
                    "Nhà nghỉ Sơn Thủy", "Nhà nghỉ 5 phòng giá mềm cạnh quốc lộ 32, phù hợp khách đi phượt."},
            {"Homestay Púng Luông", "Mùa A Tủa", "Xã Púng Luông, Mù Cang Chải, Yên Bái",
                    "Púng Luông Hill", "Nhà gỗ nhỏ trên sườn đồi Púng Luông, view ruộng bậc thang hình móng ngựa."}};

    private void seedAccounts() {
        if (count("select count(a) from Account a where a.email = ?1", "demo-admin01@example.test") > 0) return;
        String hash = passwordEncoder.encode(PASSWORD);
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < ADMINS.length; i++) {
            boolean locked = i >= 8;
            em.persist(Account.builder().email(demoEmail("admin", i)).phone(String.format("09110001%02d", i + 1)).passwordHash(hash)
                    .role(AccountRole.ADMIN).adminLevel(Integer.parseInt(ADMINS[i][1])).fullName(ADMINS[i][0])
                    .status(locked ? AccountStatus.INACTIVE : AccountStatus.ACTIVE)
                    .lastLoginAt(locked ? now.minusDays(40L + i) : now.minusHours(2L + 5L * i))
                    .createdAt(now.minusDays(120L - 9L * i)).build());
        }
        for (int i = 0; i < TRAVELERS.length; i++) {
            // Cứ 4 khách có 1 khách đăng ký bằng Google (chưa đặt mật khẩu) để bộ lọc "Đăng ký bằng" có dữ liệu.
            boolean google = i % 4 == 3;
            em.persist(Traveler.builder().email(demoEmail("khach", i)).phone(String.format("09120001%02d", i + 1))
                    .passwordHash(google ? null : hash).fullName(TRAVELERS[i])
                    .status(i >= 8 ? AccountStatus.INACTIVE : AccountStatus.ACTIVE)
                    .lastLoginAt(i == 7 ? null : now.minusDays(i).minusHours(3))
                    .createdAt(now.minusDays(75L - 7L * i)).build());
        }
        for (int i = 0; i < PROVIDERS.length; i++) {
            String phone = String.format("09130001%02d", i + 1);
            String email = demoEmail("ncc", i);
            LocalDateTime created = now.minusDays(200L - 15L * i);
            Provider provider = Provider.builder().name(PROVIDERS[i][0]).contactName(PROVIDERS[i][1]).contactPhone(phone)
                    .contactEmail(email).address(PROVIDERS[i][2]).note("Dữ liệu mẫu cho màn quản trị.")
                    .createdAt(created).updatedAt(created).build();
            em.persist(provider);
            em.persist(Account.builder().email(email).phone(phone).passwordHash(hash).role(AccountRole.PROVIDER).provider(provider)
                    .fullName(PROVIDERS[i][1]).lastLoginAt(now.minusDays(i).minusHours(1)).createdAt(created).build());
        }
        log.info("Đã nạp dữ liệu mẫu Admin: {} quản trị viên, {} khách, {} NCC (mật khẩu {})",
                ADMINS.length, TRAVELERS.length, PROVIDERS.length, PASSWORD);
    }

    // ───────────────────────────── 2. Homestay ─────────────────────────────

    /** Trạng thái hiển thị / kiểm duyệt của 10 homestay (đủ các tab của màn Điểm đến). */
    private static final PlaceVisibility[] VISIBILITY = {
            PlaceVisibility.PUBLISHED, PlaceVisibility.PUBLISHED, PlaceVisibility.PUBLISHED, PlaceVisibility.PUBLISHED,
            PlaceVisibility.PUBLISHED, PlaceVisibility.PUBLISHED, PlaceVisibility.DRAFT, PlaceVisibility.DRAFT,
            PlaceVisibility.PUBLISHED, PlaceVisibility.DRAFT};
    private static final PlaceVerificationStatus[] VERIFICATION = {
            PlaceVerificationStatus.VERIFIED, PlaceVerificationStatus.VERIFIED, PlaceVerificationStatus.VERIFIED,
            PlaceVerificationStatus.VERIFIED, PlaceVerificationStatus.VERIFIED, PlaceVerificationStatus.UNVERIFIED,
            PlaceVerificationStatus.UNVERIFIED, PlaceVerificationStatus.NEEDS_UPDATE, PlaceVerificationStatus.VERIFIED,
            PlaceVerificationStatus.ARCHIVED};

    private void seedHomestays() {
        List<Account> owners = demoProviderAccounts();
        if (owners.size() < PROVIDERS.length) return;
        if (count("select count(p) from Place p where p.provider.id = ?1", owners.get(0).getProvider().getId()) > 0) return;
        List<Long> regionIds = em.createQuery("select r.id from Region r where r.level = 3 and r.isActive = true order by r.id", Long.class)
                .setMaxResults(PROVIDERS.length).getResultList();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < PROVIDERS.length; i++) {
            Account owner = owners.get(i);
            UserPrincipal principal = principal(owner);
            PartnerHomestayDetailDto dto = PartnerHomestayDetailDto.builder()
                    .name(PROVIDERS[i][3]).description(PROVIDERS[i][4]).address(PROVIDERS[i][2])
                    .contactPhone(owner.getPhone()).contactEmail(owner.getEmail())
                    .regionId(regionIds.isEmpty() ? null : regionIds.get(i % regionIds.size()))
                    .latitude(21.80 + i * 0.012).longitude(104.05 + i * 0.015)
                    .accessNote("Từ thị trấn đi xe máy khoảng " + (10 + i * 3) + " phút, có chỗ để xe.")
                    .amenities(List.of()).checkInFrom("14:00").checkOutUntil("12:00")
                    .processingStartTime("07:00").processingEndTime("22:00")
                    .houseRules("Giữ yên lặng sau 22:00. Không hút thuốc trong phòng.")
                    .childrenPolicy("Trẻ dưới 6 tuổi ở miễn phí khi dùng chung giường với bố mẹ.")
                    .build();
            Long placeId = homestays.createHomestay(principal, dto).getId();
            BigDecimal base = BigDecimal.valueOf(450_000L + 50_000L * i);
            rooms.save(principal, placeId, null, room("Phòng đôi view ruộng", "Phòng đôi có ban công nhìn ruộng bậc thang.",
                    2, 4, base, base.add(BigDecimal.valueOf(100_000))));
            rooms.save(principal, placeId, null, room("Phòng gia đình", "Phòng rộng cho gia đình 4 người, có gác lửng.",
                    4, 2, base.add(BigDecimal.valueOf(300_000)), base.add(BigDecimal.valueOf(450_000))));

            Place place = em.find(Place.class, placeId);
            place.setVisibility(VISIBILITY[i]);
            place.setVerification(VERIFICATION[i]);
            if (VERIFICATION[i] == PlaceVerificationStatus.VERIFIED) place.setLastVerifiedAt(LocalDate.now().minusDays(3L * i + 1));
            em.flush();
            em.createNativeQuery("update place set created_at = ?1 where id = ?2")
                    .setParameter(1, now.minusDays(180L - 14L * i)).setParameter(2, placeId).executeUpdate();
        }
        // NCC 9 tạm ngưng, NCC 10 chấm dứt hợp tác (khóa luôn tài khoản) để màn Đối tác có đủ trạng thái.
        owners.get(8).getProvider().setStatus(ProviderStatus.SUSPENDED);
        owners.get(9).getProvider().setStatus(ProviderStatus.TERMINATED);
        owners.get(9).setStatus(AccountStatus.INACTIVE);
        log.info("Đã nạp dữ liệu mẫu Admin: {} homestay (mỗi homestay 2 loại phòng)", PROVIDERS.length);
    }

    private static RoomInput room(String name, String description, int guests, int total, BigDecimal base, BigDecimal weekend) {
        return new RoomInput(name, description, guests, total, AmenityValue.YES, BigDecimal.valueOf(18L + guests * 6L), base, weekend,
                "ACTIVE", "Ruộng bậc thang", List.of(new BedDto("Giường đôi", guests > 2 ? 2 : 1)), List.of());
    }

    // ───────────────────────────── 3. Hồ sơ đăng ký NCC ─────────────────────────────

    private static final String[][] APPLICATIONS = {
            {"Homestay Lúa Vàng Tú Lệ", "Lò Văn Thắng", "Bản Nà Làng, Xã Tú Lệ, Văn Chấn, Yên Bái", "Nhà sàn 6 phòng, bếp củi, dịch vụ đón khách tại bến xe Nghĩa Lộ."},
            {"Nhà gỗ Mường Lò", "Hà Thị Duyên", "Phường Pú Trạng, Thị xã Nghĩa Lộ, Yên Bái", "Nhà gỗ 4 phòng cạnh cánh đồng Mường Lò, có biểu diễn xòe Thái."},
            {"Làng Mông Sáng Nhù", "Giàng A Thào", "Xã Sáng Nhù, Mù Cang Chải, Yên Bái", "Du lịch cộng đồng 8 hộ, trải nghiệm làm nông cùng người Mông."},
            {"Eco Farm Cát Thịnh", "Nguyễn Văn Đạt", "Xã Cát Thịnh, Văn Chấn, Yên Bái", "Trang trại sinh thái 5 bungalow, có vườn bưởi và hồ câu."},
            {"Thác Bạc Riverside", "Trần Thị Thu", "Xã Suối Bu, Văn Chấn, Yên Bái", "Homestay cạnh thác, phòng dorm và phòng riêng cho khách trẻ."},
            {"Nhà nghỉ Đèo Khau Phạ", "Sùng A Lử", "Xã Cao Phạ, Mù Cang Chải, Yên Bái", "Nhà nghỉ 6 phòng dưới chân đèo."},
            {"Mùa Vàng Homestay", "Vàng Thị Dua", "Xã Lao Chải, Mù Cang Chải, Yên Bái", "Homestay 3 phòng mở theo mùa lúa chín."},
            {"Chill Hill Hồ Thác Bà", "Phạm Minh Châu", "Xã Tân Hương, Yên Bình, Yên Bái", "Villa nhỏ ven hồ Thác Bà, thuyền kayak."},
            {"Bản Lướt Stay", "Lò Thị Ón", "Xã Nậm Có, Mù Cang Chải, Yên Bái", "Nhà sàn 4 phòng, đang hoàn thiện giấy phép."},
            {"Nhà trọ Phố Núi", "Đặng Văn Hòa", "Thị trấn Mù Cang Chải, Yên Bái", "Nhà trọ 10 phòng giá rẻ cho khách đi phượt."}};

    private void seedApplications() {
        if (count("select count(a) from ProviderApplication a where a.businessLicenseNo like ?1", "DEMO-NCC-%") > 0) return;
        Account admin = demoAdmin();
        String hash = passwordEncoder.encode(PASSWORD);
        LocalDateTime now = LocalDateTime.now();
        List<ProviderApplication> created = new ArrayList<>();
        for (int i = 0; i < APPLICATIONS.length; i++) {
            ProviderApplication application = ProviderApplication.builder().businessName(APPLICATIONS[i][0]).contactName(APPLICATIONS[i][1])
                    .contactPhone(String.format("09140001%02d", i + 1)).contactEmail(i == 6 ? null : demoEmail("hoso", i))
                    .address(APPLICATIONS[i][2]).businessLicenseNo(String.format("DEMO-NCC-%04d", i + 1)).description(APPLICATIONS[i][3])
                    .passwordHash(hash).status(ProviderApplicationStatus.PENDING).createdAt(now.minusHours(4L + 11L * i)).build();
            em.persist(application);
            created.add(application);
        }
        em.flush();
        if (admin != null) {
            // 1 đã duyệt (tạo đối tác + tài khoản thật), 3 đã từ chối; còn lại chờ duyệt.
            applicationReview.approve(created.get(7).getId(), admin.getId(), "Hồ sơ đầy đủ, đã xác minh giấy phép qua điện thoại.");
            applicationReview.reject(created.get(8).getId(), admin.getId(), "Giấy phép kinh doanh đang chờ cấp, vui lòng gửi lại khi đã có giấy phép.");
            applicationReview.reject(created.get(9).getId(), admin.getId(), "Loại hình nhà trọ không thuộc phạm vi homestay du lịch cộng đồng.");
            applicationReview.reject(created.get(5).getId(), admin.getId(), "Ảnh chụp giấy tờ bị mờ, không đọc được số đăng ký.");
        }
        log.info("Đã nạp dữ liệu mẫu Admin: {} hồ sơ đăng ký NCC", created.size());
    }

    // ───────────────────────────── 4. Yêu cầu thay đổi của NCC ─────────────────────────────

    private void seedChangeRequests() {
        List<Account> owners = demoProviderAccounts();
        if (owners.size() < PROVIDERS.length) return;
        if (count("select count(r) from PartnerChangeRequest r where r.submittedBy.email like ?1", "demo-ncc%@example.test") > 0) return;
        List<Place> places = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Place place = placeOf(owners.get(i));
            if (place == null || place.getVisibility() != PlaceVisibility.PUBLISHED) return;
            places.add(place);
        }
        LocalDate today = LocalDate.now();
        List<Long> ids = new ArrayList<>();
        // Sửa loại phòng đang bán (giá, mô tả, số phòng) — Homestay đã công khai nên đều phải chờ Admin duyệt.
        ids.add(updateRoom(owners.get(0), places.get(0), 0, 50_000, 0, null));
        ids.add(updateRoom(owners.get(1), places.get(1), 0, 0, 0, "Phòng đôi mới sơn lại, thêm máy sưởi cho mùa đông."));
        ids.add(updateRoom(owners.get(2), places.get(2), 0, 0, 2, null));
        ids.add(updateRoom(owners.get(3), places.get(3), 1, -80_000, 0, null));
        // Thêm loại phòng mới.
        ids.add(submitted(partnerChanges.saveRoom(principal(owners.get(0)), places.get(0).getId(), null,
                room("Phòng tập thể 6 người", "Phòng dorm cho nhóm bạn, nệm trải sàn.", 6, 1,
                        BigDecimal.valueOf(900_000), BigDecimal.valueOf(1_100_000))).pending()));
        ids.add(submitted(partnerChanges.saveRoom(principal(owners.get(4)), places.get(4).getId(), null,
                room("Lều cắm trại view đồi", "Lều glamping có nệm, dùng nhà vệ sinh chung.", 2, 3,
                        BigDecimal.valueOf(350_000), BigDecimal.valueOf(450_000))).pending()));
        // Bảng giá theo mùa.
        ids.add(submitted(partnerChanges.savePrice(principal(owners.get(1)), places.get(1).getId(), roomsOf(places.get(1)).get(1).getId(), null,
                new PriceInput("Giá mùa lúa chín", today.plusDays(10), today.plusDays(40), BigDecimal.valueOf(1_200_000))).pending()));
        ids.add(submitted(partnerChanges.savePrice(principal(owners.get(2)), places.get(2).getId(), roomsOf(places.get(2)).get(1).getId(), null,
                new PriceInput("Giá Tết Nguyên đán", today.plusDays(120), today.plusDays(130), BigDecimal.valueOf(1_500_000))).pending()));
        // Chuyển NCC quản lý homestay.
        ids.add(submitted(partnerChanges.requestTransfer(principal(owners.get(3)), places.get(3).getId(), owners.get(5).getProvider().getId())));
        ids.add(submitted(partnerChanges.requestTransfer(principal(owners.get(4)), places.get(4).getId(), owners.get(6).getProvider().getId())));
        em.flush();

        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < ids.size(); i++) {
            em.createQuery("update PartnerChangeRequest r set r.submittedAt = ?1 where r.id = ?2")
                    .setParameter(1, now.minusHours(3L + 7L * i)).setParameter(2, ids.get(i)).executeUpdate();
        }
        em.clear();
        Account admin = demoAdmin();
        if (admin != null) {
            // 2 đã duyệt (áp dụng vào dữ liệu thật), 2 đã từ chối; còn 6 yêu cầu chờ duyệt.
            changeReview.approve(ids.get(2), admin.getId(), "Đồng ý tăng số phòng sau khi NCC gửi ảnh phòng mới.");
            changeReview.approve(ids.get(6), admin.getId(), null);
            changeReview.reject(ids.get(4), admin.getId(), "Phòng tập thể chưa có ảnh thực tế và chưa đạt yêu cầu PCCC.");
            changeReview.reject(ids.get(9), admin.getId(), "NCC nhận chuyển chưa xác nhận đồng ý quản lý homestay này.");
        }
        log.info("Đã nạp dữ liệu mẫu Admin: {} yêu cầu thay đổi của NCC", ids.size());
    }

    private Long updateRoom(Account owner, Place place, int roomIndex, long priceDelta, int extraRooms, String description) {
        RoomType current = roomsOf(place).get(roomIndex);
        BigDecimal base = current.getBasePrice().add(BigDecimal.valueOf(priceDelta));
        BigDecimal weekend = current.getWeekendPrice() == null ? null : current.getWeekendPrice().add(BigDecimal.valueOf(priceDelta));
        RoomInput input = new RoomInput(current.getName(), description != null ? description : current.getDescription(),
                current.getMaxOccupancy(), current.getTotalRoomCount() + extraRooms, current.getPrivateBathroom(), current.getAreaSqm(),
                base, weekend, current.getStatus(), current.getViewDescription(),
                List.of(new BedDto("Giường đôi", current.getMaxOccupancy() > 2 ? 2 : 1)), List.of());
        return submitted(partnerChanges.saveRoom(principal(owner), place.getId(), current.getId(), input).pending());
    }

    private static Long submitted(SubmittedDto dto) {
        if (dto == null) throw new IllegalStateException("Thao tác đã ghi trực tiếp thay vì tạo yêu cầu chờ duyệt.");
        return dto.changeRequestId();
    }

    // ───────────────────────────── 5. Đặt phòng ─────────────────────────────

    /** Homestay (chỉ số 0..5), loại phòng, trạng thái, ngày nhận phòng so với hôm nay, số đêm. */
    private record BookingSpec(int place, int room, BookingStatus status, int checkInOffset, int nights) {}

    private static final List<BookingSpec> BOOKINGS = List.of(
            new BookingSpec(0, 0, BookingStatus.COMPLETED, -150, 2),
            new BookingSpec(1, 0, BookingStatus.COMPLETED, -122, 1),
            new BookingSpec(2, 1, BookingStatus.COMPLETED, -96, 3),
            new BookingSpec(3, 0, BookingStatus.COMPLETED, -71, 2),
            new BookingSpec(4, 0, BookingStatus.COMPLETED, -52, 2),
            new BookingSpec(5, 1, BookingStatus.COMPLETED, -37, 1),
            new BookingSpec(0, 1, BookingStatus.COMPLETED, -26, 2),
            new BookingSpec(1, 1, BookingStatus.COMPLETED, -19, 3),
            new BookingSpec(2, 0, BookingStatus.COMPLETED, -13, 1),
            new BookingSpec(3, 1, BookingStatus.COMPLETED, -7, 2),
            new BookingSpec(4, 1, BookingStatus.CHECKED_OUT, -3, 2),
            new BookingSpec(5, 0, BookingStatus.NO_SHOW, -9, 2),
            new BookingSpec(0, 0, BookingStatus.CHECKED_IN, -1, 3),
            new BookingSpec(1, 0, BookingStatus.CONFIRMED, 7, 2),
            new BookingSpec(2, 0, BookingStatus.CONFIRMED, 20, 3),
            new BookingSpec(3, 0, BookingStatus.AWAITING_PAYMENT, 12, 2),
            new BookingSpec(4, 0, BookingStatus.PENDING, 15, 1),
            new BookingSpec(5, 0, BookingStatus.PENDING, 30, 2),
            new BookingSpec(0, 1, BookingStatus.CANCELLED, 25, 2),
            new BookingSpec(1, 1, BookingStatus.CANCELLED, 40, 2),
            new BookingSpec(2, 1, BookingStatus.REJECTED, 18, 2));

    private static final String[] WALK_IN = {"Trịnh Văn Long", "Mai Thị Hạnh", "Lương Quốc Cường", "Tạ Thị Yến",
            "Kiều Minh Đức", "Châu Thị Mỹ", "Quách Văn Tài", "La Thị Hằng", "Âu Dương Phong", "Tăng Thị Quế", "Mạc Văn Khôi"};

    private void seedBookings() {
        if (count("select count(b) from Booking b where b.bookingCode like ?1", CODE_PREFIX + "%") > 0) return;
        List<Account> owners = demoProviderAccounts();
        if (owners.size() < PROVIDERS.length) return;
        List<Place> places = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            Place place = placeOf(owners.get(i));
            if (place == null) return;
            places.add(place);
        }
        List<Traveler> travelers = em.createQuery("select t from Traveler t where t.email like ?1 order by t.email", Traveler.class)
                .setParameter(1, "demo-khach%@example.test").getResultList();
        PaymentGateway gateway = gateway();
        Account admin = demoAdmin();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < BOOKINGS.size(); i++) {
            BookingSpec spec = BOOKINGS.get(i);
            Place place = places.get(spec.place());
            RoomType room = em.find(RoomType.class, roomsOf(place).get(spec.room()).getId(), LockModeType.PESSIMISTIC_WRITE);
            LocalDate checkIn = today.plusDays(spec.checkInOffset());
            LocalDate checkOut = checkIn.plusDays(spec.nights());
            BigDecimal unit = room.getBasePrice();
            BookingStatus status = spec.status();
            boolean future = spec.checkInOffset() > 0;
            LocalDateTime createdAt = status == BookingStatus.PENDING ? now.minusMinutes(20L + 25L * i)
                    : future ? now.minusDays(1L + i % 5).minusHours(i)
                    : checkIn.minusDays(4L + i % 6).atTime(9 + i % 10, 15);

            String guestName;
            String guestPhone;
            String guestEmail;
            if (i < travelers.size() * 2 && i % 2 == 0 && !travelers.isEmpty()) {
                Traveler t = travelers.get((i / 2) % travelers.size());
                guestName = t.getFullName();
                guestPhone = t.getPhone();
                guestEmail = t.getEmail();
            } else {
                guestName = WALK_IN[i % WALK_IN.length];
                guestPhone = String.format("09150002%02d", i + 1);
                guestEmail = null;
            }

            Booking booking = Booking.builder().bookingCode(String.format("%s%03d", CODE_PREFIX, i + 1)).place(place).roomType(room)
                    .provider(place.getProvider()).checkIn(checkIn).checkOut(checkOut).roomCount(1).guestCount(Math.min(2, room.getMaxOccupancy()))
                    .guestName(guestName).guestPhone(guestPhone).guestEmail(guestEmail)
                    .guestNote(i % 3 == 0 ? "Cho mình nhận phòng sớm nếu được, cảm ơn chủ nhà." : null)
                    .status(status).totalAmount(unit.multiply(BigDecimal.valueOf(spec.nights()))).policySnapshot(new HashMap<>())
                    .createdAt(createdAt).build();

            boolean paid = status != BookingStatus.PENDING && status != BookingStatus.AWAITING_PAYMENT && status != BookingStatus.REJECTED;
            LocalDateTime confirmedAt = createdAt.plusHours(2);
            if (paid) booking.setConfirmedAt(confirmedAt);
            switch (status) {
                case PENDING -> booking.setHoldExpiresAt(createdAt.plusHours(2));
                case AWAITING_PAYMENT -> booking.setPaymentDeadlineAt(now.plusHours(1));
                case COMPLETED, CHECKED_OUT -> close(booking, checkOut.atTime(12, 0), null, ActorType.PROVIDER);
                case NO_SHOW -> close(booking, checkIn.plusDays(1).atTime(9, 0), "Khách không đến nhận phòng, không liên lạc được.", ActorType.PROVIDER);
                case CANCELLED -> close(booking, createdAt.plusDays(1), "Khách đổi kế hoạch chuyến đi, hủy trước hạn hủy miễn phí.", ActorType.CUSTOMER);
                case REJECTED -> close(booking, createdAt.plusHours(1), "Homestay tạm ngưng đón khách để sửa chữa mái nhà.", ActorType.PROVIDER);
                default -> { }
            }
            em.persist(booking);
            em.flush();

            for (int n = 0; n < spec.nights(); n++) {
                LocalDate night = checkIn.plusDays(n);
                em.persist(BookingNight.builder().id(new BookingNightId(booking.getId(), night)).booking(booking)
                        .unitPrice(unit).roomCount(1).build());
                holdInventory(room, night, status);
            }
            history(booking, status, createdAt);

            if (paid) {
                PaymentTransaction payment = PaymentTransaction.builder().booking(booking).gateway(gateway)
                        .externalTxnId("DEMO77-TXN-" + booking.getBookingCode()).amount(booking.getTotalAmount())
                        .status(PaymentStatus.SUCCESS).initiatedAt(confirmedAt.minusMinutes(5)).paidAt(confirmedAt).build();
                em.persist(payment);
                if (status == BookingStatus.CANCELLED) {
                    boolean processed = spec.checkInOffset() < 30;
                    em.persist(Refund.builder().booking(booking).paymentTransaction(payment).refundType(RefundType.FULL_REFUND)
                            .amount(booking.getTotalAmount()).reason("Khách hủy trước hạn hủy miễn phí, hoàn toàn bộ tiền phòng.")
                            .status(processed ? RefundStatus.PROCESSED : RefundStatus.PENDING)
                            .requestedAt(booking.getClosedAt()).processedAt(processed ? booking.getClosedAt().plusHours(3) : null)
                            .processedBy(processed ? admin : null).build());
                }
            }
        }
        log.info("Đã nạp dữ liệu mẫu Admin: {} đơn đặt phòng (kèm thanh toán, hoàn tiền)", BOOKINGS.size());
    }

    private static void close(Booking booking, LocalDateTime at, String reason, ActorType actor) {
        booking.setClosedAt(at);
        booking.setCloseReason(reason);
        booking.setClosedByActor(actor);
    }

    /** Đơn còn hiệu lực chiếm phòng trên lịch như đơn thật: chờ xử lý / chờ thanh toán giữ phòng, đã xác nhận / đang ở trừ phòng. */
    private void holdInventory(RoomType room, LocalDate night, BookingStatus status) {
        boolean held = status == BookingStatus.PENDING || status == BookingStatus.AWAITING_PAYMENT;
        boolean confirmed = status == BookingStatus.CONFIRMED || status == BookingStatus.CHECKED_IN;
        if (!held && !confirmed) return;
        RoomInventoryDay day = calendar.lockedDay(room, night);
        if (day.getHeldRooms() + day.getConfirmedRooms() + 1 > day.getTotalRooms()) {
            throw new IllegalStateException("Hết phòng trống cho đơn mẫu ngày " + night);
        }
        if (held) day.setHeldRooms(day.getHeldRooms() + 1);
        else day.setConfirmedRooms(day.getConfirmedRooms() + 1);
        day.setUpdatedAt(LocalDateTime.now());
    }

    /** Lịch sử trạng thái theo đúng luồng: chờ xử lý → chờ thanh toán → đã xác nhận → đã nhận phòng → đã trả phòng → hoàn tất. */
    private void history(Booking booking, BookingStatus target, LocalDateTime createdAt) {
        List<BookingStatus> path = switch (target) {
            case PENDING -> List.of(BookingStatus.PENDING);
            case REJECTED -> List.of(BookingStatus.PENDING, BookingStatus.REJECTED);
            case AWAITING_PAYMENT -> List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT);
            case CONFIRMED -> List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED);
            case CANCELLED -> List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.CANCELLED);
            case NO_SHOW -> List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.NO_SHOW);
            case CHECKED_IN -> List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN);
            case CHECKED_OUT -> List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED,
                    BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT);
            default -> List.of(BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED,
                    BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT, BookingStatus.COMPLETED);
        };
        BookingStatus from = null;
        for (int i = 0; i < path.size(); i++) {
            BookingStatus to = path.get(i);
            LocalDateTime at = switch (to) {
                case PENDING -> createdAt;
                case AWAITING_PAYMENT, REJECTED -> createdAt.plusHours(1);
                case CONFIRMED -> createdAt.plusHours(2);
                case CHECKED_IN -> booking.getCheckIn().atTime(14, 30);
                case CHECKED_OUT -> booking.getCheckOut().atTime(11, 0);
                default -> booking.getClosedAt() != null ? booking.getClosedAt() : createdAt.plusHours(3);
            };
            ActorType actor = switch (to) {
                case PENDING -> ActorType.CUSTOMER;
                case CONFIRMED -> ActorType.SYSTEM;
                case CANCELLED -> ActorType.CUSTOMER;
                default -> ActorType.PROVIDER;
            };
            String reason = i == path.size() - 1 && booking.getCloseReason() != null ? booking.getCloseReason() : null;
            em.persist(BookingStatusHistory.builder().booking(booking).fromStatus(from).toStatus(to).actor(actor)
                    .reason(reason).createdAt(at).build());
            from = to;
        }
    }

    private PaymentGateway gateway() {
        return em.createQuery("select g from PaymentGateway g order by g.id", PaymentGateway.class).setMaxResults(1)
                .getResultStream().findFirst().orElseGet(() -> {
                    PaymentGateway created = PaymentGateway.builder().code("SEPAY_DEMO").name("SePay (Demo)").isActive(true).build();
                    em.persist(created);
                    return created;
                });
    }

    // ───────────────────────────── 6. Đánh giá ─────────────────────────────

    private static final String[] REVIEW_CONTENT = {
            "Chủ nhà nhiệt tình, phòng sạch sẽ, view ruộng bậc thang tuyệt đẹp lúc bình minh. Sẽ quay lại!",
            "Chủ nhà nói năng thô lỗ, đồ ăn như cho lợn ăn. Đúng là lừa đảo, mọi người tránh xa!",
            "Liên hệ zalo 09xx để được giảm 50% khi đặt ngoài app, rẻ hơn nhiều!!! Giảm giá sốc!!!",
            "Phòng hơi nhỏ nhưng ấm, bữa tối cơm lam gà đồi rất ngon. Đường vào hơi khó đi khi trời mưa.",
            "Phòng bẩn, nhân viên vô trách nhiệm, dịch vụ như rác. Không bao giờ quay lại cái chỗ tồi tệ này.",
            "Trải nghiệm hái chè và sao chè cùng gia đình chủ nhà rất thú vị. Giá hợp lý.",
            "Mùa lúa chín đẹp như tranh, chủ nhà còn chở ra điểm ngắm hoàng hôn. 10 điểm!",
            "Nước nóng lúc có lúc không, buổi tối hơi lạnh. Bù lại cảnh đẹp và chủ nhà dễ thương.",
            "Vị trí thuận tiện, gần chợ phiên. Wifi yếu nhưng chấp nhận được ở vùng núi.",
            "Homestay đúng như ảnh, sạch và yên tĩnh. Bé nhà mình rất thích chơi với đàn gà của chủ nhà."};
    private static final int[] REVIEW_RATING = {5, 1, 3, 4, 1, 5, 5, 3, 4, 5};

    private void seedReviews() {
        List<Booking> completed = em.createQuery("select b from Booking b join fetch b.place where b.bookingCode like ?1 "
                        + "and b.status = ?2 and not exists (select 1 from Review r where r.booking = b) order by b.checkIn", Booking.class)
                .setParameter(1, CODE_PREFIX + "%").setParameter(2, BookingStatus.COMPLETED).getResultList();
        if (completed.isEmpty() || count("select count(r) from Review r where r.booking.bookingCode like ?1", CODE_PREFIX + "%") > 0) return;
        List<Review> created = new ArrayList<>();
        for (int i = 0; i < completed.size() && i < REVIEW_CONTENT.length; i++) {
            Booking booking = completed.get(i);
            LocalDateTime at = booking.getClosedAt().plusDays(1);
            Review review = Review.builder().place(booking.getPlace()).booking(booking).rating((byte) REVIEW_RATING[i])
                    .content(REVIEW_CONTENT[i]).status(ReviewStatus.VISIBLE).editableUntil(at.plusDays(7))
                    .createdAt(at).updatedAt(at).build();
            if (i == 5) {
                review.setProviderReply("Cảm ơn anh chị đã ghé thăm, hẹn gặp lại mùa chè xuân!");
                review.setProviderReplyAt(at.plusHours(6));
            }
            em.persist(review);
            created.add(review);
        }
        em.flush();
        Account admin = demoAdmin();
        if (admin != null && created.size() >= 6) {
            // 5 đánh giá đã xử lý (giữ nguyên / ẩn / gỡ), còn lại chờ kiểm duyệt.
            reviewModeration.moderate(created.get(0).getId(), admin.getId(), ModerationAction.KEEP, null);
            reviewModeration.moderate(created.get(1).getId(), admin.getId(), ModerationAction.HIDE, "Ngôn từ xúc phạm chủ nhà, ẩn chờ xác minh.");
            reviewModeration.moderate(created.get(2).getId(), admin.getId(), ModerationAction.REMOVE, "Nội dung quảng cáo, kéo khách giao dịch ngoài nền tảng.");
            reviewModeration.moderate(created.get(3).getId(), admin.getId(), ModerationAction.KEEP, null);
            reviewModeration.moderate(created.get(4).getId(), admin.getId(), ModerationAction.HIDE, "Ngôn từ thiếu chuẩn mực, đã đề nghị khách viết lại.");
        }
        em.flush();
        // Cập nhật điểm trung bình hiển thị trên thẻ homestay theo các đánh giá đang công khai.
        for (Place place : created.stream().map(Review::getPlace).distinct().toList()) {
            Object[] agg = em.createQuery("select avg(r.rating), count(r) from Review r where r.place.id = ?1 and r.status = ?2", Object[].class)
                    .setParameter(1, place.getId()).setParameter(2, ReviewStatus.VISIBLE).getSingleResult();
            Place managed = em.find(Place.class, place.getId());
            managed.setRatingCount(((Number) agg[1]).intValue());
            managed.setRatingAvg(agg[0] == null ? null : BigDecimal.valueOf(((Number) agg[0]).doubleValue()).setScale(2, java.math.RoundingMode.HALF_UP));
        }
        log.info("Đã nạp dữ liệu mẫu Admin: {} đánh giá", created.size());
    }

    // ───────────────────────────── 7. Nhật ký hoạt động ─────────────────────────────

    private void seedAuditLogs() {
        if (count("select count(l) from AuditLog l where l.ip like ?1", "203.0.113.%") > 0) return;
        List<Account> admins = em.createQuery("select a from Account a where a.email like ?1 order by a.email", Account.class)
                .setParameter(1, "demo-admin%@example.test").getResultList();
        if (admins.size() < ADMINS.length) return;
        List<Account> owners = demoProviderAccounts();
        Traveler lockedTraveler = em.createQuery("select t from Traveler t where t.email = ?1", Traveler.class)
                .setParameter(1, demoEmail("khach", 8)).getResultStream().findFirst().orElse(null);
        LocalDateTime now = LocalDateTime.now();
        Long lead = admins.get(0).getId();
        audit(ActorType.ADMIN, lead, "LOGIN_SUCCESS", "Account", lead, "SUCCESS", 1, null, null, Map.of("method", "PASSWORD"), now.minusMinutes(35));
        audit(ActorType.ADMIN, admins.get(1).getId(), "LOGIN_FAILED", "Account", admins.get(1).getId(), "FAILURE", 2,
                "Sai mật khẩu", null, Map.of("identifier", "de***@example.test"), now.minusHours(2));
        audit(ActorType.ADMIN, admins.get(8).getId(), "LOGIN_BLOCKED", "Account", admins.get(8).getId(), "DENIED", 3,
                "Tài khoản đã bị khóa", null, Map.of("identifier", "de***@example.test"), now.minusHours(5));
        audit(ActorType.ADMIN, admins.get(4).getId(), "ACCESS_DENIED", "Endpoint", null, "DENIED", 4,
                "Cấp 3 không được đổi trạng thái đối tác", null, Map.of("endpoint", "PATCH /api/admin/providers/status"), now.minusHours(7));
        audit(ActorType.ADMIN, admins.get(2).getId(), "LOGOUT", "Account", admins.get(2).getId(), "SUCCESS", 5, null, null, null, now.minusHours(9));
        audit(ActorType.ADMIN, lead, "CREATE_ADMIN_ACCOUNT", "Account", admins.get(7).getId(), "SUCCESS", 1, null, null,
                Map.of("email", admins.get(7).getEmail(), "adminLevel", 3), now.minusDays(1));
        audit(ActorType.ADMIN, lead, "UPDATE_ADMIN_LEVEL", "Account", admins.get(9).getId(), "SUCCESS", 1,
                "Phân công phụ trách duyệt hồ sơ NCC", Map.of("adminLevel", 3), Map.of("adminLevel", 2), now.minusDays(2));
        audit(ActorType.ADMIN, admins.get(1).getId(), "RESET_PASSWORD", "Account", admins.get(6).getId(), "SUCCESS", 2,
                "Quản trị viên quên mật khẩu", null, null, now.minusDays(3));
        if (lockedTraveler != null) {
            audit(ActorType.ADMIN, admins.get(1).getId(), "UPDATE_TRAVELER_STATUS", "Traveler", lockedTraveler.getId(), "SUCCESS", 2,
                    "Đặt nhiều đơn ảo rồi bỏ không thanh toán", Map.of("status", "ACTIVE"), Map.of("status", "INACTIVE"), now.minusDays(4));
        }
        if (owners.size() >= PROVIDERS.length) {
            audit(ActorType.ADMIN, lead, "UPDATE_PROVIDER_STATUS", "Provider", owners.get(8).getProvider().getId(), "SUCCESS", 1,
                    "Nhiều phản ánh không đón khách đúng hẹn, tạm ngưng để xác minh", Map.of("status", "ACTIVE"), Map.of("status", "SUSPENDED"), now.minusDays(5));
            audit(ActorType.ADMIN, lead, "UPDATE_PROVIDER_STATUS", "Provider", owners.get(9).getProvider().getId(), "SUCCESS", 1,
                    "NCC đề nghị chấm dứt hợp tác", Map.of("status", "ACTIVE"), Map.of("status", "TERMINATED"), now.minusDays(6));
            Long ownerId = owners.get(0).getId();
            audit(ActorType.PROVIDER, ownerId, "LOGIN_SUCCESS", "Account", ownerId, "SUCCESS", 6, null, null, Map.of("method", "PASSWORD"), now.minusHours(1));
        }
        log.info("Đã nạp dữ liệu mẫu Admin: nhật ký hoạt động");
    }

    private void audit(ActorType actor, Long actorId, String action, String entityType, Long entityId, String result, int ipSuffix,
                       String reason, Map<String, Object> before, Map<String, Object> after, LocalDateTime at) {
        em.persist(AuditLog.builder().actor(actor).actorId(actorId).action(action).entityType(entityType).entityId(entityId)
                .result(result).ip("203.0.113." + ipSuffix).reason(reason).beforeData(before).afterData(after).createdAt(at).build());
    }

    // ───────────────────────────── 8. Thông báo Admin ─────────────────────────────

    private void seedAdminNotifications() {
        List<ProviderApplication> pending = em.createQuery("select a from ProviderApplication a where a.businessLicenseNo like ?1 "
                        + "and a.status = ?2 order by a.createdAt desc", ProviderApplication.class)
                .setParameter(1, "DEMO-NCC-%").setParameter(2, ProviderApplicationStatus.PENDING).getResultList();
        if (pending.isEmpty()) return;
        if (count("select count(n) from Notification n where n.relatedEntityType = ?1 and n.relatedEntityId = ?2",
                "ProviderApplication", pending.get(0).getId()) > 0) return;
        for (ProviderApplication a : pending.subList(0, Math.min(5, pending.size()))) {
            notifications.toAdmins("ADMIN_NEW_PROVIDER_APPLICATION", "ProviderApplication", a.getId(),
                    "Nhà cung cấp \"" + a.getBusinessName() + "\" (" + a.getContactName() + ") vừa gửi hồ sơ đăng ký, đang chờ duyệt.", "applications");
        }
        List<Traveler> travelers = em.createQuery("select t from Traveler t where t.email like ?1 order by t.createdAt desc", Traveler.class)
                .setParameter(1, "demo-khach%@example.test").setMaxResults(5).getResultList();
        for (Traveler t : travelers) {
            notifications.toAdmins("ADMIN_NEW_TRAVELER", "Traveler", t.getId(), "Khách \"" + t.getFullName() + "\" vừa đăng ký tài khoản.", "accounts");
        }
        log.info("Đã nạp dữ liệu mẫu Admin: thông báo cho quản trị viên");
    }

    // ───────────────────────────── Tiện ích ─────────────────────────────

    private static String demoEmail(String kind, int index) {
        return String.format("demo-%s%02d@example.test", kind, index + 1);
    }

    private long count(String jpql, Object... params) {
        TypedQuery<Long> query = em.createQuery(jpql, Long.class);
        for (int i = 0; i < params.length; i++) query.setParameter(i + 1, params[i]);
        return query.getSingleResult();
    }

    /** Tài khoản NCC mẫu theo thứ tự demo-ncc01..10 (kèm Provider). */
    private List<Account> demoProviderAccounts() {
        return em.createQuery("select a from Account a join fetch a.provider where a.email like ?1 order by a.email", Account.class)
                .setParameter(1, "demo-ncc%@example.test").getResultList();
    }

    /** Admin cấp 1 mẫu dùng để duyệt / từ chối; không có thì bỏ qua bước duyệt. */
    private Account demoAdmin() {
        return em.createQuery("select a from Account a where a.email = ?1 and a.status = ?2", Account.class)
                .setParameter(1, demoEmail("admin", 0)).setParameter(2, AccountStatus.ACTIVE)
                .getResultStream().findFirst().orElse(null);
    }

    private Place placeOf(Account owner) {
        return em.createQuery("select p from Place p where p.provider.id = ?1 and p.isDeleted = false order by p.id", Place.class)
                .setParameter(1, owner.getProvider().getId()).setMaxResults(1).getResultStream().findFirst().orElse(null);
    }

    private List<RoomType> roomsOf(Place place) {
        return em.createQuery("select r from RoomType r where r.place.id = ?1 order by r.id", RoomType.class)
                .setParameter(1, place.getId()).getResultList();
    }

    private static UserPrincipal principal(Account account) {
        return new UserPrincipal(account.getId(), account.getEmail(), account.getRole(),
                account.getProvider() == null ? null : account.getProvider().getId());
    }
}

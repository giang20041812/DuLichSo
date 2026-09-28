package com.dulichso.bookingapi.config;

import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.Review;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.enums.ChangeOperation;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.entity.enums.ReviewStatus;
import com.dulichso.bookingapi.service.NotificationRecorder;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Nạp dữ liệu mẫu cho các màn Admin còn trống để xem thử giao diện (hồ sơ NCC mới, yêu cầu chuyển NCC, đánh giá cần
 * kiểm duyệt, thông báo cho Admin). Mỗi nhóm chỉ được nạp khi bảng tương ứng còn trống nên chạy lại nhiều lần vẫn an toàn
 * và không đè dữ liệu thật. Tắt bằng APP_SEED_DEMO_DATA=false (nên tắt khi chạy dữ liệu thật).
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.seed-demo-data", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {
    private final EntityManager em;
    private final TransactionTemplate tx;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRecorder notifications;

    @Override
    public void run(ApplicationArguments args) {
        try {
            tx.executeWithoutResult(status -> {
                Account admin = firstAdmin();
                List<ProviderApplication> pending = seedProviderApplications(admin);
                seedChangeRequests();
                seedReviews(admin);
                seedAdminNotifications(pending);
            });
        } catch (RuntimeException ex) {
            // Dữ liệu mẫu chỉ để xem thử — lỗi ở đây không được làm hỏng việc khởi động ứng dụng.
            log.warn("Không nạp được dữ liệu mẫu Admin: {}", ex.getMessage());
        }
    }

    private Account firstAdmin() {
        return em.createQuery("select a from Account a where a.role=:r and a.status=:s order by a.id", Account.class)
                .setParameter("r", AccountRole.ADMIN).setParameter("s", AccountStatus.ACTIVE).setMaxResults(1)
                .getResultStream().findFirst().orElse(null);
    }

    private long count(String jpql) {
        return em.createQuery(jpql, Long.class).getSingleResult();
    }

    private List<ProviderApplication> seedProviderApplications(Account admin) {
        if (count("select count(a) from ProviderApplication a") > 0) return List.of();
        String hash = passwordEncoder.encode("Demo@12345");
        LocalDateTime now = LocalDateTime.now();
        List<ProviderApplication> pending = List.of(
                application("Homestay Mây Trắng Sa Pa", "Hoàng Thị Lan", "0901000101", "lan.maytrang@example.test",
                        "Bản Cát Cát, Phường Sa Pa, Lào Cai", "DEMO-0101234561",
                        "Homestay 8 phòng nhìn ra thung lũng Mường Hoa, có bếp củi và dịch vụ trải nghiệm dệt thổ cẩm.", hash, now.minusHours(3)),
                application("Nhà sàn Bản Xèo Yên Bái", "Lù Văn Hùng", "0901000102", "hung.banxeo@example.test",
                        "Bản Xèo, Xã Nậm Có, Mù Cang Chải, Yên Bái", "DEMO-0101234562",
                        "Nhà sàn truyền thống 5 phòng, phục vụ ẩm thực người Mông, đón khách theo đoàn nhỏ.", hash, now.minusHours(20)),
                application("Hợp tác xã Du lịch Hồng Ngài", "Vàng Thị Sổ", "0901000103", null,
                        "Xã Hồng Ngài, Bắc Yên, Sơn La", "DEMO-0101234563",
                        "Hợp tác xã 12 hộ dân làm du lịch cộng đồng, có lều trại và tour trekking.", hash, now.minusDays(2)),
                application("Eco Lodge Suối Giàng", "Phạm Quốc Bảo", "0901000104", "bao.suoigiang@example.test",
                        "Xã Suối Giàng, Văn Chấn, Yên Bái", "DEMO-0101234564",
                        "Lodge sinh thái giữa đồi chè cổ thụ, 6 bungalow, có xưởng sao chè cho khách trải nghiệm.", hash, now.minusDays(3)));
        pending.forEach(em::persist);

        ProviderApplication rejected = application("Nhà nghỉ Sông Đà", "Trần Văn Nam", "0901000105", "nam.songda@example.test",
                "Thị trấn Tủa Chùa, Điện Biên", "DEMO-0101234565", "Nhà nghỉ 4 phòng.", hash, now.minusDays(6));
        rejected.setStatus(ProviderApplicationStatus.REJECTED);
        rejected.setReviewNote("Hồ sơ thiếu thông tin giấy phép kinh doanh hợp lệ. Vui lòng bổ sung và đăng ký lại.");
        rejected.setReviewedAt(now.minusDays(5));
        rejected.setReviewedBy(admin != null ? admin.getId() : null);
        em.persist(rejected);
        log.info("Đã nạp dữ liệu mẫu: {} hồ sơ đăng ký NCC chờ duyệt + 1 hồ sơ đã từ chối", pending.size());
        return pending;
    }

    private ProviderApplication application(String business, String contact, String phone, String email, String address,
                                            String license, String description, String hash, LocalDateTime createdAt) {
        return ProviderApplication.builder().businessName(business).contactName(contact).contactPhone(phone).contactEmail(email)
                .address(address).businessLicenseNo(license).description(description).passwordHash(hash)
                .status(ProviderApplicationStatus.PENDING).createdAt(createdAt).build();
    }

    /** Yêu cầu chuyển Homestay sang NCC khác (payload chỉ cần providerId, nên duyệt được mà không cần dữ liệu Homestay đầy đủ). */
    private void seedChangeRequests() {
        if (count("select count(r) from PartnerChangeRequest r") > 0) return;
        List<Provider> providers = em.createQuery("select p from Provider p where p.status=:s order by p.id", Provider.class)
                .setParameter("s", ProviderStatus.ACTIVE).setMaxResults(8).getResultList();
        int created = 0;
        for (int i = 0; i + 1 < providers.size() && created < 3; i++) {
            Provider from = providers.get(i);
            Provider to = providers.get(i + 1);
            Account submitter = em.createQuery("select a from Account a where a.provider.id=:pid and a.status=:s order by a.id", Account.class)
                    .setParameter("pid", from.getId()).setParameter("s", AccountStatus.ACTIVE).setMaxResults(1)
                    .getResultStream().findFirst().orElse(null);
            Place place = em.createQuery("select p from Place p where p.provider.id=:pid and p.isDeleted=false order by p.id", Place.class)
                    .setParameter("pid", from.getId()).setMaxResults(1).getResultStream().findFirst().orElse(null);
            if (submitter == null || place == null) continue;
            em.persist(PartnerChangeRequest.builder().provider(from).place(place).targetType(ChangeTargetType.HOMESTAY)
                    .operation(ChangeOperation.TRANSFER).status(ChangeRequestStatus.PENDING)
                    .payload(Map.of("providerId", to.getId(), "providerName", to.getName()))
                    .beforeData(Map.of("providerId", from.getId(), "providerName", from.getName()))
                    .submittedBy(submitter).submittedAt(LocalDateTime.now().minusHours(6L * (created + 1))).build());
            created++;
        }
        if (created > 0) log.info("Đã nạp dữ liệu mẫu: {} yêu cầu chuyển NCC chờ duyệt", created);
    }

    /** Vài đánh giá cần kiểm duyệt (nội dung xúc phạm, đã ẩn) gắn vào các Booking chưa có đánh giá. */
    private void seedReviews(Account admin) {
        if (count("select count(r) from Review r where r.status <> com.dulichso.bookingapi.entity.enums.ReviewStatus.VISIBLE") > 0
                || count("select count(r) from Review r") > 3) return;
        List<Booking> free = em.createQuery("select b from Booking b where b.status in :st and not exists "
                        + "(select 1 from Review r where r.booking = b) order by b.id", Booking.class)
                .setParameter("st", List.of(BookingStatus.COMPLETED, BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED))
                .setMaxResults(3).getResultList();
        String[] contents = {
                "Chủ nhà thái độ rất tệ, nói năng thô lỗ, đúng là lừa đảo. Mọi người tuyệt đối đừng đến!",
                "Phòng bẩn, có mùi, nhân viên vô trách nhiệm. Dịch vụ như rác.",
                "Cảnh đẹp, chủ nhà thân thiện, bữa tối rất ngon. Sẽ quay lại vào mùa lúa chín."};
        byte[] ratings = {1, 1, 5};
        for (int i = 0; i < free.size(); i++) {
            Booking b = free.get(i);
            Review review = Review.builder().place(b.getPlace()).booking(b).rating(ratings[i]).content(contents[i])
                    .editableUntil(LocalDateTime.now().minusDays(1)).createdAt(LocalDateTime.now().minusDays(i + 1)).build();
            if (i == 1) {
                review.setStatus(ReviewStatus.HIDDEN);
                review.setModeratedBy(admin != null ? admin.getId() : null);
                review.setModeratedAt(LocalDateTime.now().minusHours(5));
                review.setModerationReason("Chứa ngôn từ xúc phạm, chưa đủ căn cứ để gỡ hẳn — ẩn chờ NCC phản hồi.");
            }
            em.persist(review);
        }
        if (!free.isEmpty()) log.info("Đã nạp dữ liệu mẫu: {} đánh giá cần kiểm duyệt", free.size());
    }

    private void seedAdminNotifications(List<ProviderApplication> pending) {
        if (pending.isEmpty()) return;
        if (count("select count(n) from Notification n where n.recipientType = com.dulichso.bookingapi.entity.enums.RecipientType.ACCOUNT") > 0) return;
        for (ProviderApplication a : pending.subList(0, Math.min(2, pending.size()))) {
            notifications.toAdmins("ADMIN_NEW_PROVIDER_APPLICATION", "ProviderApplication", a.getId(),
                    "Nhà cung cấp \"" + a.getBusinessName() + "\" (" + a.getContactName() + ") vừa gửi hồ sơ đăng ký, đang chờ duyệt.", "applications");
        }
        notifications.toAdmins("ADMIN_NEW_TRAVELER", "Traveler", null,
                "Khách \"Nguyễn Minh Anh\" vừa đăng ký tài khoản.", "accounts");
    }
}

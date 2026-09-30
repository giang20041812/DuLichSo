package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.*;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.*;
import com.dulichso.bookingapi.entity.keys.PlaceAmenityId;
import com.dulichso.bookingapi.repository.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartnerHomestayService {
    /** Nhận mọi link TikTok https (video, kênh, link rút gọn vt/vm). Trang khách nhúng video khi link có /video/<số>, còn lại hiện nút mở TikTok. */
    static final java.util.regex.Pattern TIKTOK_VIDEO = java.util.regex.Pattern.compile("https://((www|m|vt|vm)\\.)?tiktok\\.com/\\S*");
    private final PartnerHomestayRepository repository;
    private final AccountRepository accounts;
    private final PlaceContactRepository contacts;
    private final PlaceAmenityRepository placeAmenities;
    private final PartnerChangeRequestRepository changeRequests;
    private final BookingImpactService bookingImpact;

    /** Dữ liệu cần để xác định Homestay đủ điều kiện công khai/nhận Booking (UC-NCC-02/03/05). */
    record PublishFacts(int rooms, int sellableRooms, String cover, String phone, HomestayProfile profile, boolean pendingPublish) {}

    Account actor(UserPrincipal principal, boolean writing) {
        if (principal == null || principal.role() != AccountRole.PROVIDER)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ nhà cung cấp được sử dụng chức năng này.");
        Account account = accounts.findByIdentifier(principal.identifier())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        if (account.getRole() != AccountRole.PROVIDER || account.getStatus() != AccountStatus.ACTIVE || account.getProvider() == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản nhà cung cấp không hợp lệ.");
        if (writing && account.getProvider().getStatus() != ProviderStatus.ACTIVE)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nhà cung cấp hiện không được phép cập nhật dữ liệu.");
        return account;
    }

    Place owned(Long id, Account actor, boolean lock) {
        return repository.findOwned(id, actor.getProvider().getId(), lock)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Homestay của bạn."));
    }

    public HomestayOptionsDto options(UserPrincipal principal) {
        actor(principal, false);
        return new HomestayOptionsDto(repository.regions().stream().map(r -> new OptionDto(r.getId(), r.getName())).toList(),
                repository.amenities().stream().map(a -> new OptionDto(a.getId(), a.getName())).toList());
    }

    public PartnerHomestayPageResponse getHomestays(UserPrincipal principal, String keyword, String visibility, String operation) {
        Account account = actor(principal, false);
        List<Place> places = repository.findOwned(account.getProvider().getId());
        List<Long> ids = places.stream().map(Place::getId).toList();
        Map<Long, Integer> counts = new HashMap<>();
        repository.roomCounts(ids).forEach(row -> counts.put((Long) row[0], ((Number) row[1]).intValue()));
        Map<Long, List<PlaceMedia>> media = repository.media(ids).stream().collect(Collectors.groupingBy(m -> m.getPlace().getId()));
        Map<Long, List<PlaceContact>> contactMap = ids.isEmpty() ? Map.of() : contacts.findByPlaceIdInAndIsPublicTrue(ids)
                .stream().collect(Collectors.groupingBy(c -> c.getPlace().getId()));
        Map<Long, Integer> sellable = new HashMap<>();
        repository.sellableRoomCounts(ids).forEach(row -> sellable.put((Long) row[0], ((Number) row[1]).intValue()));
        Map<Long, HomestayProfile> profiles = repository.profiles(ids).stream().collect(Collectors.toMap(HomestayProfile::getPlaceId, h -> h));
        Set<Long> pending = ids.isEmpty() ? Set.of() : new HashSet<>(changeRequests.pendingPublishPlaceIds(ids));
        List<PartnerHomestaySummaryDto> all = places.stream().map(p -> summary(p, new PublishFacts(counts.getOrDefault(p.getId(), 0),
                sellable.getOrDefault(p.getId(), 0), cover(p, media.getOrDefault(p.getId(), List.of())),
                contact(contactMap.getOrDefault(p.getId(), List.of()), ContactChannel.PHONE), profiles.get(p.getId()), pending.contains(p.getId())))).toList();
        PlaceVisibility vis = parseFilter(visibility, PlaceVisibility.class);
        PlaceOperationStatus op = parseFilter(operation, PlaceOperationStatus.class);
        String kw = normalize(text(keyword));
        List<PartnerHomestaySummaryDto> filtered = all.stream()
                .filter(h -> kw.isEmpty() || normalize(h.getName() + " " + h.getAddress()).contains(kw))
                .filter(h -> vis == null || h.getVisibility() == vis)
                .filter(h -> op == null || h.getOperationStatus() == op).toList();
        return PartnerHomestayPageResponse.builder().homestays(filtered)
                .stats(PartnerHomestayStatsDto.builder().totalCount(all.size())
                        .publishedCount((int) all.stream().filter(h -> h.getVisibility() == PlaceVisibility.PUBLISHED).count())
                        .draftCount((int) all.stream().filter(h -> h.getVisibility() == PlaceVisibility.DRAFT).count())
                        .unpublishedCount((int) all.stream().filter(h -> h.getVisibility() == PlaceVisibility.UNPUBLISHED).count())
                        .operatingCount((int) all.stream().filter(h -> h.getOperationStatus() == PlaceOperationStatus.OPERATING).count())
                        .tempClosedCount((int) all.stream().filter(h -> h.getOperationStatus() == PlaceOperationStatus.TEMP_CLOSED).count()).build())
                .cooperativeName(account.getProvider().getName()).providerCode("NCC-" + account.getProvider().getId())
                .isProviderSuspended(account.getProvider().getStatus() != ProviderStatus.ACTIVE).build();
    }

    public PartnerHomestayDetailDto getHomestayDetail(UserPrincipal principal, Long id) {
        return detail(owned(id, actor(principal, false), false));
    }

    @Transactional
    public PartnerHomestayDetailDto createHomestay(UserPrincipal principal, PartnerHomestayDetailDto dto) {
        Account account = actor(principal, true);
        validate(dto);
        Category category = repository.category().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Chưa có danh mục Homestay đang hoạt động."));
        Place place = Place.builder().category(category).kind(CategoryKind.HOMESTAY).provider(account.getProvider())
                .slug("homestay-" + UUID.randomUUID()).name(dto.getName().trim()).nameNorm(normalize(dto.getName()))
                .attributes(new HashMap<>()).sourceType(SourceType.PROVIDER).createdBy(account).updatedBy(account).build();
        // New properties always start as drafts. Client-supplied IDs and ownership are never used.
        place.setVisibility(PlaceVisibility.DRAFT);
        repository.persist(place);
        apply(place, dto, account);
        repository.flush();
        return detail(place);
    }

    /**
     * Ghi trực tiếp thông tin Homestay (tên/địa chỉ/mô tả/liên hệ/tiện nghi/chính sách...). Xác nhận nghiệp vụ
     * (2026-09-28): áp dụng cho cả Homestay đã PUBLISHED — NCC được sửa thông tin bất kỳ lúc nào, không cần
     * Admin duyệt lại, không phân biệt sửa nhỏ/lớn. Khác với: (a) lần đầu xuất bản (HOM-MGT-BR-04) và
     * (b) chuyển NCC quản lý Homestay — cả hai vẫn bắt buộc qua Admin duyệt (xem {@link #applyPublish},
     * {@link #applyTransfer}). Loại phòng/giá vẫn theo cơ chế duyệt riêng khi Homestay đã công khai — xem
     * {@link PartnerRoomService}.
     */
    @Transactional
    public PartnerHomestayDetailDto saveHomestayDetail(UserPrincipal principal, Long id, PartnerHomestayDetailDto dto) {
        Account account = actor(principal, true);
        Place place = owned(id, account, true);
        validate(dto);
        apply(place, dto, account);
        repository.flush();
        return detail(place);
    }

    /** Áp dụng thay đổi đã được Admin duyệt; người gửi yêu cầu được ghi nhận là người cập nhật. */
    @Transactional
    public PartnerHomestayDetailDto applyApproved(Account submitter, Long placeId, PartnerHomestayDetailDto dto) {
        Place place = owned(placeId, submitter, true);
        validate(dto);
        apply(place, dto, submitter);
        repository.flush();
        return detail(place);
    }

    /** Homestay của NCC (đã kiểm tra quyền sở hữu, NCC đang được phép ghi) — dùng để quyết định ghi trực tiếp hay gửi yêu cầu. */
    Place ownedForWrite(UserPrincipal principal, Long id) {
        return owned(id, actor(principal, true), false);
    }

    public static boolean isPublic(Place place) {
        return place.getVisibility() == PlaceVisibility.PUBLISHED;
    }

    static void requireNotPublic(Place place) {
        if (isPublic(place)) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Homestay đang công khai: thay đổi phải gửi yêu cầu để quản trị viên duyệt.");
    }

    /** Ảnh chụp chi tiết hiện tại của Homestay (dùng làm "nội dung cũ" khi so sánh). */
    @Transactional(readOnly = true)
    public PartnerHomestayDetailDto detailOf(Place place) {
        return detail(place);
    }

    /**
     * Cập nhật trực tiếp trạng thái hiển thị/vận hành. HOM-MGT-BR-04: NCC KHÔNG được tự đưa Homestay từ
     * chưa công khai (DRAFT/UNPUBLISHED) sang PUBLISHED lần đầu bằng đường này — phải qua yêu cầu Admin duyệt
     * (xem {@link PartnerChangeService#updateStatus} và {@link #applyPublish}). Ngừng hiển thị hoặc đổi trạng
     * thái vận hành (mở/tạm đóng) không cần duyệt nên vẫn ghi trực tiếp như trước.
     */
    @Transactional
    public PartnerHomestaySummaryDto updateStatus(UserPrincipal principal, Long id, UpdateStatusRequest request) {
        Account account = actor(principal, true);
        Place place = owned(id, account, true);
        if (request.getVisibility() == PlaceVisibility.PUBLISHED && place.getVisibility() != PlaceVisibility.PUBLISHED)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Xuất bản Homestay lần đầu cần được quản trị viên duyệt.");
        if (request.getVisibility() == null && request.getOperationStatus() == null) throw bad("Chưa chọn trạng thái cần cập nhật.");
        if (request.getVisibility() != null) place.setVisibility(request.getVisibility());
        if (request.getOperationStatus() == PlaceOperationStatus.TEMP_CLOSED
                && place.getOperationStatus() != PlaceOperationStatus.TEMP_CLOSED) {
            bookingImpact.cancelForPlace(id, LocalDate.now(), LocalDate.of(9999, 12, 31),
                    request.getReason() == null || request.getReason().isBlank()
                            ? "Homestay tạm ngừng hoạt động theo yêu cầu của nhà cung cấp."
                            : request.getReason().trim());
        }
        if (request.getOperationStatus() != null) place.setOperationStatus(request.getOperationStatus());
        place.setUpdatedBy(account);
        repository.flush();
        return summary(place, facts(place));
    }

    /** HOM-MGT-BR-04: điều kiện đủ để công khai — dùng cả khi NCC tự kiểm tra trước khi gửi yêu cầu và khi Admin duyệt. */
    boolean isReadyToPublish(Place place) {
        return missingForPublish(place).isEmpty();
    }

    /** Các mục còn thiếu để công khai (dùng cho thông báo khi NCC gửi yêu cầu xuất bản và khi Admin duyệt). */
    List<String> missingForPublish(Place place) {
        return missingForPublish(place, facts(place));
    }

    /**
     * Áp dụng việc chuyển NCC quản lý Homestay đã được Admin duyệt (xác nhận nghiệp vụ 2026-09-28). Chỉ gọi
     * từ luồng duyệt yêu cầu thay đổi; {@code submitter} là tài khoản của NCC hiện tại (bên gửi yêu cầu) — dùng
     * {@link #owned} để xác nhận ngay trước khi ghi rằng Homestay vẫn thuộc NCC đó (chưa bị chuyển đi/xóa bởi
     * thao tác khác trong lúc chờ duyệt).
     */
    @Transactional
    public PartnerHomestaySummaryDto applyTransfer(Account submitter, Long placeId, Provider target) {
        Place place = owned(placeId, submitter, true);
        place.setProvider(target);
        place.setUpdatedBy(submitter);
        repository.flush();
        return summary(place, facts(place));
    }

    /**
     * Áp dụng lần đầu công khai đã được Admin duyệt (HOM-MGT-BR-04). Chỉ gọi từ luồng duyệt yêu cầu thay đổi
     * ({@link com.dulichso.bookingapi.service.AdminChangeRequestService#approve}); NCC không tự gọi trực tiếp.
     */
    @Transactional
    public PartnerHomestaySummaryDto applyPublish(Account submitter, Long placeId) {
        Place place = owned(placeId, submitter, true);
        List<String> missing = missingForPublish(place);
        if (!missing.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Homestay không còn đủ điều kiện xuất bản, còn thiếu: " + String.join(", ", missing) + ".");
        place.setVisibility(PlaceVisibility.PUBLISHED);
        place.setUpdatedBy(submitter);
        repository.flush();
        return summary(place, facts(place));
    }

    private void apply(Place place, PartnerHomestayDetailDto dto, Account account) {
        place.setName(dto.getName().trim());
        place.setNameNorm(normalize(dto.getName()));
        place.setDescription(text(dto.getDescription()));
        place.setAddress(text(dto.getAddress()));
        place.setAccessNote(text(dto.getAccessNote()));
        place.setLatitude(dto.getLatitude() == null ? null : BigDecimal.valueOf(dto.getLatitude()));
        place.setLongitude(dto.getLongitude() == null ? null : BigDecimal.valueOf(dto.getLongitude()));
        if (dto.getRegionId() == null) place.setRegion(null);
        else place.setRegion(repository.regions().stream().filter(r -> r.getId().equals(dto.getRegionId())).findFirst()
                .orElseThrow(() -> bad("Khu vực không hợp lệ.")));
        place.setUpdatedBy(account);
        saveContact(place, ContactChannel.PHONE, dto.getContactPhone());
        saveContact(place, ContactChannel.EMAIL, dto.getContactEmail());
        saveContact(place, ContactChannel.TIKTOK, dto.getReviewVideoUrl());
        saveContact(place, ContactChannel.FACEBOOK, dto.getFacebookUrl());
        saveContact(place, ContactChannel.GOOGLE_MAPS, dto.getGoogleMapLink());

        List<String> requested = dto.getAmenities() == null ? List.of() : dto.getAmenities();
        List<PlaceAmenity> existing = placeAmenities.findByPlaceIdWithAmenity(place.getId());
        List<Amenity> catalog = repository.amenities();
        Map<String, Amenity> byName = new HashMap<>();
        catalog.forEach(a -> byName.put(a.getName(), a));
        // Keep inactive amenities already attached to this property; do not silently discard them.
        existing.forEach(a -> byName.putIfAbsent(a.getAmenity().getName(), a.getAmenity()));
        if (requested.stream().anyMatch(n -> !byName.containsKey(n))) throw bad("Tiện nghi không có trong danh mục.");
        existing.stream().filter(a -> a.getValue() == AmenityValue.YES && !requested.contains(a.getAmenity().getName())).forEach(repository::remove);
        Set<Long> existingIds = existing.stream().map(a -> a.getAmenity().getId()).collect(Collectors.toSet());
        for (String name : new LinkedHashSet<>(requested)) {
            Amenity amenity = byName.get(name);
            if (!existingIds.contains(amenity.getId())) repository.persist(PlaceAmenity.builder()
                    .id(new PlaceAmenityId(place.getId(), amenity.getId())).place(place).amenity(amenity).value(AmenityValue.YES).build());
            else existing.stream().filter(a -> a.getAmenity().getId().equals(amenity.getId())).forEach(a -> a.setValue(AmenityValue.YES));
        }

        HomestayProfile profile = repository.profile(place.getId()).orElse(null);
        boolean isNew = profile == null;
        if (isNew) profile = HomestayProfile.builder().place(place).build();
        profile.setCheckInFrom(time(dto.getCheckInFrom()));
        profile.setCheckOutUntil(time(dto.getCheckOutUntil()));
        profile.setProcessingStartTime(time(dto.getProcessingStartTime()));
        profile.setProcessingEndTime(time(dto.getProcessingEndTime()));
        profile.setHouseRules(text(dto.getHouseRules()));
        profile.setSurchargeNote(text(dto.getSurchargeNote()));
        profile.setChildrenPolicy(text(dto.getChildrenPolicy()));
        profile.setPetsPolicy(text(dto.getPetsPolicy()));
        profile.setViewHighlight(text(dto.getViewHighlight()));
        profile.setSuitability(text(dto.getSuitability()));
        CancellationPolicy current = profile.getCurrentPolicy();
        if (!text(dto.getCancellationPolicy()).isEmpty()) {
            if (current == null || !Objects.equals(current.getName(), dto.getPolicyName().trim())
                    || !Objects.equals(current.getContentText(), dto.getCancellationPolicy().trim())
                    || !Objects.equals(current.getFreeCancelCutoffHours(), dto.getFreeCancelCutoffHours())
                    || current.getRefundOnLateCancel() != dto.getRefundOnLateCancel()) {
                CancellationPolicy policy = CancellationPolicy.builder().place(place)
                        .version(repository.nextPolicyVersion(place.getId())).name(dto.getPolicyName().trim())
                        .contentText(dto.getCancellationPolicy().trim()).freeCancelCutoffHours(dto.getFreeCancelCutoffHours())
                        .refundOnLateCancel(dto.getRefundOnLateCancel()).createdBy(account).build();
                repository.persist(policy);
                profile.setCurrentPolicy(policy);
            }
        } else if (current != null) throw bad("Không được xóa chính sách đang áp dụng; hãy cập nhật thành phiên bản mới.");
        if (isNew) repository.persist(profile);
    }

    private void saveContact(Place place, ContactChannel channel, String value) {
        List<PlaceContact> existing = contacts.findByPlaceIdAndIsPublicTrue(place.getId()).stream().filter(c -> c.getChannel() == channel).toList();
        String clean = text(value);
        if (clean.isEmpty()) { if (!existing.isEmpty()) repository.remove(existing.get(0)); }
        else if (existing.isEmpty()) repository.persist(PlaceContact.builder().place(place).channel(channel).value(clean).build());
        else {
            existing.get(0).setValue(clean);
            // This form edits the primary contact only; additional contacts are preserved.
        }
    }

    private PartnerHomestayDetailDto detail(Place p) {
        List<PlaceContact> cs = contacts.findByPlaceIdAndIsPublicTrue(p.getId());
        List<PlaceMedia> ms = repository.media(List.of(p.getId()));
        PublishFacts facts = facts(p, cs, ms);
        int roomCount = facts.rooms();
        String cover = facts.cover();
        PartnerHomestaySummaryDto summary = summary(p, facts);
        HomestayProfile profile = facts.profile();
        CancellationPolicy policy = profile == null ? null : profile.getCurrentPolicy();
        return PartnerHomestayDetailDto.builder().id(p.getId()).code(summary.getCode()).slug(p.getSlug())
                .name(p.getName()).description(text(p.getDescription())).address(text(p.getAddress()))
                .regionId(p.getRegion() == null ? null : p.getRegion().getId()).regionName(p.getRegion() == null ? "" : p.getRegion().getName())
                .latitude(p.getLatitude() == null ? null : p.getLatitude().doubleValue()).longitude(p.getLongitude() == null ? null : p.getLongitude().doubleValue())
                .googleMapLink(contact(cs, ContactChannel.GOOGLE_MAPS)).facebookUrl(contact(cs, ContactChannel.FACEBOOK))
                .accessNote(text(p.getAccessNote())).contactPhone(contact(cs, ContactChannel.PHONE)).contactEmail(contact(cs, ContactChannel.EMAIL))
                .reviewVideoUrl(contact(cs, ContactChannel.TIKTOK))
                .coverImageUrl(cover).galleryUrls(ms.stream().map(m -> m.getMedia().getPublicUrl()).filter(Objects::nonNull).toList())
                .amenities(placeAmenities.findByPlaceIdWithAmenity(p.getId()).stream().filter(a -> a.getValue() == AmenityValue.YES).map(a -> a.getAmenity().getName()).toList())
                .checkInFrom(profile == null || profile.getCheckInFrom() == null ? "" : profile.getCheckInFrom().toString())
                .checkOutUntil(profile == null || profile.getCheckOutUntil() == null ? "" : profile.getCheckOutUntil().toString())
                .processingStartTime(profile == null || profile.getProcessingStartTime() == null ? "" : profile.getProcessingStartTime().toString())
                .processingEndTime(profile == null || profile.getProcessingEndTime() == null ? "" : profile.getProcessingEndTime().toString())
                .houseRules(profile == null ? "" : text(profile.getHouseRules())).surchargeNote(profile == null ? "" : text(profile.getSurchargeNote()))
                .childrenPolicy(profile==null?"":text(profile.getChildrenPolicy())).petsPolicy(profile==null?"":text(profile.getPetsPolicy()))
                .viewHighlight(profile == null ? "" : text(profile.getViewHighlight()))
                .suitability(profile == null ? "" : text(profile.getSuitability())).googleRating(p.getGoogleRating())
                .cancellationPolicy(policy == null ? "" : policy.getContentText()).policyName(policy == null ? "" : policy.getName())
                .freeCancelCutoffHours(policy == null ? null : policy.getFreeCancelCutoffHours())
                .refundOnLateCancel(policy == null ? null : policy.getRefundOnLateCancel()).policyVersion(policy == null ? null : policy.getVersion())
                .policyEffectiveFrom(policy == null ? null : policy.getEffectiveFrom())
                .missingForPublish(summary.getMissingForPublish()).pendingPublish(summary.isPendingPublish())
                .visibility(p.getVisibility()).operationStatus(p.getOperationStatus()).isReadyToPublish(summary.isReadyToPublish())
                .cooperativeName(p.getProvider().getName()).providerCode("NCC-" + p.getProvider().getId()).alertNote(summary.getAlertNote())
                .roomTypesCount(roomCount).roomTypesSummary(roomCount + " loại phòng")
                .priceRefMin(p.getPriceRefMin()).priceRefMax(p.getPriceRefMax())
                .pricingSummary("Giá tham khảo hiện có của cơ sở").availabilitySummary("Chưa có thống kê tồn phòng trong màn hình này")
                .stopSellSummary("Xem lịch phòng để kiểm tra tình trạng theo ngày").heroStatusBadge(p.getVisibility() == PlaceVisibility.PUBLISHED ? "Đang hiển thị" : "Chưa hiển thị").build();
    }

    private PublishFacts facts(Place p) {
        return facts(p, contacts.findByPlaceIdAndIsPublicTrue(p.getId()), repository.media(List.of(p.getId())));
    }

    private PublishFacts facts(Place p, List<PlaceContact> cs, List<PlaceMedia> ms) {
        List<Long> id = List.of(p.getId());
        int rooms = repository.roomCounts(id).stream().mapToInt(r -> ((Number) r[1]).intValue()).sum();
        int sellable = repository.sellableRoomCounts(id).stream().mapToInt(r -> ((Number) r[1]).intValue()).sum();
        return new PublishFacts(rooms, sellable, cover(p, ms), contact(cs, ContactChannel.PHONE),
                repository.profile(p.getId()).orElse(null), !changeRequests.pendingPublishPlaceIds(id).isEmpty());
    }

    /**
     * UC-NCC-02 luồng phụ 4 / UC-NCC-03 / UC-NCC-05: điều kiện công khai và nhận Booking. Ít nhất 1 ảnh chung;
     * ít nhất một loại phòng đang mở bán có giá &gt; 0 và ảnh toàn phòng; giờ nhận/trả phòng và chính sách hủy là bắt buộc.
     */
    static List<String> missingForPublish(Place p, PublishFacts f) {
        List<String> missing = new ArrayList<>();
        if (text(p.getName()).isEmpty()) missing.add("tên Homestay");
        if (text(p.getAddress()).isEmpty()) missing.add("địa chỉ");
        if (p.getLatitude() == null || p.getLongitude() == null) missing.add("vị trí trên bản đồ");
        if (text(p.getDescription()).isEmpty()) missing.add("mô tả");
        if (f.phone().isEmpty()) missing.add("số điện thoại liên hệ");
        if (f.cover().isEmpty()) missing.add("ít nhất 1 ảnh chung");
        if (f.rooms() == 0) missing.add("loại phòng");
        else if (f.sellableRooms() == 0) missing.add("loại phòng đang mở bán có giá > 0 và ảnh toàn phòng");
        HomestayProfile profile = f.profile();
        if (profile == null || profile.getCheckInFrom() == null || profile.getCheckOutUntil() == null) missing.add("giờ nhận/trả phòng");
        if (profile == null || profile.getCurrentPolicy() == null) missing.add("chính sách hủy");
        return missing;
    }

    private PartnerHomestaySummaryDto summary(Place p, PublishFacts facts) {
        List<String> missing = missingForPublish(p, facts);
        boolean ready = missing.isEmpty();
        boolean closed = p.getOperationStatus() == PlaceOperationStatus.TEMP_CLOSED;
        int rooms = facts.rooms();
        String cover = facts.cover();
        return PartnerHomestaySummaryDto.builder().id(p.getId()).code("HM-" + p.getId()).slug(p.getSlug()).name(p.getName())
                .address(text(p.getAddress())).coverImageUrl(cover).categoryName(p.getCategory().getName())
                .visibility(p.getVisibility()).operationStatus(p.getOperationStatus()).roomTypesCount(rooms)
                .priceRefMin(p.getPriceRefMin()).priceRefMax(p.getPriceRefMax()).priceUnitNote(text(p.getPriceUnitNote()))
                .lastUpdatedText(p.getUpdatedAt().toString()).isReadyToPublish(ready)
                .auditStatus(!ready ? "NEEDS_DATA" : closed ? "MAINTENANCE" : "STANDARD")
                .auditStatusText(!ready ? "Cần bổ sung hồ sơ" : closed ? "Tạm đóng cửa" : "Hồ sơ đầy đủ")
                .missingForPublish(missing).pendingPublish(facts.pendingPublish())
                .alertNote(facts.pendingPublish() ? "Homestay đang chờ duyệt" : ready ? "" : "Còn thiếu: " + String.join(", ", missing) + ".").build();
    }

    private String cover(Place p, List<PlaceMedia> media) {
        String url = media.stream().filter(m -> m.getRole() == MediaRole.COVER).map(m -> m.getMedia().getPublicUrl())
                .filter(Objects::nonNull).findFirst().orElse("");
        if (url.isEmpty() && !media.isEmpty()) url = text(media.get(0).getMedia().getPublicUrl());
        if (url.isEmpty() && p.getAttributes() != null && p.getAttributes().get("coverImageUrl") instanceof String value) url = value;
        return url;
    }

    private String contact(List<PlaceContact> values, ContactChannel channel) {
        return values.stream().filter(c -> c.getChannel() == channel).map(PlaceContact::getValue).findFirst().orElse("");
    }

    private void validate(PartnerHomestayDetailDto dto) {
        if(text(dto.getChildrenPolicy()).length()>10000 || text(dto.getPetsPolicy()).length()>10000) throw bad("Nội dung chính sách tối đa 10.000 ký tự.");
        if (text(dto.getViewHighlight()).length() > 10000 || text(dto.getSuitability()).length() > 10000) throw bad("Nội dung tối đa 10.000 ký tự.");
        if (!isHttpUrl(dto.getGoogleMapLink())) throw bad("Link Google Maps phải bắt đầu bằng http:// hoặc https:// và tối đa 500 ký tự.");
        if (!isHttpUrl(dto.getFacebookUrl())) throw bad("Link Facebook phải bắt đầu bằng http:// hoặc https:// và tối đa 500 ký tự.");
        if (text(dto.getName()).isEmpty() || dto.getName().trim().length() > 255) throw bad("Tên Homestay phải có từ 1 đến 255 ký tự.");
        if (text(dto.getAddress()).isEmpty() || dto.getAddress().length() > 500) throw bad("Địa chỉ phải có từ 1 đến 500 ký tự.");
        if (text(dto.getDescription()).length() > 10000 || text(dto.getHouseRules()).length() > 10000
                || text(dto.getSurchargeNote()).length() > 10000 || text(dto.getAccessNote()).length() > 10000) throw bad("Nội dung tối đa 10.000 ký tự.");
        if (!text(dto.getContactPhone()).matches("[+0-9() .-]{6,32}")) throw bad("Số điện thoại không hợp lệ.");
        if (!text(dto.getContactEmail()).isEmpty() && (dto.getContactEmail().length() > 254 || !dto.getContactEmail().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))) throw bad("Email không hợp lệ.");
        if (!text(dto.getReviewVideoUrl()).isEmpty() && (dto.getReviewVideoUrl().length() > 500 || !TIKTOK_VIDEO.matcher(dto.getReviewVideoUrl().trim()).matches()))
            throw bad("Link video review phải là link TikTok bắt đầu bằng https://www.tiktok.com/ hoặc https://vt.tiktok.com/.");
        if ((dto.getLatitude() == null) != (dto.getLongitude() == null)) throw bad("Cần nhập cả vĩ độ và kinh độ.");
        if (dto.getLatitude() != null && (!Double.isFinite(dto.getLatitude()) || Math.abs(dto.getLatitude()) > 90
                || !Double.isFinite(dto.getLongitude()) || Math.abs(dto.getLongitude()) > 180)) throw bad("Tọa độ không hợp lệ.");
        time(dto.getCheckInFrom()); time(dto.getCheckOutUntil());
        LocalTime processingStart = time(dto.getProcessingStartTime()), processingEnd = time(dto.getProcessingEndTime());
        if ((processingStart == null) != (processingEnd == null)) throw bad("Cần chọn cả giờ bắt đầu và giờ kết thúc xử lý đơn.");
        if (processingStart != null && !ResponseDeadlineCalculator.isValidWindow(processingStart, processingEnd))
            throw bad("Giờ bắt đầu xử lý đơn phải trước giờ kết thúc.");
        if (text(dto.getCancellationPolicy()).isEmpty() && (!text(dto.getPolicyName()).isEmpty()
                || dto.getFreeCancelCutoffHours() != null || dto.getRefundOnLateCancel() != null)) throw bad("Cần nhập nội dung chính sách hủy.");
        if (!text(dto.getCancellationPolicy()).isEmpty() && (text(dto.getPolicyName()).isEmpty() || text(dto.getPolicyName()).length() > 255
                || dto.getCancellationPolicy().length() > 10000 || dto.getFreeCancelCutoffHours() == null || dto.getFreeCancelCutoffHours() < 0
                || dto.getRefundOnLateCancel() == null)) throw bad("Cần tên chính sách, số giờ hủy miễn phí không âm và mức hoàn tiền khi hủy muộn.");
    }

    private static LocalTime time(String value) {
        if (text(value).isEmpty()) return null;
        try { return LocalTime.parse(value); } catch (DateTimeParseException ex) { throw bad("Giờ nhận/trả phòng không hợp lệ."); }
    }
    private static <E extends Enum<E>> E parseFilter(String value, Class<E> type) {
        if (text(value).isEmpty() || "ALL".equals(value)) return null;
        try { return Enum.valueOf(type, value); } catch (IllegalArgumentException ex) { throw bad("Bộ lọc trạng thái không hợp lệ."); }
    }
    private static String text(String value) { return value == null ? "" : value.trim(); }
    /** Rỗng là hợp lệ (xóa liên hệ); có giá trị thì phải là link http(s) vừa cột place_contact.value. */
    private static boolean isHttpUrl(String value) {
        String clean = text(value);
        return clean.isEmpty() || (clean.length() <= 500 && clean.matches("(?i)https?://\\S+"));
    }
    private static String normalize(String value) { return Normalizer.normalize(text(value), Normalizer.Form.NFD).replaceAll("\\p{M}", "").replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT); }
    private static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}

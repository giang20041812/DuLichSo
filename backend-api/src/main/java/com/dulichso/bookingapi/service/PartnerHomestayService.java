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
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartnerHomestayService {
    /** Trang Homestay của khách lấy id video theo mẫu /video/<số>, nên chỉ nhận link video TikTok đầy đủ. */
    private static final java.util.regex.Pattern TIKTOK_VIDEO = java.util.regex.Pattern.compile("https://(www\\.|m\\.)?tiktok\\.com/@[\\w.-]+/video/\\d+([/?#].*)?");
    private final PartnerHomestayRepository repository;
    private final AccountRepository accounts;
    private final PlaceContactRepository contacts;
    private final PlaceAmenityRepository placeAmenities;

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
        List<PartnerHomestaySummaryDto> all = places.stream().map(p -> summary(p, counts.getOrDefault(p.getId(), 0),
                cover(p, media.getOrDefault(p.getId(), List.of())), contact(contactMap.getOrDefault(p.getId(), List.of()), ContactChannel.PHONE))).toList();
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
                .attributes(new HashMap<>()).isSuitableByTime(false).sourceType(SourceType.PROVIDER).createdBy(account).updatedBy(account).build();
        // New properties always start as drafts. Client-supplied IDs and ownership are never used.
        place.setVisibility(PlaceVisibility.DRAFT);
        repository.persist(place);
        apply(place, dto, account);
        repository.flush();
        return detail(place);
    }

    @Transactional
    public PartnerHomestayDetailDto saveHomestayDetail(UserPrincipal principal, Long id, PartnerHomestayDetailDto dto) {
        Account account = actor(principal, true);
        Place place = owned(id, account, true);
        validate(dto);
        apply(place, dto, account);
        repository.flush();
        return detail(place);
    }

    @Transactional
    public PartnerHomestaySummaryDto updateStatus(UserPrincipal principal, Long id, UpdateStatusRequest request) {
        Account account = actor(principal, true);
        Place place = owned(id, account, true);
        PartnerHomestayDetailDto detail = detail(place);
        if (request.getVisibility() == PlaceVisibility.PUBLISHED && !detail.isReadyToPublish())
            throw bad("Cần có tên, địa chỉ, mô tả, số điện thoại, ảnh đại diện và loại phòng trước khi xuất bản.");
        if (request.getVisibility() == null && request.getOperationStatus() == null) throw bad("Chưa chọn trạng thái cần cập nhật.");
        if (request.getVisibility() != null) place.setVisibility(request.getVisibility());
        if (request.getOperationStatus() != null) place.setOperationStatus(request.getOperationStatus());
        place.setUpdatedBy(account);
        repository.flush();
        return summary(place, detail.getRoomTypesCount(), detail.getCoverImageUrl(), detail.getContactPhone());
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
        profile.setHouseRules(text(dto.getHouseRules()));
        profile.setSurchargeNote(text(dto.getSurchargeNote()));
        profile.setChildrenPolicy(text(dto.getChildrenPolicy()));
        profile.setPetsPolicy(text(dto.getPetsPolicy()));
        profile.setGuestPolicy(text(dto.getGuestPolicy()));
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
        int roomCount = repository.roomCounts(List.of(p.getId())).stream().mapToInt(r -> ((Number) r[1]).intValue()).sum();
        String cover = cover(p, ms);
        PartnerHomestaySummaryDto summary = summary(p, roomCount, cover, contact(cs, ContactChannel.PHONE));
        HomestayProfile profile = repository.profile(p.getId()).orElse(null);
        CancellationPolicy policy = profile == null ? null : profile.getCurrentPolicy();
        return PartnerHomestayDetailDto.builder().id(p.getId()).code(summary.getCode()).slug(p.getSlug())
                .name(p.getName()).description(text(p.getDescription())).address(text(p.getAddress()))
                .regionId(p.getRegion() == null ? null : p.getRegion().getId()).regionName(p.getRegion() == null ? "" : p.getRegion().getName())
                .latitude(p.getLatitude() == null ? null : p.getLatitude().doubleValue()).longitude(p.getLongitude() == null ? null : p.getLongitude().doubleValue())
                .accessNote(text(p.getAccessNote())).contactPhone(contact(cs, ContactChannel.PHONE)).contactEmail(contact(cs, ContactChannel.EMAIL))
                .reviewVideoUrl(contact(cs, ContactChannel.TIKTOK))
                .coverImageUrl(cover).galleryUrls(ms.stream().map(m -> m.getMedia().getPublicUrl()).filter(Objects::nonNull).toList())
                .amenities(placeAmenities.findByPlaceIdWithAmenity(p.getId()).stream().filter(a -> a.getValue() == AmenityValue.YES).map(a -> a.getAmenity().getName()).toList())
                .checkInFrom(profile == null || profile.getCheckInFrom() == null ? "" : profile.getCheckInFrom().toString())
                .checkOutUntil(profile == null || profile.getCheckOutUntil() == null ? "" : profile.getCheckOutUntil().toString())
                .houseRules(profile == null ? "" : text(profile.getHouseRules())).surchargeNote(profile == null ? "" : text(profile.getSurchargeNote()))
                .childrenPolicy(profile==null?"":text(profile.getChildrenPolicy())).petsPolicy(profile==null?"":text(profile.getPetsPolicy())).guestPolicy(profile==null?"":text(profile.getGuestPolicy()))
                .cancellationPolicy(policy == null ? "" : policy.getContentText()).policyName(policy == null ? "" : policy.getName())
                .freeCancelCutoffHours(policy == null ? null : policy.getFreeCancelCutoffHours())
                .refundOnLateCancel(policy == null ? null : policy.getRefundOnLateCancel()).policyVersion(policy == null ? null : policy.getVersion())
                .visibility(p.getVisibility()).operationStatus(p.getOperationStatus()).isReadyToPublish(summary.isReadyToPublish())
                .cooperativeName(p.getProvider().getName()).providerCode("NCC-" + p.getProvider().getId()).alertNote(summary.getAlertNote())
                .roomTypesCount(roomCount).roomTypesSummary(roomCount + " loại phòng")
                .priceRefMin(p.getPriceRefMin()).priceRefMax(p.getPriceRefMax())
                .pricingSummary("Giá tham khảo hiện có của cơ sở").availabilitySummary("Chưa có thống kê tồn phòng trong màn hình này")
                .stopSellSummary("Xem lịch phòng để kiểm tra tình trạng theo ngày").heroStatusBadge(p.getVisibility() == PlaceVisibility.PUBLISHED ? "Đang hiển thị" : "Chưa hiển thị").build();
    }

    private PartnerHomestaySummaryDto summary(Place p, int rooms, String cover, String phone) {
        boolean ready = !text(p.getName()).isEmpty() && !text(p.getAddress()).isEmpty() && !text(p.getDescription()).isEmpty()
                && !phone.isEmpty() && !cover.isEmpty() && rooms > 0;
        boolean closed = p.getOperationStatus() == PlaceOperationStatus.TEMP_CLOSED;
        return PartnerHomestaySummaryDto.builder().id(p.getId()).code("HM-" + p.getId()).slug(p.getSlug()).name(p.getName())
                .address(text(p.getAddress())).coverImageUrl(cover).categoryName(p.getCategory().getName())
                .visibility(p.getVisibility()).operationStatus(p.getOperationStatus()).roomTypesCount(rooms)
                .priceRefMin(p.getPriceRefMin()).priceRefMax(p.getPriceRefMax()).priceUnitNote(text(p.getPriceUnitNote()))
                .lastUpdatedText(p.getUpdatedAt().toString()).isReadyToPublish(ready)
                .auditStatus(!ready ? "NEEDS_DATA" : closed ? "MAINTENANCE" : "STANDARD")
                .auditStatusText(!ready ? "Cần bổ sung hồ sơ" : closed ? "Tạm đóng cửa" : "Hồ sơ đầy đủ")
                .alertNote(ready ? "" : "Cần tên, địa chỉ, mô tả, số điện thoại, ảnh đại diện và loại phòng để xuất bản.").build();
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
        if(text(dto.getChildrenPolicy()).length()>10000 || text(dto.getPetsPolicy()).length()>10000 || text(dto.getGuestPolicy()).length()>10000) throw bad("Nội dung chính sách tối đa 10.000 ký tự.");
        if (text(dto.getName()).isEmpty() || dto.getName().trim().length() > 255) throw bad("Tên Homestay phải có từ 1 đến 255 ký tự.");
        if (text(dto.getAddress()).isEmpty() || dto.getAddress().length() > 500) throw bad("Địa chỉ phải có từ 1 đến 500 ký tự.");
        if (text(dto.getDescription()).length() > 10000 || text(dto.getHouseRules()).length() > 10000
                || text(dto.getSurchargeNote()).length() > 10000 || text(dto.getAccessNote()).length() > 10000) throw bad("Nội dung tối đa 10.000 ký tự.");
        if (!text(dto.getContactPhone()).matches("[+0-9() .-]{6,32}")) throw bad("Số điện thoại không hợp lệ.");
        if (!text(dto.getContactEmail()).isEmpty() && (dto.getContactEmail().length() > 254 || !dto.getContactEmail().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))) throw bad("Email không hợp lệ.");
        if (!text(dto.getReviewVideoUrl()).isEmpty() && (dto.getReviewVideoUrl().length() > 500 || !TIKTOK_VIDEO.matcher(dto.getReviewVideoUrl().trim()).matches()))
            throw bad("Link video review phải là link video TikTok đầy đủ, dạng https://www.tiktok.com/@tenkenh/video/123456...");
        if ((dto.getLatitude() == null) != (dto.getLongitude() == null)) throw bad("Cần nhập cả vĩ độ và kinh độ.");
        if (dto.getLatitude() != null && (!Double.isFinite(dto.getLatitude()) || Math.abs(dto.getLatitude()) > 90
                || !Double.isFinite(dto.getLongitude()) || Math.abs(dto.getLongitude()) > 180)) throw bad("Tọa độ không hợp lệ.");
        time(dto.getCheckInFrom()); time(dto.getCheckOutUntil());
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
    private static String normalize(String value) { return Normalizer.normalize(text(value), Normalizer.Form.NFD).replaceAll("\\p{M}", "").replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT); }
    private static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.ImageDto;
import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.PlaceShowcaseDto;
import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.RoomShowcaseDto;
import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.SeasonalPriceDto;
import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.StayPolicyDto;
import com.dulichso.bookingapi.entity.CancellationPolicy;
import com.dulichso.bookingapi.entity.HomestayProfile;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.RoomAmenity;
import com.dulichso.bookingapi.entity.RoomBed;
import com.dulichso.bookingapi.entity.RoomSpecialPrice;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.MediaRole;
import com.dulichso.bookingapi.repository.PartnerHomestayRepository;
import com.dulichso.bookingapi.repository.PlaceAmenityRepository;
import com.dulichso.bookingapi.repository.ProviderApplicationRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Hình ảnh, tiện nghi và chính sách lưu trú của một cơ sở cho các màn chi tiết phía Admin
 * (Duyệt điểm đến, Hồ sơ nhà cung cấp). Chỉ đọc.
 */
@Service
@RequiredArgsConstructor
public class PlaceShowcaseService {
    private final EntityManager em;
    private final PartnerHomestayRepository homestays;
    private final PlaceAmenityRepository placeAmenities;
    private final ProviderApplicationRepository applications;

    @Transactional(readOnly = true)
    public PlaceShowcaseDto forPlace(Long placeId) {
        Place place = em.createQuery("select p from Place p where p.id = :id and p.isDeleted = false", Place.class)
                .setParameter("id", placeId).getResultStream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy địa điểm với ID: " + placeId));
        return build(place);
    }

    /**
     * Form đăng ký NCC không thu ảnh / tiện nghi / chính sách nên hồ sơ chưa có dữ liệu riêng: khi hồ sơ đã được duyệt
     * thì lấy Homestay đầu tiên của đối tác được tạo từ hồ sơ; còn lại trả về rỗng để giao diện hiện trạng thái trống.
     */
    @Transactional(readOnly = true)
    public PlaceShowcaseDto forApplication(Long applicationId) {
        ProviderApplication application = applications.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ đăng ký với ID: " + applicationId));
        if (application.getProviderId() == null) return PlaceShowcaseDto.empty();
        return em.createQuery("select p from Place p where p.provider.id = :pid and p.kind = :kind and p.isDeleted = false order by p.id",
                        Place.class)
                .setParameter("pid", application.getProviderId()).setParameter("kind", CategoryKind.HOMESTAY)
                .setMaxResults(1).getResultStream().findFirst()
                .map(this::build).orElseGet(PlaceShowcaseDto::empty);
    }

    private PlaceShowcaseDto build(Place place) {
        List<ImageDto> images = homestays.media(List.of(place.getId())).stream()
                .filter(m -> m.getMedia() != null && m.getMedia().getPublicUrl() != null && !m.getMedia().getPublicUrl().isBlank())
                // Ảnh bìa lên đầu, còn lại giữ thứ tự sắp xếp của NCC.
                .sorted((a, b) -> Boolean.compare(b.getRole() == MediaRole.COVER, a.getRole() == MediaRole.COVER))
                .map(m -> new ImageDto(m.getMedia().getPublicUrl(),
                        m.getCaption() != null && !m.getCaption().isBlank() ? m.getCaption() : m.getMedia().getAltText(),
                        m.getRole() == MediaRole.COVER))
                .toList();
        List<String> amenities = placeAmenities.findByPlaceIdWithAmenity(place.getId()).stream()
                .filter(a -> a.getValue() == AmenityValue.YES && a.getAmenity() != null)
                .map(a -> a.getAmenity().getName()).filter(Objects::nonNull).toList();
        boolean homestay = place.getKind() == CategoryKind.HOMESTAY;
        StayPolicyDto policy = homestay ? homestays.profile(place.getId()).map(PlaceShowcaseService::policyOf).orElse(null) : null;
        return new PlaceShowcaseDto(place.getId(), place.getName(), images, amenities, policy, homestay ? rooms(place.getId()) : List.of());
    }

    /** Loại phòng của Homestay kèm giường, tiện nghi phòng, giá theo mùa — mỗi loại dữ liệu một truy vấn (không N+1). */
    private List<RoomShowcaseDto> rooms(Long placeId) {
        List<RoomType> rooms = em.createQuery("select r from RoomType r where r.place.id = :id order by r.id", RoomType.class)
                .setParameter("id", placeId).getResultList();
        if (rooms.isEmpty()) return List.of();
        List<Long> ids = rooms.stream().map(RoomType::getId).toList();
        Map<Long, List<String>> beds = new HashMap<>();
        for (RoomBed b : em.createQuery("select b from RoomBed b where b.roomType.id in :ids order by b.id", RoomBed.class)
                .setParameter("ids", ids).getResultList()) {
            String type = b.getBedType() == null ? "" : b.getBedType().trim().toLowerCase(Locale.forLanguageTag("vi-VN"));
            beds.computeIfAbsent(b.getRoomType().getId(), k -> new ArrayList<>()).add((b.getQuantity() + " " + type).trim());
        }
        Map<Long, List<String>> roomAmenities = new HashMap<>();
        for (RoomAmenity a : em.createQuery("select a from RoomAmenity a join fetch a.amenity where a.roomType.id in :ids "
                        + "and a.value = :yes order by a.amenity.sortOrder, a.amenity.name", RoomAmenity.class)
                .setParameter("ids", ids).setParameter("yes", AmenityValue.YES).getResultList()) {
            roomAmenities.computeIfAbsent(a.getRoomType().getId(), k -> new ArrayList<>()).add(a.getAmenity().getName());
        }
        Map<Long, List<SeasonalPriceDto>> prices = new HashMap<>();
        for (RoomSpecialPrice p : em.createQuery("select p from RoomSpecialPrice p where p.roomType.id in :ids order by p.periodStart",
                RoomSpecialPrice.class).setParameter("ids", ids).getResultList()) {
            prices.computeIfAbsent(p.getRoomType().getId(), k -> new ArrayList<>())
                    .add(new SeasonalPriceDto(p.getName(), p.getPeriodStart(), p.getPeriodEnd(), p.getPrice()));
        }
        return rooms.stream().map(r -> new RoomShowcaseDto(r.getId(), r.getName(), r.getTotalRoomCount(), r.getMaxOccupancy(),
                r.getAreaSqm(), r.getPrivateBathroom() == null ? null : r.getPrivateBathroom().name(), r.getBasePrice(),
                r.getWeekendPrice(), r.getStatus(), text(r.getViewDescription()), text(r.getDescription()),
                beds.getOrDefault(r.getId(), List.of()), roomAmenities.getOrDefault(r.getId(), List.of()),
                prices.getOrDefault(r.getId(), List.of()))).toList();
    }

    private static StayPolicyDto policyOf(HomestayProfile profile) {
        CancellationPolicy c = profile.getCurrentPolicy();
        return new StayPolicyDto(
                profile.getCheckInFrom() == null ? "" : profile.getCheckInFrom().toString(),
                profile.getCheckOutUntil() == null ? "" : profile.getCheckOutUntil().toString(),
                text(profile.getHouseRules()), text(profile.getSurchargeNote()), text(profile.getChildrenPolicy()),
                text(profile.getPetsPolicy()), text(profile.getSuitability()),
                c == null ? "" : text(c.getName()), c == null ? "" : text(c.getContentText()),
                c == null ? null : c.getFreeCancelCutoffHours(), c == null ? null : c.getRefundOnLateCancel());
    }

    private static String text(String value) {
        return value == null ? "" : value.trim();
    }
}

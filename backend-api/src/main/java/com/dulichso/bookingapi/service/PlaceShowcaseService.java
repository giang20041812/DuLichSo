package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.ImageDto;
import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.PlaceShowcaseDto;
import com.dulichso.bookingapi.dto.admin.PlaceShowcaseDtos.StayPolicyDto;
import com.dulichso.bookingapi.entity.CancellationPolicy;
import com.dulichso.bookingapi.entity.HomestayProfile;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.ProviderApplication;
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

import java.util.List;
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
        StayPolicyDto policy = place.getKind() == CategoryKind.HOMESTAY
                ? homestays.profile(place.getId()).map(PlaceShowcaseService::policyOf).orElse(null) : null;
        return new PlaceShowcaseDto(place.getId(), place.getName(), images, amenities, policy);
    }

    private static StayPolicyDto policyOf(HomestayProfile profile) {
        CancellationPolicy c = profile.getCurrentPolicy();
        return new StayPolicyDto(
                profile.getCheckInFrom() == null ? "" : profile.getCheckInFrom().toString(),
                profile.getCheckOutUntil() == null ? "" : profile.getCheckOutUntil().toString(),
                text(profile.getHouseRules()), text(profile.getSurchargeNote()), text(profile.getChildrenPolicy()),
                text(profile.getPetsPolicy()), text(profile.getGuestPolicy()),
                c == null ? "" : text(c.getName()), c == null ? "" : text(c.getContentText()),
                c == null ? null : c.getFreeCancelCutoffHours(), c == null ? null : c.getRefundOnLateCancel());
    }

    private static String text(String value) {
        return value == null ? "" : value.trim();
    }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerMediaDtos.*;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.MediaRole;
import com.dulichso.bookingapi.entity.keys.PlaceMediaId;
import com.dulichso.bookingapi.entity.keys.RoomTypeMediaId;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

import static com.dulichso.bookingapi.dto.partner.PartnerMediaDtos.MAX_FILE_BYTES;
import static com.dulichso.bookingapi.dto.partner.PartnerMediaDtos.MAX_IMAGES_PER_OWNER;

/**
 * Ảnh Homestay (place_media) và ảnh loại phòng (room_type_media). Mỗi chủ thể tối đa 1 ảnh COVER (uq_place_cover / uq_room_cover).
 * Ảnh chỉ được gắn khi Cloudflare xác nhận đã upload xong và metadata providerId khớp nhà cung cấp đang đăng nhập.
 */
@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class PartnerMediaService {
    static final String STORAGE_PREFIX = "cloudflare-images:";
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private final PartnerHomestayService homestays;
    private final PartnerRoomService rooms;
    private final CloudflareImagesService cloudflare;
    private final EntityManager em;

    public DirectUploadDto directUpload(UserPrincipal principal) {
        Account actor = homestays.actor(principal, true);
        var upload = cloudflare.createDirectUpload(Map.of("providerId", String.valueOf(actor.getProvider().getId()), "accountId", String.valueOf(actor.getId())));
        return new DirectUploadDto(upload.uploadURL(), upload.id(), MAX_FILE_BYTES, ALLOWED_TYPES);
    }

    // ------------------------------------------------------------ Homestay

    public List<MediaDto> placeMedia(UserPrincipal principal, Long placeId) {
        homestays.owned(placeId, homestays.actor(principal, false), false);
        return placeLinks(placeId).stream().map(m -> new MediaDto(m.getMedia().getId(), m.getMedia().getPublicUrl(), m.getRole(), m.getCaption(), m.getSortOrder())).toList();
    }

    @Transactional
    public List<MediaDto> attachToPlace(UserPrincipal principal, Long placeId, AttachInput input) {
        Account actor = homestays.actor(principal, true);
        Place place = homestays.owned(placeId, actor, true);
        List<PlaceMedia> links = placeLinks(placeId);
        if (links.size() >= MAX_IMAGES_PER_OWNER) throw bad("Mỗi Homestay tối đa " + MAX_IMAGES_PER_OWNER + " ảnh.");
        MediaAsset asset = verifiedAsset(input, actor);
        boolean hasCover = links.stream().anyMatch(m -> m.getRole() == MediaRole.COVER);
        em.persist(PlaceMedia.builder().id(new PlaceMediaId(placeId, asset.getId())).place(place).media(asset)
                .role(hasCover ? MediaRole.GALLERY : MediaRole.COVER).caption(trim(input.caption()))
                .sortOrder(nextOrder(links.stream().map(PlaceMedia::getSortOrder).toList())).build());
        em.flush();
        return placeMedia(principal, placeId);
    }

    @Transactional
    public List<MediaDto> setPlaceCover(UserPrincipal principal, Long placeId, Long mediaId) {
        homestays.owned(placeId, homestays.actor(principal, true), true);
        List<PlaceMedia> links = placeLinks(placeId);
        PlaceMedia target = links.stream().filter(m -> m.getMedia().getId().equals(mediaId)).findFirst().orElseThrow(PartnerMediaService::notFound);
        links.forEach(m -> m.setRole(MediaRole.GALLERY));
        em.flush(); // gỡ COVER cũ trước để không vướng unique cover_guard
        target.setRole(MediaRole.COVER);
        em.flush();
        return placeMedia(principal, placeId);
    }

    @Transactional
    public List<MediaDto> removeFromPlace(UserPrincipal principal, Long placeId, Long mediaId) {
        homestays.owned(placeId, homestays.actor(principal, true), true);
        List<PlaceMedia> links = placeLinks(placeId);
        PlaceMedia target = links.stream().filter(m -> m.getMedia().getId().equals(mediaId)).findFirst().orElseThrow(PartnerMediaService::notFound);
        em.remove(target);
        em.flush();
        if (target.getRole() == MediaRole.COVER)
            links.stream().filter(m -> m != target).findFirst().ifPresent(m -> {m.setRole(MediaRole.COVER); em.flush();});
        deleteAssetIfOrphan(target.getMedia());
        return placeMedia(principal, placeId);
    }

    // ------------------------------------------------------------ Loại phòng

    public List<MediaDto> roomMedia(UserPrincipal principal, Long placeId, Long roomId) {
        rooms.owned(principal, placeId, roomId, false);
        return roomLinks(roomId).stream().map(m -> new MediaDto(m.getMedia().getId(), m.getMedia().getPublicUrl(), m.getRole(), m.getCaption(), m.getSortOrder())).toList();
    }

    @Transactional
    public List<MediaDto> attachToRoom(UserPrincipal principal, Long placeId, Long roomId, AttachInput input) {
        Account actor = homestays.actor(principal, true);
        RoomType room = rooms.owned(principal, placeId, roomId, true);
        List<RoomTypeMedia> links = roomLinks(roomId);
        if (links.size() >= MAX_IMAGES_PER_OWNER) throw bad("Mỗi loại phòng tối đa " + MAX_IMAGES_PER_OWNER + " ảnh.");
        MediaAsset asset = verifiedAsset(input, actor);
        boolean hasCover = links.stream().anyMatch(m -> m.getRole() == MediaRole.COVER);
        em.persist(RoomTypeMedia.builder().id(new RoomTypeMediaId(roomId, asset.getId())).roomType(room).media(asset)
                .role(hasCover ? MediaRole.GALLERY : MediaRole.COVER).caption(trim(input.caption()))
                .sortOrder(nextOrder(links.stream().map(RoomTypeMedia::getSortOrder).toList())).build());
        em.flush();
        return roomMedia(principal, placeId, roomId);
    }

    @Transactional
    public List<MediaDto> setRoomCover(UserPrincipal principal, Long placeId, Long roomId, Long mediaId) {
        rooms.owned(principal, placeId, roomId, true);
        List<RoomTypeMedia> links = roomLinks(roomId);
        RoomTypeMedia target = links.stream().filter(m -> m.getMedia().getId().equals(mediaId)).findFirst().orElseThrow(PartnerMediaService::notFound);
        links.forEach(m -> m.setRole(MediaRole.GALLERY));
        em.flush();
        target.setRole(MediaRole.COVER);
        em.flush();
        return roomMedia(principal, placeId, roomId);
    }

    @Transactional
    public List<MediaDto> removeFromRoom(UserPrincipal principal, Long placeId, Long roomId, Long mediaId) {
        rooms.owned(principal, placeId, roomId, true);
        List<RoomTypeMedia> links = roomLinks(roomId);
        RoomTypeMedia target = links.stream().filter(m -> m.getMedia().getId().equals(mediaId)).findFirst().orElseThrow(PartnerMediaService::notFound);
        em.remove(target);
        em.flush();
        if (target.getRole() == MediaRole.COVER)
            links.stream().filter(m -> m != target).findFirst().ifPresent(m -> {m.setRole(MediaRole.COVER); em.flush();});
        deleteAssetIfOrphan(target.getMedia());
        return roomMedia(principal, placeId, roomId);
    }

    // ------------------------------------------------------------ helpers

    private MediaAsset verifiedAsset(AttachInput input, Account actor) {
        String key = STORAGE_PREFIX + input.imageId();
        if (!em.createQuery("select m from MediaAsset m where m.storageKey=:key", MediaAsset.class).setParameter("key", key).getResultList().isEmpty())
            throw bad("Ảnh này đã được sử dụng.");
        var image = cloudflare.getImage(input.imageId()).orElseThrow(() -> bad("Không tìm thấy ảnh trên dịch vụ lưu trữ. Hãy upload lại."));
        if (Boolean.TRUE.equals(image.draft())) throw bad("Ảnh chưa upload xong. Hãy thử lại.");
        Object owner = image.meta() == null ? null : image.meta().get("providerId");
        if (owner == null || !owner.toString().equals(String.valueOf(actor.getProvider().getId())))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ảnh không thuộc tài khoản của bạn.");
        String url = CloudflareImagesService.deliveryUrl(image);
        if (url == null) throw bad("Dịch vụ lưu trữ chưa trả về đường dẫn hiển thị ảnh.");
        MediaAsset asset = MediaAsset.builder().storageKey(key).publicUrl(url).mimeType(mimeType(image.filename())).uploadedBy(actor.getId()).build();
        em.persist(asset);
        return asset;
    }

    private void deleteAssetIfOrphan(MediaAsset asset) {
        long used = em.createQuery("select count(m) from PlaceMedia m where m.media.id=:id", Long.class).setParameter("id", asset.getId()).getSingleResult()
                + em.createQuery("select count(m) from RoomTypeMedia m where m.media.id=:id", Long.class).setParameter("id", asset.getId()).getSingleResult();
        if (used > 0) return;
        em.remove(asset);
        if (asset.getStorageKey().startsWith(STORAGE_PREFIX)) cloudflare.deleteImageQuietly(asset.getStorageKey().substring(STORAGE_PREFIX.length()));
    }

    private List<PlaceMedia> placeLinks(Long placeId) {
        return em.createQuery("select m from PlaceMedia m join fetch m.media where m.place.id=:id order by m.sortOrder, m.media.id", PlaceMedia.class)
                .setParameter("id", placeId).getResultStream().sorted(Comparator.comparing((PlaceMedia m) -> m.getRole() != MediaRole.COVER)).toList();
    }

    private List<RoomTypeMedia> roomLinks(Long roomId) {
        return em.createQuery("select m from RoomTypeMedia m join fetch m.media where m.roomType.id=:id order by m.sortOrder, m.media.id", RoomTypeMedia.class)
                .setParameter("id", roomId).getResultStream().sorted(Comparator.comparing((RoomTypeMedia m) -> m.getRole() != MediaRole.COVER)).toList();
    }

    private static int nextOrder(List<Integer> orders) {return orders.stream().mapToInt(o -> o == null ? 0 : o).max().orElse(-1) + 1;}

    private static String mimeType(String filename) {
        String name = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private static String trim(String s) {return s == null || s.isBlank() ? null : s.trim();}
    private static ResponseStatusException bad(String text) {return new ResponseStatusException(HttpStatus.BAD_REQUEST, text);}
    private static ResponseStatusException notFound() {return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh.");}
}

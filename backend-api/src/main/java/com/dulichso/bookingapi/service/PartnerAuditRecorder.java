package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.ChangeLogDto;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.AuditLog;
import com.dulichso.bookingapi.entity.enums.ActorType;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * NFR-AUD-02: ghi lịch sử thay đổi giá, số phòng, lịch bán do NCC thực hiện vào audit_log (actor = PROVIDER),
 * trong cùng transaction với thay đổi. Chính sách hủy đã có lịch sử riêng qua cancellation_policy.version.
 */
@Service @RequiredArgsConstructor
public class PartnerAuditRecorder {
    public static final String ROOM_TYPE = "RoomType";
    public static final String HOMESTAY = "Homestay";

    private final EntityManager em;

    public void record(Account actor, String action, String entityType, Long entityId, String reason,
                       Map<String, Object> before, Map<String, Object> after) {
        em.persist(AuditLog.builder().actor(ActorType.PROVIDER).actorId(actor.getId()).action(action)
                .entityType(entityType).entityId(entityId).reason(reason == null || reason.isBlank() ? null : reason.trim())
                .beforeData(before).afterData(after).createdAt(LocalDateTime.now()).build());
    }

    /** 100 thay đổi gần nhất của Homestay và các loại phòng thuộc Homestay. */
    public List<ChangeLogDto> forHomestay(Long placeId, List<Long> roomIds) {
        var query = em.createQuery("select a from AuditLog a where a.actor=:actor and ((a.entityType=:homestay and a.entityId=:place)"
                        + (roomIds.isEmpty() ? "" : " or (a.entityType=:room and a.entityId in :rooms)") + ") order by a.createdAt desc, a.id desc", AuditLog.class)
                .setParameter("actor", ActorType.PROVIDER).setParameter("homestay", HOMESTAY).setParameter("place", placeId);
        if (!roomIds.isEmpty()) query.setParameter("room", ROOM_TYPE).setParameter("rooms", roomIds);
        return query.setMaxResults(100).getResultStream()
                .map(a -> new ChangeLogDto(a.getId(), a.getAction(), a.getEntityType(), a.getEntityId(), a.getReason(),
                        a.getBeforeData(), a.getAfterData(), a.getCreatedAt())).toList();
    }
}

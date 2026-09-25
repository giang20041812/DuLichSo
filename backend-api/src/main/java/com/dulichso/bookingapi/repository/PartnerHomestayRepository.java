package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** Persistence queries for the provider workspace. Ownership is part of every place lookup. */
@Repository
@RequiredArgsConstructor
public class PartnerHomestayRepository {
    private final EntityManager em;

    public List<Place> findOwned(Long providerId) {
        return em.createQuery("""
                select p from Place p join fetch p.provider join fetch p.category left join fetch p.region
                where p.provider.id = :providerId and p.kind = :kind and p.isDeleted = false
                order by p.updatedAt desc, p.id desc
                """, Place.class).setParameter("providerId", providerId)
                .setParameter("kind", CategoryKind.HOMESTAY).getResultList();
    }

    public Optional<Place> findOwned(Long id, Long providerId, boolean lock) {
        var query = em.createQuery("""
                select p from Place p join fetch p.provider join fetch p.category left join fetch p.region
                where p.id = :id and p.provider.id = :providerId and p.kind = :kind and p.isDeleted = false
                """, Place.class).setParameter("id", id).setParameter("providerId", providerId)
                .setParameter("kind", CategoryKind.HOMESTAY);
        if (lock) query.setLockMode(LockModeType.PESSIMISTIC_WRITE);
        return query.getResultStream().findFirst();
    }

    public Optional<HomestayProfile> profile(Long id) {
        return em.createQuery("select h from HomestayProfile h left join fetch h.currentPolicy where h.placeId = :id",
                HomestayProfile.class).setParameter("id", id).getResultStream().findFirst();
    }

    public List<PlaceMedia> media(List<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return em.createQuery("select m from PlaceMedia m join fetch m.media where m.place.id in :ids order by m.sortOrder, m.media.id",
                PlaceMedia.class).setParameter("ids", ids).getResultList();
    }

    public List<Object[]> roomCounts(List<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return em.createQuery("select r.place.id, count(r) from RoomType r where r.place.id in :ids group by r.place.id",
                Object[].class).setParameter("ids", ids).getResultList();
    }

    public List<Region> regions() {
        return em.createQuery("select r from Region r where r.isActive = true order by r.path, r.name", Region.class).getResultList();
    }

    public List<Amenity> amenities() {
        return em.createQuery("select a from Amenity a where a.isActive = true and a.scope = :scope order by a.sortOrder, a.id",
                Amenity.class).setParameter("scope", AmenityScope.PLACE).getResultList();
    }

    public Optional<Category> category() {
        return em.createQuery("select c from Category c where c.kind = :kind and c.isActive = true order by c.sortOrder, c.id",
                Category.class).setParameter("kind", CategoryKind.HOMESTAY).setMaxResults(1).getResultStream().findFirst();
    }

    public int nextPolicyVersion(Long placeId) {
        Integer latest = em.createQuery("select max(c.version) from CancellationPolicy c where c.place.id = :id", Integer.class)
                .setParameter("id", placeId).getSingleResult();
        return latest == null ? 1 : latest + 1;
    }

    public void persist(Object entity) { em.persist(entity); }
    public void remove(Object entity) { em.remove(entity); }
    public void flush() { em.flush(); }
}

package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.BookingResponseDeadline;
import com.dulichso.bookingapi.entity.HomestayProfile;
import com.dulichso.bookingapi.repository.PartnerHomestayRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * UC-NCC-06/08 (BOOK-BR-11/12): han NCC phai phan hoi don = 120 phut trong khung gio xu ly cua Homestay, tinh tu luc
 * khach gui don. Han duoc chot mot lan ("thoi diem het han da luu") de NCC doi khung gio sau do khong lam doi han cua
 * don da co. Lan dau gap don thi tinh va luu.
 */
@Service
@RequiredArgsConstructor
public class ResponseDeadlineService {
    private final EntityManager em;
    private final PartnerHomestayRepository homestays;
    private final PlatformTransactionManager transactionManager;

    /** Thong tin toi thieu cua don de tinh han. */
    public record BookingRef(Long bookingId, Long placeId, LocalDateTime createdAt) {}

    public LocalDateTime dueAt(BookingRef ref) {
        return dueAt(List.of(ref)).get(ref.bookingId());
    }

    public Map<Long, LocalDateTime> dueAt(Collection<BookingRef> refs) {
        if (refs.isEmpty()) return Map.of();
        List<Long> ids = refs.stream().map(BookingRef::bookingId).distinct().toList();
        Map<Long, LocalDateTime> result = new HashMap<>();
        em.createQuery("select d from BookingResponseDeadline d where d.bookingId in :ids", BookingResponseDeadline.class)
                .setParameter("ids", ids).getResultList().forEach(d -> result.put(d.getBookingId(), d.getDueAt()));

        List<BookingRef> missing = refs.stream().filter(r -> !result.containsKey(r.bookingId()))
                .collect(Collectors.toMap(BookingRef::bookingId, Function.identity(), (a, b) -> a)).values().stream().toList();
        if (missing.isEmpty()) return result;

        Map<Long, HomestayProfile> profiles = homestays.profiles(missing.stream().map(BookingRef::placeId).distinct().toList())
                .stream().collect(Collectors.toMap(HomestayProfile::getPlaceId, h -> h));
        Map<Long, LocalDateTime> computed = new HashMap<>();
        for (BookingRef ref : missing) {
            LocalDateTime created = ref.createdAt() == null ? LocalDateTime.now() : ref.createdAt();
            computed.put(ref.bookingId(), ResponseDeadlineCalculator.deadline(created, profiles.get(ref.placeId())));
        }
        // Dung REQUIRES_NEW chi khi goi tu luong read-only (khong co outer TX ghi).
        // Khi goi tu createBooking (dang co outer TX), dung persistInCurrentTx thay the.
        persistInNewTx(computed);
        result.putAll(computed);
        return result;
    }

    /**
     * Tinh deadline va persist TRONG outer transaction hien tai (dung khi goi tu createBooking).
     * Tranh REQUIRES_NEW tren cung EntityManager vi gay suspend + lock contention tren DB connection.
     */
    public LocalDateTime dueAtInCurrentTx(BookingRef ref) {
        List<Long> ids = List.of(ref.bookingId());
        List<BookingResponseDeadline> existing = em.createQuery(
                "select d from BookingResponseDeadline d where d.bookingId in :ids", BookingResponseDeadline.class)
                .setParameter("ids", ids).getResultList();
        if (!existing.isEmpty()) return existing.get(0).getDueAt();

        HomestayProfile profile = homestays.profiles(List.of(ref.placeId()))
                .stream().findFirst().orElse(null);
        LocalDateTime created = ref.createdAt() == null ? LocalDateTime.now() : ref.createdAt();
        LocalDateTime due = ResponseDeadlineCalculator.deadline(created, profile);
        try {
            em.persist(BookingResponseDeadline.builder().bookingId(ref.bookingId()).dueAt(due).build());
        } catch (Exception ex) {
            // Neu bi trung khoa (race condition), lay lai gia tri da luu
            em.clear();
        }
        return due;
    }

    private void persistInNewTx(Map<Long, LocalDateTime> computed) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            tx.executeWithoutResult(status -> computed.forEach((id, due) ->
                    em.persist(BookingResponseDeadline.builder().bookingId(id).dueAt(due).build())));
        } catch (RuntimeException ex) {
            // Luong khac vua chot han cho cung don (trung khoa): gia tri giong het vi cung cong thuc, bo qua.
        }
    }
}

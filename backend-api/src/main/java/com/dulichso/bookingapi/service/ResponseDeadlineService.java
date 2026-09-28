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
 * UC-NCC-06/08 (BOOK-BR-11/12): hạn NCC phải phản hồi đơn = 120 phút trong khung giờ xử lý của Homestay, tính từ lúc
 * khách gửi đơn. Hạn được chốt một lần ("thời điểm hết hạn đã lưu") để NCC đổi khung giờ sau đó không làm đổi hạn của
 * đơn đã có. Lần đầu gặp đơn thì tính và lưu trong transaction riêng, nên gọi được cả từ luồng chỉ đọc.
 */
@Service
@RequiredArgsConstructor
public class ResponseDeadlineService {
    private final EntityManager em;
    private final PartnerHomestayRepository homestays;
    private final PlatformTransactionManager transactionManager;

    /** Thông tin tối thiểu của đơn để tính hạn. */
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
        persist(computed);
        result.putAll(computed);
        return result;
    }

    private void persist(Map<Long, LocalDateTime> computed) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            tx.executeWithoutResult(status -> computed.forEach((id, due) ->
                    em.persist(BookingResponseDeadline.builder().bookingId(id).dueAt(due).build())));
        } catch (RuntimeException ex) {
            // Luồng khác vừa chốt hạn cho cùng đơn (trùng khóa): giá trị giống hệt vì cùng công thức, bỏ qua.
        }
    }
}

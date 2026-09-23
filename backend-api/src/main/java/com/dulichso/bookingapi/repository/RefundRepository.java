package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Refund;
import com.dulichso.bookingapi.entity.enums.RefundStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    /**
     * Lấy danh sách refund theo status, kèm booking và paymentTransaction để tránh N+1.
     */
    @EntityGraph(attributePaths = {"booking", "paymentTransaction", "processedBy"})
    List<Refund> findByStatusOrderByRequestedAtDesc(RefundStatus status);

    /**
     * Lấy 1 refund kèm toàn bộ quan hệ cần thiết để tránh N+1.
     */
    @EntityGraph(attributePaths = {"booking", "paymentTransaction", "processedBy"})
    Optional<Refund> findWithDetailsById(Long id);

    List<Refund> findByBookingId(Long bookingId);
}

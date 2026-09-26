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

    /** Tiền đã hoàn theo Homestay trong kỳ (theo ngày xử lý): [placeId, placeName, providerId, providerName, tổng tiền]. */
    @org.springframework.data.jpa.repository.Query("SELECT pl.id, pl.name, p.id, p.name, COALESCE(SUM(r.amount), 0) " +
            "FROM Refund r JOIN r.booking b JOIN b.place pl JOIN b.provider p " +
            "WHERE r.status = :status AND r.processedAt >= :from AND r.processedAt < :to " +
            "AND (:providerId IS NULL OR p.id = :providerId) GROUP BY pl.id, pl.name, p.id, p.name")
    List<Object[]> sumProcessedByPlace(@org.springframework.data.repository.query.Param("status") RefundStatus status,
                                       @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
                                       @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
                                       @org.springframework.data.repository.query.Param("providerId") Long providerId);

    /** Tiền hoàn đang chờ duyệt (hiện tại, không theo kỳ) theo Homestay: [placeId, placeName, providerId, providerName, tổng tiền]. */
    @org.springframework.data.jpa.repository.Query("SELECT pl.id, pl.name, p.id, p.name, COALESCE(SUM(r.amount), 0) " +
            "FROM Refund r JOIN r.booking b JOIN b.place pl JOIN b.provider p " +
            "WHERE r.status = :status AND (:providerId IS NULL OR p.id = :providerId) GROUP BY pl.id, pl.name, p.id, p.name")
    List<Object[]> sumByStatusPerPlace(@org.springframework.data.repository.query.Param("status") RefundStatus status,
                                       @org.springframework.data.repository.query.Param("providerId") Long providerId);
}

package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.PaymentTransaction;
import com.dulichso.bookingapi.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    @Query("SELECT COALESCE(SUM(pt.amount), 0) FROM PaymentTransaction pt WHERE pt.status = :status " +
           "AND pt.paidAt >= :from AND pt.paidAt < :to " +
           "AND (:providerId IS NULL OR pt.booking.provider.id = :providerId)")
    BigDecimal sumPaidInRange(@org.springframework.data.repository.query.Param("status") PaymentStatus status,
                              @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
                              @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
                              @org.springframework.data.repository.query.Param("providerId") Long providerId);

    @Query("SELECT pt FROM PaymentTransaction pt JOIN FETCH pt.gateway WHERE pt.booking.id = :bookingId ORDER BY pt.initiatedAt DESC")
    List<PaymentTransaction> findByBookingIdWithGateway(@org.springframework.data.repository.query.Param("bookingId") Long bookingId);

    /**
     * Tổng hợp doanh thu theo tháng từ giao dịch có status SUCCESS.
     * Trả về list dạng [year, month, totalAmount, count].
     */
    @Query("SELECT YEAR(pt.paidAt) AS year, MONTH(pt.paidAt) AS month, " +
           "SUM(pt.amount) AS totalAmount, COUNT(pt.id) AS count " +
           "FROM PaymentTransaction pt " +
           "WHERE pt.status = :status AND pt.paidAt IS NOT NULL " +
           "GROUP BY YEAR(pt.paidAt), MONTH(pt.paidAt) " +
           "ORDER BY YEAR(pt.paidAt) DESC, MONTH(pt.paidAt) DESC")
    List<Object[]> sumRevenueByMonth(@org.springframework.data.repository.query.Param("status") PaymentStatus status);

    /**
     * Tổng doanh thu toàn thời gian từ giao dịch SUCCESS.
     */
    @Query("SELECT SUM(pt.amount) FROM PaymentTransaction pt WHERE pt.status = :status")
    BigDecimal sumTotalRevenue(@org.springframework.data.repository.query.Param("status") PaymentStatus status);

    List<PaymentTransaction> findByBookingId(Long bookingId);
}

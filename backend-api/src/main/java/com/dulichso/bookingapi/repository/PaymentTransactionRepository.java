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
    List<Object[]> sumRevenueByMonth(PaymentStatus status);

    /**
     * Tổng doanh thu toàn thời gian từ giao dịch SUCCESS.
     */
    @Query("SELECT COALESCE(SUM(pt.amount), 0) FROM PaymentTransaction pt WHERE pt.status = :status")
    BigDecimal sumTotalRevenue(PaymentStatus status);

    List<PaymentTransaction> findByBookingId(Long bookingId);
}

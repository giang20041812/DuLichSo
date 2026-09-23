package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.CommissionLedger;
import com.dulichso.bookingapi.entity.enums.CommissionStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CommissionLedgerRepository extends JpaRepository<CommissionLedger, Long> {

    @EntityGraph(attributePaths = {"affiliateLink", "affiliateLink.account", "booking"})
    List<CommissionLedger> findByStatusOrderByCreatedAtDesc(CommissionStatus status);

    @EntityGraph(attributePaths = {"affiliateLink", "affiliateLink.account", "booking"})
    List<CommissionLedger> findAllByOrderByCreatedAtDesc();

    List<CommissionLedger> findByAffiliateLinkId(Long affiliateLinkId);

    @Query("SELECT COALESCE(SUM(cl.amount), 0) FROM CommissionLedger cl WHERE cl.status = :status")
    BigDecimal sumAmountByStatus(CommissionStatus status);
}

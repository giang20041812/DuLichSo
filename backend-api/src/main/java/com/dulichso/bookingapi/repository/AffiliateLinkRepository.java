package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.AffiliateLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AffiliateLinkRepository extends JpaRepository<AffiliateLink, Long> {

    Optional<AffiliateLink> findByCode(String code);

    List<AffiliateLink> findByAccountId(Long accountId);

    List<AffiliateLink> findByIsActiveTrue();

    boolean existsByCode(String code);
}

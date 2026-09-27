package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderRepository extends JpaRepository<Provider, Long> {

    List<Provider> findAllByOrderByCreatedAtDesc();

    List<Provider> findByStatusOrderByCreatedAtDesc(ProviderStatus status);

    long countByStatus(ProviderStatus status);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Query("SELECT p.provider.id, COUNT(p) FROM Place p WHERE p.provider IS NOT NULL AND p.isDeleted = false GROUP BY p.provider.id")
    List<Object[]> countPlacesByProvider();

    @Query("SELECT a.provider.id, COUNT(a) FROM Account a WHERE a.provider IS NOT NULL GROUP BY a.provider.id")
    List<Object[]> countAccountsByProvider();
}

package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Traveler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface TravelerRepository extends JpaRepository<Traveler, Long>, JpaSpecificationExecutor<Traveler> {
    Optional<Traveler> findByEmailIgnoreCase(String email);

    Optional<Traveler> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    long countByStatus(com.dulichso.bookingapi.entity.enums.AccountStatus status);

    long countByCreatedAtGreaterThanEqual(java.time.LocalDateTime since);
}

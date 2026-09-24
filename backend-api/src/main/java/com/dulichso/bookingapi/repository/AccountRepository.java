package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.provider WHERE a.email = :identifier OR a.phone = :identifier")
    Optional<Account> findByIdentifier(@Param("identifier") String identifier);

    Optional<Account> findByEmail(String email);

    List<Account> findByProviderIdOrderByIdAsc(Long providerId);

    Optional<Account> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    long countByStatus(com.dulichso.bookingapi.entity.enums.AccountStatus status);

    @Query("""
        SELECT a FROM Account a LEFT JOIN FETCH a.provider 
        WHERE (:role IS NULL OR a.role = :role)
          AND (:status IS NULL OR a.status = :status)
          AND (:keyword IS NULL OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) 
               OR LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%')) 
               OR a.phone LIKE CONCAT('%', :keyword, '%'))
        ORDER BY a.createdAt DESC
    """)
    java.util.List<Account> searchAccounts(
            @Param("role") com.dulichso.bookingapi.entity.enums.AccountRole role,
            @Param("status") com.dulichso.bookingapi.entity.enums.AccountStatus status,
            @Param("keyword") String keyword);
}

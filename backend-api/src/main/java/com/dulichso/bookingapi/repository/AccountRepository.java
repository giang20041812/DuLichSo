package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.provider WHERE a.email = :identifier OR a.phone = :identifier")
    Optional<Account> findByIdentifier(@Param("identifier") String identifier);

    Optional<Account> findByEmail(String email);

    Optional<Account> findByPhone(String phone);
}

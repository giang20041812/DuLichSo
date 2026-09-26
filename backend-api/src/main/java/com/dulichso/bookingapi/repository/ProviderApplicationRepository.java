package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.ProviderApplication;
import com.dulichso.bookingapi.entity.enums.ProviderApplicationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProviderApplicationRepository extends JpaRepository<ProviderApplication, Long>, JpaSpecificationExecutor<ProviderApplication> {

    /** Khóa hồ sơ khi duyệt/từ chối để hai Admin không xử lý trùng và không tạo hai Provider cho một hồ sơ. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from ProviderApplication a where a.id = :id")
    Optional<ProviderApplication> findByIdForUpdate(@Param("id") Long id);

    long countByStatus(ProviderApplicationStatus status);
}

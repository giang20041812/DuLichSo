package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    java.util.List<AuditLog> findTop20ByOrderByCreatedAtDescIdDesc();
}

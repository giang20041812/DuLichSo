package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    java.util.List<AuditLog> findTop20ByOrderByCreatedAtDescIdDesc();

    /** Các bản ghi gần nhất trừ những hành động chỉ định (vd: sự kiện đăng nhập dày đặc). */
    java.util.List<AuditLog> findTop20ByActionNotInOrderByCreatedAtDescIdDesc(java.util.Collection<String> actions);
}

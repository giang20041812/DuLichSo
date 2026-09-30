package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.provider WHERE a.email = :identifier OR a.phone = :identifier")
    Optional<Account> findByIdentifier(@Param("identifier") String identifier);

    /**
     * Khóa ghi (pessimistic write) khi Admin đổi trạng thái/quyền tài khoản — chống double-submit (2 request
     * đổi trạng thái/quyền cùng tài khoản gửi gần như đồng thời) làm sai lệch audit log hoặc bỏ qua các điều
     * kiện kiểm tra "trạng thái hiện tại" (vd: không hạ quyền Admin cuối cùng, không tự khóa chính mình).
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.provider WHERE a.id = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);

    /** Ghi nhận hoạt động của phiên mà không nạp/ghi lại toàn bộ entity (chạy ngoài transaction của request). */
    @Modifying
    @Transactional
    @Query("UPDATE Account a SET a.lastActivityAt = :at WHERE a.id = :id")
    int touchActivity(@Param("id") Long id, @Param("at") java.time.LocalDateTime at);

    Optional<Account> findByEmail(String email);

    List<Account> findByProviderIdOrderByIdAsc(Long providerId);

    /** Chỉ lấy account đầu tiên của provider — dùng để kiểm tra trạng thái provider account (tránh load toàn list). */
    Optional<Account> findFirstByProviderIdOrderByIdAsc(Long providerId);

    Optional<Account> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    long countByStatus(com.dulichso.bookingapi.entity.enums.AccountStatus status);

    long countByRole(com.dulichso.bookingapi.entity.enums.AccountRole role);

    /** Tài khoản seed chưa được đặt mật khẩu (xem SeedAccountPasswordInitializer.PENDING_HASH). */
    List<Account> findAllByPasswordHash(String passwordHash);

    long countByRoleAndStatus(com.dulichso.bookingapi.entity.enums.AccountRole role, com.dulichso.bookingapi.entity.enums.AccountStatus status);

    /** Số quản trị viên cấp 1 đang hoạt động (ADMIN chưa gán cấp được coi là cấp 1). */
    @Query("select count(a) from Account a where a.role = com.dulichso.bookingapi.entity.enums.AccountRole.ADMIN "
            + "and a.status = com.dulichso.bookingapi.entity.enums.AccountStatus.ACTIVE "
            + "and (a.adminLevel is null or a.adminLevel = 1)")
    long countActiveLevelOneAdmins();

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

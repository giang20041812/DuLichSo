package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /** OTP mới nhất chưa dùng của một chủ thể. */
    Optional<PasswordResetToken> findFirstBySubjectTypeAndSubjectIdAndUsedAtIsNullOrderByIdDesc(String subjectType, Long subjectId);

    Optional<PasswordResetToken> findFirstBySubjectTypeAndSubjectIdOrderByIdDesc(String subjectType, Long subjectId);

    long countBySubjectTypeAndSubjectIdAndCreatedAtAfter(String subjectType, Long subjectId, LocalDateTime since);

    /** Vô hiệu hóa mọi OTP còn hiệu lực của chủ thể (khi phát hành OTP mới hoặc đổi mật khẩu thành công). */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.usedAt = :now WHERE t.subjectType = :type AND t.subjectId = :id AND t.usedAt IS NULL")
    int invalidateAll(@Param("type") String type, @Param("id") Long id, @Param("now") LocalDateTime now);
}

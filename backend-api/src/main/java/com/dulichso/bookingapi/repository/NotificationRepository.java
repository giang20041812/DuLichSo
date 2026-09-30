package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Thông báo của khách (endpoint công khai, không đăng nhập). Chỉ trả thông báo loại CUSTOMER: thông báo gửi cho
     * Admin (recipientType = ACCOUNT) chứa thông tin nghiệp vụ nên không được đọc được qua tham số accountId công khai.
     */
    @Query("SELECT n FROM Notification n WHERE n.recipientType = com.dulichso.bookingapi.entity.enums.RecipientType.CUSTOMER AND (" +
           "(:email IS NOT NULL AND LOWER(n.recipientEmail) = LOWER(:email)) OR " +
           "(:phone IS NOT NULL AND n.recipientPhone = :phone) OR " +
           "(:accountId IS NOT NULL AND n.recipientAccount.id = :accountId)) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findNotificationsForCustomer(
            @Param("email") String email,
            @Param("phone") String phone,
            @Param("accountId") Long accountId);

    List<Notification> findByRelatedEntityTypeAndRelatedEntityId(String relatedEntityType, Long relatedEntityId);

    /** Thông báo gần nhất của một tài khoản (Admin). */
    List<Notification> findTop50ByRecipientAccountIdOrderByCreatedAtDescIdDesc(Long accountId);

    Optional<Notification> findByIdAndRecipientAccountId(Long id, Long accountId);
}

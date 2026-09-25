package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE " +
           "(:email IS NOT NULL AND LOWER(n.recipientEmail) = LOWER(:email)) OR " +
           "(:phone IS NOT NULL AND n.recipientPhone = :phone) OR " +
           "(:accountId IS NOT NULL AND n.recipientAccount.id = :accountId) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findNotificationsForCustomer(
            @Param("email") String email,
            @Param("phone") String phone,
            @Param("accountId") Long accountId);

    List<Notification> findByRelatedEntityTypeAndRelatedEntityId(String relatedEntityType, Long relatedEntityId);
}

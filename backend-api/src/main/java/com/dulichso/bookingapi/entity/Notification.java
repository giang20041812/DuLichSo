package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.NotificationChannel;
import com.dulichso.bookingapi.entity.enums.RecipientType;
import com.dulichso.bookingapi.entity.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "notification")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_code", referencedColumnName = "code", nullable = false)
    private NotificationTemplate template;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false)
    private RecipientType recipientType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_account_id")
    private Account recipientAccount;
    
    @Column(name = "recipient_phone", length = 32)
    private String recipientPhone;
    @Column(name = "recipient_email")
    private String recipientEmail;
    
    @Column(name = "related_entity_type", length = 64)
    private String relatedEntityType;
    @Column(name = "related_entity_id")
    private Long relatedEntityId;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", nullable = false)
    private Map<String, Object> payload;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;
    
    @Column(name = "error_message", length = 500)
    private String errorMessage;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}

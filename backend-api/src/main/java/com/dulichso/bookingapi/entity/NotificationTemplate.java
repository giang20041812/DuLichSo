package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.NotificationChannel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_template")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 64)
    private String code;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel;
    
    @Column(length = 255)
    private String subject;
    @Column(name = "body_template", nullable = false, columnDefinition = "TEXT")
    private String bodyTemplate;
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}

package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.ActorType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "audit_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActorType actor;
    
    @Column(name = "actor_id")
    private Long actorId;
    @Column(nullable = false, length = 128)
    private String action;
    @Column(name = "entity_type", nullable = false, length = 64)
    private String entityType;
    @Column(name = "entity_id", nullable = false)
    private Long entityId;
    @Column(length = 500)
    private String reason;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_data", columnDefinition = "json")
    private Map<String, Object> beforeData;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_data", columnDefinition = "json")
    private Map<String, Object> afterData;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

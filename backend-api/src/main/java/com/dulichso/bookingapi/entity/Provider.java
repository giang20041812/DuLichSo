package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "provider")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Provider {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(name = "contact_name")
    private String contactName;
    @Column(name = "contact_phone", length = 32)
    private String contactPhone;
    @Column(name = "contact_email")
    private String contactEmail;
    @Column(length = 500)
    private String address;
    @Column(columnDefinition = "TEXT")
    private String note;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProviderStatus status = ProviderStatus.ACTIVE;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

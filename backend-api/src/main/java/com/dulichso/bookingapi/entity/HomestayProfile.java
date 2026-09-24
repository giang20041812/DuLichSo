package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "homestay_profile")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class HomestayProfile {
    @Id
    private Long placeId;
    
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "place_id")
    private Place place;
    
    @Column(name = "check_in_from")
    private LocalTime checkInFrom;
    @Column(name = "check_out_until")
    private LocalTime checkOutUntil;
    @Column(name = "house_rules", columnDefinition = "TEXT")
    private String houseRules;
    @Column(name = "surcharge_note", columnDefinition = "TEXT")
    private String surchargeNote;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_policy_id")
    private CancellationPolicy currentPolicy;
    
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

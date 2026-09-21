package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payment_gateway")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentGateway {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 32)
    private String code;
    @Column(nullable = false, length = 128)
    private String name;
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

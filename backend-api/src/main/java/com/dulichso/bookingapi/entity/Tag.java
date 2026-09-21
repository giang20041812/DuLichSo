package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tag")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Tag {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "group_code", nullable = false, length = 64)
    private String groupCode;
    @Column(nullable = false, unique = true, length = 191)
    private String slug;
    @Column(nullable = false)
    private String name;
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

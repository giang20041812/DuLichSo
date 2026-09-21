package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "region")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Region {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 64)
    private String code;
    @Column(nullable = false)
    private String name;
    @Column(name = "name_norm", nullable = false)
    private String nameNorm;
    @Column(nullable = false)
    private Short level;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Region parent;
    
    @Column(nullable = false)
    private String path;
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

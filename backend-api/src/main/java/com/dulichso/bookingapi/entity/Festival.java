package com.dulichso.bookingapi.entity;

import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "festival")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Festival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 191)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_norm", nullable = false)
    private String nameNorm;

    @Column(name = "season_note", length = 500)
    private String seasonNote;

    @Column(name = "core_value", columnDefinition = "TEXT")
    private String coreValue;

    @Column(name = "suitable_experience", columnDefinition = "TEXT")
    private String suitableExperience;

    @Column(name = "etiquette_dont", columnDefinition = "TEXT")
    private String etiquetteDont;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "location", length = 255)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PlaceVisibility visibility = PlaceVisibility.DRAFT;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "festival", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FestivalOccurrence> occurrences = new ArrayList<>();
}

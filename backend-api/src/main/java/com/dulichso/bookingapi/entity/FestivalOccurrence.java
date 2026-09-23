package com.dulichso.bookingapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "festival_occurrence")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FestivalOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "festival_id", nullable = false)
    private Festival festival;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "is_estimated", nullable = false)
    @Builder.Default
    private Boolean isEstimated = true;

    @Column(length = 500)
    private String note;
}

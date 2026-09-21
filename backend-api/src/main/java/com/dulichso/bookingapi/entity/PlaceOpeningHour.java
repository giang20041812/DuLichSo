package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "place_opening_hour")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceOpeningHour {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;
    
    @Column(name = "day_of_week", nullable = false)
    private Byte dayOfWeek;
    
    @Column(name = "open_time")
    private LocalTime openTime;
    @Column(name = "close_time")
    private LocalTime closeTime;
    
    @Column(name = "is_closed", nullable = false)
    private Boolean isClosed = false;
}

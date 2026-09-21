package com.dulichso.bookingapi.entity;
import com.dulichso.bookingapi.entity.keys.BookingNightId;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "booking_night")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingNight {
    @EmbeddedId
    private BookingNightId id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("bookingId")
    @JoinColumn(name = "booking_id")
    private Booking booking;
    
    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;
    @Column(name = "room_count", nullable = false)
    private Integer roomCount;
}

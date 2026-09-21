package com.dulichso.bookingapi.entity.keys;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingNightId implements Serializable {
    private Long bookingId;
    private java.time.LocalDate stayDate;
}

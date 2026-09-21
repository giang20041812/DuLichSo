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
public class RoomTypeMediaId implements Serializable {
    private Long roomTypeId;
    private Long mediaId;
}

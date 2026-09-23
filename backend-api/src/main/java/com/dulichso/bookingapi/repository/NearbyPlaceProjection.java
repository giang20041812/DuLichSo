package com.dulichso.bookingapi.repository;

import java.math.BigDecimal;

public interface NearbyPlaceProjection {
    Long getId();
    String getName();
    String getKind();
    Double getDistance();
    BigDecimal getLatitude();
    BigDecimal getLongitude();
    String getAddress();
}


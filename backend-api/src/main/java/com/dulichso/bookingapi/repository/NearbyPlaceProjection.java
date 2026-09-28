package com.dulichso.bookingapi.repository;

import java.math.BigDecimal;

public interface NearbyPlaceProjection {
    Long getId();
    String getName();
    String getDescription();
    String getImageUrl();
    String getKind();
    Double getDistance();
    BigDecimal getLatitude();
    BigDecimal getLongitude();
    String getAddress();
}


package com.dulichso.bookingapi.repository;

public interface NearbyPlaceProjection {
    Long getId();
    String getName();
    String getKind();
    Double getDistance();
}

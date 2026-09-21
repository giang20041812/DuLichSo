package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.MapContextDto;
import com.dulichso.bookingapi.dto.PlaceDetailDto;
import com.dulichso.bookingapi.dto.RoomTypeDetailDto;

import java.util.List;

public interface PlaceDetailService {
    PlaceDetailDto getPlaceDetail(String slug);
    List<RoomTypeDetailDto> getPlaceRooms(String slug);
    MapContextDto getMapContext(String slug);
}

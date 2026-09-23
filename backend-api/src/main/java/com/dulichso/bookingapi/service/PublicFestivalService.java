package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.FestivalDto;
import java.util.List;

public interface PublicFestivalService {
    List<FestivalDto> getPublishedFestivals();
}

package com.dulichso.bookingapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FestivalDto {
    private Long id;
    private String slug;
    private String name;
    private String seasonNote;
    private String coreValue;
    private String suitableExperience;
    private String etiquetteDont;
    private String regionName;
    private String coverImageUrl;
    private String location;
    private String highlightTag;
    private List<String> activities;
    
    // Thuộc tính tính toán thời gian diễn ra
    private Boolean isCurrentSeason;
    private LocalDate nextPeriodStart;
    private LocalDate nextPeriodEnd;
    private String timeRange;
}

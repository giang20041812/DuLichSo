package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.FestivalDto;
import com.dulichso.bookingapi.entity.Festival;
import com.dulichso.bookingapi.entity.FestivalOccurrence;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import com.dulichso.bookingapi.repository.FestivalRepository;
import com.dulichso.bookingapi.service.PublicFestivalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicFestivalServiceImpl implements PublicFestivalService {

    private final FestivalRepository festivalRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FestivalDto> getPublishedFestivals() {
        List<Festival> festivals = festivalRepository.findByVisibilityAndIsDeletedFalseOrderByIdAsc(PlaceVisibility.PUBLISHED);
        LocalDate today = LocalDate.now();

        return festivals.stream().map(f -> {
            boolean isCurrent = false;
            LocalDate nextStart = null;
            LocalDate nextEnd = null;

            if (f.getOccurrences() != null && !f.getOccurrences().isEmpty()) {
                for (FestivalOccurrence occ : f.getOccurrences()) {
                    if ((today.isEqual(occ.getPeriodStart()) || today.isAfter(occ.getPeriodStart()))
                            && (today.isEqual(occ.getPeriodEnd()) || today.isBefore(occ.getPeriodEnd()))) {
                        isCurrent = true;
                        nextStart = occ.getPeriodStart();
                        nextEnd = occ.getPeriodEnd();
                        break;
                    } else if (occ.getPeriodStart().isAfter(today)) {
                        if (nextStart == null || occ.getPeriodStart().isBefore(nextStart)) {
                            nextStart = occ.getPeriodStart();
                            nextEnd = occ.getPeriodEnd();
                        }
                    }
                }
            }

            // Mặc định fallback tính theo tháng nếu DB chưa có ngày cụ thể
            int currentMonth = today.getMonthValue();
            if (!isCurrent) {
                if ("mua-vang-kham-pha-ruong-bac-thang".equals(f.getSlug()) && (currentMonth == 9 || currentMonth == 10)) {
                    isCurrent = true;
                } else if ("mung-com-moi".equals(f.getSlug()) && (currentMonth >= 9 && currentMonth <= 11)) {
                    isCurrent = true;
                }
            }

            String timeRange = f.getSeasonNote();
            if (nextStart != null && nextEnd != null) {
                timeRange = String.format("%02d/%02d – %02d/%02d/%d", 
                        nextStart.getDayOfMonth(), nextStart.getMonthValue(),
                        nextEnd.getDayOfMonth(), nextEnd.getMonthValue(), nextEnd.getYear());
            }

            // Gợi ý ảnh theo slug
            String coverUrl = getCoverUrlBySlug(f.getSlug());

            // Tách hoạt động từ suitableExperience
            List<String> activities = extractActivities(f.getSuitableExperience());

            return FestivalDto.builder()
                    .id(f.getId())
                    .slug(f.getSlug())
                    .name(f.getName())
                    .seasonNote(f.getSeasonNote())
                    .coreValue(f.getCoreValue())
                    .suitableExperience(f.getSuitableExperience())
                    .etiquetteDont(f.getEtiquetteDont())
                    .regionName(f.getRegion() != null ? f.getRegion().getName() : "Mù Cang Chải")
                    .coverImageUrl(coverUrl)
                    .location(getLocationBySlug(f.getSlug()))
                    .highlightTag(isCurrent ? "Đang Diễn Ra" : "Di Sản Văn Hóa")
                    .activities(activities)
                    .isCurrentSeason(isCurrent)
                    .nextPeriodStart(nextStart)
                    .nextPeriodEnd(nextEnd)
                    .timeRange(timeRange)
                    .build();
        }).collect(Collectors.toList());
    }

    private String getCoverUrlBySlug(String slug) {
        if ("mua-vang-kham-pha-ruong-bac-thang".equals(slug)) {
            return "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80";
        } else if ("mung-com-moi".equals(slug)) {
            return "https://images.unsplash.com/photo-1542159040-3b03f0b2f059?auto=format&fit=crop&w=1200&q=80";
        } else if ("festival-khen-mong".equals(slug)) {
            return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80";
        } else if ("hoa-to-day".equals(slug)) {
            return "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1200&q=80";
        } else if ("gau-tao".equals(slug)) {
            return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
        }
        return "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80";
    }

    private String getLocationBySlug(String slug) {
        if ("mua-vang-kham-pha-ruong-bac-thang".equals(slug)) {
            return "Đồi Mâm Xôi, Đồi Móng Ngựa, La Pán Tẩn";
        } else if ("mung-com-moi".equals(slug)) {
            return "Bản Lìm Mông, Tú Lệ & Bản Nậm Khắt";
        } else if ("festival-khen-mong".equals(slug)) {
            return "Trung tâm Thị trấn Mù Cang Chải";
        } else if ("hoa-to-day".equals(slug)) {
            return "Xã Nậm Khắt, Púng Luông, La Pán Tẩn";
        } else if ("gau-tao".equals(slug)) {
            return "Bản Dế Xu Phình & Bản Chế Cu Nha";
        }
        return "Huyện Mù Cang Chải, Tỉnh Yên Bái";
    }

    private List<String> extractActivities(String exp) {
        if (exp == null || exp.isEmpty()) {
            return List.of("Trải nghiệm văn hóa", "Khám phá bản sắc");
        }
        String firstLine = exp.split("\n")[0];
        String[] parts = firstLine.split(";");
        List<String> list = new ArrayList<>();
        for (String p : parts) {
            String trimmed = p.trim();
            if (!trimmed.isEmpty() && trimmed.length() <= 35) {
                list.add(trimmed);
            }
        }
        return list.isEmpty() ? List.of("Trải nghiệm văn hóa", "Khám phá bản sắc") : list;
    }
}

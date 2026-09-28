package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.entity.HomestayProfile;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class ResponseDeadlineCalculatorTest {
    private static LocalDateTime at(int day, int hour, int minute) { return LocalDateTime.of(2026, 9, day, hour, minute); }

    @Test
    void defaultWindowMatchesSequenceDiagramExamples() {
        // Trong khung giờ: đủ 120 phút ngay trong ngày
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 10, 0), null)).isEqualTo(at(10, 12, 0));
        // 20:30 -> 30 phút hôm nay, 90 phút từ 05:00 hôm sau -> 06:30
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 20, 30), null)).isEqualTo(at(11, 6, 30));
        // 23:00 ngoài khung -> bắt đầu 05:00 hôm sau -> 07:00
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 23, 0), null)).isEqualTo(at(11, 7, 0));
        // 03:00 sáng trước khung -> 05:00 cùng ngày + 120 phút
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 3, 0), null)).isEqualTo(at(10, 7, 0));
        // Đúng 21:00 là hết khung
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 21, 0), null)).isEqualTo(at(11, 7, 0));
    }

    @Test
    void usesTheWindowChosenByPartner() {
        HomestayProfile profile = HomestayProfile.builder().processingStartTime(LocalTime.of(7, 0)).processingEndTime(LocalTime.of(22, 0)).build();
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 21, 30), profile)).isEqualTo(at(11, 8, 30));
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 6, 0), profile)).isEqualTo(at(10, 9, 0));
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 20, 0), profile)).isEqualTo(at(10, 22, 0));
    }

    @Test
    void shortWindowCarriesOverSeveralDays() {
        // Khung 1 tiếng/ngày: 120 phút trải qua 2 ngày
        LocalDateTime due = ResponseDeadlineCalculator.deadline(at(10, 8, 30), LocalTime.of(8, 0), LocalTime.of(9, 0), Duration.ofMinutes(120));
        assertThat(due).isEqualTo(at(12, 8, 30));
    }

    @Test
    void invalidOrMissingWindowFallsBackToDefault() {
        HomestayProfile empty = HomestayProfile.builder().build();
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 20, 30), empty)).isEqualTo(at(11, 6, 30));
        assertThat(ResponseDeadlineCalculator.deadline(at(10, 20, 30), LocalTime.of(22, 0), LocalTime.of(6, 0), Duration.ofMinutes(120)))
                .isEqualTo(at(11, 6, 30));
        assertThat(ResponseDeadlineCalculator.isValidWindow(LocalTime.of(9, 0), LocalTime.of(9, 0))).isFalse();
        assertThat(ResponseDeadlineCalculator.isValidWindow(LocalTime.of(0, 0), LocalTime.of(23, 59))).isTrue();
    }
}

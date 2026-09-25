package com.dulichso.bookingapi.dto.partner;

import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** DTO cho màn hình xử lý đơn đặt phòng của nhà cung cấp (FR-NCC-12..21). */
public final class PartnerBookingDtos {
    private PartnerBookingDtos() {}

    public enum CheckLevel { OK, WARN, FAIL }

    /** Một mục kiểm tra tự động hiển thị cho nhà cung cấp trước khi quyết định. */
    public record CheckDto(String code, String label, CheckLevel level, String detail) {}

    public record NightDto(LocalDate stayDate, BigDecimal unitPrice, Integer roomCount) {}

    public record ServiceItemDto(String serviceName, String note) {}

    /** FR-NCC-14: yêu cầu bổ sung thông tin và phản hồi của khách. */
    public record InfoRequestDto(Long id, String message, LocalDateTime createdAt, String responseText, LocalDateTime respondedAt) {}

    public record HistoryDto(BookingStatus fromStatus, BookingStatus toStatus, ActorType actor, String reason, LocalDateTime createdAt) {}

    /** Phương án phòng trong cùng Homestay cho đúng khoảng ngày và số phòng của đơn. */
    public record RoomOptionDto(Long roomTypeId, String name, Integer maxOccupancy, boolean current,
                                int availableRooms, boolean capacityOk, boolean suitable,
                                BigDecimal totalAmount, String unavailableReason) {}

    public record BookingDetailDto(Long id, String bookingCode, BookingStatus status,
                                   Long placeId, String placeName, Long roomTypeId, String roomTypeName,
                                   LocalDate checkIn, LocalDate checkOut, Integer nights, Integer roomCount, Integer guestCount,
                                   String guestName, String guestPhone, String guestEmail, String guestNote,
                                   BigDecimal totalAmount, String currency,
                                   LocalDateTime createdAt, LocalDateTime holdExpiresAt, LocalDateTime paymentDeadlineAt,
                                   LocalDateTime confirmedAt, LocalDateTime closedAt, String closeReason,
                                   Map<String, Object> policySnapshot,
                                   List<NightDto> nightPrices, List<ServiceItemDto> serviceItems, List<HistoryDto> history,
                                   List<InfoRequestDto> infoRequests,
                                   List<CheckDto> checks, List<RoomOptionDto> roomOptions,
                                   boolean canAccept, boolean canReject, boolean canRequestInfo) {}

    /** roomTypeId null = giữ nguyên loại phòng khách đã chọn. note: phản hồi yêu cầu đặc biệt / điều kiện gửi khách. */
    public record AcceptInput(Long roomTypeId, @Size(max = 500) String note) {}

    public record RejectInput(@NotBlank @Size(max = 500) String reason) {}

    public record InfoRequestInput(@NotBlank @Size(max = 500) String message) {}
}

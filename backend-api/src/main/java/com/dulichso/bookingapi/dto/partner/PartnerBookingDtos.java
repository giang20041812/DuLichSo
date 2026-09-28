package com.dulichso.bookingapi.dto.partner;

import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.InventoryDto;
import com.dulichso.bookingapi.entity.BookingEvaluation.Conclusion;
import com.dulichso.bookingapi.entity.enums.ActorType;
import com.dulichso.bookingapi.service.AdminBookingService.BookingDto;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
                                   boolean canAccept, boolean canReject, boolean canRequestInfo,
                                   List<StayAction> stayActions,
                                   LocalDateTime responseDueAt, boolean overdue,
                                   List<InventoryDto> availability, EvaluationDto evaluation, boolean canEvaluate) {}

    /**
     * UC-NCC-07: kết luận đánh giá khả năng đáp ứng. specialRequestResult bắt buộc khi khách có yêu cầu đặc biệt.
     * Phương án phòng luôn là phương án khách đã chọn; muốn đổi phòng/ngày/giá thì kết luận NEEDS_ADJUSTMENT và đề xuất cho khách.
     */
    public record EvaluationInput(@NotNull Conclusion conclusion, @Size(max = 1000) String specialRequestResult, @Size(max = 1000) String note) {}

    /** stale = dữ liệu loại phòng đã đổi sau khi đánh giá, phải kiểm tra lại trước khi quyết định. */
    public record EvaluationDto(Conclusion conclusion, String specialRequestResult, String note, LocalDateTime evaluatedAt, boolean stale) {}

    /** Một dòng danh sách đơn của NCC: dữ liệu chung + hạn phản hồi (UC-NCC-06). */
    public record BookingRowDto(@JsonUnwrapped BookingDto booking, LocalDateTime responseDueAt) {}

    /** roomTypeId: chỉ được null hoặc đúng loại phòng khách đã chọn (UC-NCC-08: NCC không tự đổi sản phẩm). note: lời nhắn gửi khách. */
    public record AcceptInput(Long roomTypeId, @Size(max = 500) String note) {}

    public record RejectInput(@NotBlank @Size(max = 500) String reason) {}

    public record InfoRequestInput(@NotBlank @Size(max = 500) String message) {}

    /** Vận hành lưu trú sau khi đơn đã xác nhận: nhận phòng, trả phòng, hoàn thành, khách không đến. */
    public enum StayAction { CHECK_IN, CHECK_OUT, COMPLETE, NO_SHOW }

    public record StayActionInput(@jakarta.validation.constraints.NotNull StayAction action, @Size(max = 500) String note) {}
}

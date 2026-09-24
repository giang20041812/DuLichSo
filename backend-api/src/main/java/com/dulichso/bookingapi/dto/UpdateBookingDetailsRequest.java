package com.dulichso.bookingapi.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBookingDetailsRequest {

    private String guestName;

    private String guestPhone;

    private String guestEmail;

    private String guestNote;

    private LocalDate checkIn;

    private LocalDate checkOut;

    @Min(value = 1, message = "Số lượng phòng tối thiểu là 1")
    @Max(value = 50, message = "Số lượng phòng tối đa là 50")
    private Integer roomCount;

    @Min(value = 1, message = "Số lượng khách tối thiểu là 1")
    @Max(value = 100, message = "Số lượng khách tối đa là 100")
    private Integer guestCount;

    /**
     * Lý do yêu cầu thay đổi (dành cho booking trạng thái CONFIRMED gửi lên Quản lý duyệt)
     */
    private String reason;

    /**
     * Danh sách dịch vụ tư vấn đã chọn / cập nhật
     */
    private java.util.List<CreateBookingRequest.ServiceItemRequest> serviceItems;
}

package com.dulichso.bookingapi.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateBookingRequest {

    @NotNull(message = "placeId không được để trống")
    private Long placeId;

    @NotNull(message = "roomTypeId không được để trống")
    private Long roomTypeId;

    @NotNull(message = "checkIn không được để trống")
    private LocalDate checkIn;

    @NotNull(message = "checkOut không được để trống")
    private LocalDate checkOut;

    @NotNull(message = "roomCount không được để trống")
    @Min(value = 1, message = "roomCount tối thiểu là 1")
    private Integer roomCount;

    @NotNull(message = "guestCount không được để trống")
    @Min(value = 1, message = "guestCount tối thiểu là 1")
    private Integer guestCount;

    @NotBlank(message = "guestName không được để trống")
    private String guestName;

    @NotBlank(message = "guestPhone không được để trống")
    private String guestPhone;

    private String guestEmail;

    private String guestNote;

    private List<String> specialRequests;

    private List<ServiceItemRequest> serviceItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceItemRequest {
        private String serviceName;
        private String serviceCode;
        private String note;
    }
}

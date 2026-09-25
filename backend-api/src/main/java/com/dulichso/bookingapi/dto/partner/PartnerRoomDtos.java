package com.dulichso.bookingapi.dto.partner;

import com.dulichso.bookingapi.entity.enums.AmenityValue;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class PartnerRoomDtos {
    public record BedDto(@NotBlank @Size(max=32) String bedType, @NotNull @Min(1) @Max(100) Integer quantity) {}
    public record RoomInput(@NotBlank @Size(max=255) String name, @Size(max=10000) String description,
            @NotNull @Min(1) @Max(1000) Integer maxOccupancy, @NotNull @Min(1) @Max(10000) Integer totalRoomCount,
            @NotNull AmenityValue privateBathroom, @DecimalMin("0.01") @DecimalMax("9999.99") BigDecimal areaSqm,
            @NotNull @DecimalMin("0") @DecimalMax("999999999999") @Digits(integer=12,fraction=0) BigDecimal basePrice,
            @NotNull @Pattern(regexp="ACTIVE|INACTIVE") String status, @Size(max=500) String viewDescription,
            @NotNull @Size(max=30) List<@Valid BedDto> beds, @NotNull @Size(max=100) List<Long> amenityIds) {}
    public record RoomDto(Long id, Long placeId, String name, String description, Integer maxOccupancy, Integer totalRoomCount,
            AmenityValue privateBathroom, BigDecimal areaSqm, BigDecimal basePrice, String status, String viewDescription,
            List<BedDto> beds, List<Long> amenityIds) {}
    public record PriceInput(@NotBlank @Size(max=255) String name, @NotNull LocalDate periodStart, @NotNull LocalDate periodEnd,
            @NotNull @DecimalMin("0") @DecimalMax("999999999999") @Digits(integer=12,fraction=0) BigDecimal price) {}
    public record PriceDto(Long id, String name, LocalDate periodStart, LocalDate periodEnd, BigDecimal price) {}
    public record InventoryInput(@NotNull LocalDate startDate, @NotNull LocalDate endDate,
            @NotNull @Min(0) @Max(10000) Integer totalRooms, @NotNull Boolean stopSell) {}
    public record InventoryDto(LocalDate stayDate, int totalRooms, int heldRooms, int confirmedRooms, int availableRooms, boolean stopSell, BigDecimal price) {}
    public record QuoteDto(Long roomTypeId, int availableRooms, boolean suitable, BigDecimal totalAmount, List<InventoryDto> nights) {}
}

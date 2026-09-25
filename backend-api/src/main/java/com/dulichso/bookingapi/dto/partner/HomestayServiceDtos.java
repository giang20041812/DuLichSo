package com.dulichso.bookingapi.dto.partner;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public final class HomestayServiceDtos {
    public record Input(@NotBlank @Size(max=255) String name,@Size(max=10000) String description,
            @DecimalMin("0") @Digits(integer=12,fraction=0) BigDecimal price,@Size(max=64) String priceUnit,boolean active) {}
    public record ServiceDto(Long id,String name,String description,BigDecimal price,String priceUnit,boolean active) {}
}

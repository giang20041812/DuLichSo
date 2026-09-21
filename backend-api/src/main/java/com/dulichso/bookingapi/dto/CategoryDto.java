package com.dulichso.bookingapi.dto;

import com.dulichso.bookingapi.entity.enums.CategoryKind;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    private Long id;
    private CategoryKind kind;
    private String slug;
    private String name;
    private String description;
}

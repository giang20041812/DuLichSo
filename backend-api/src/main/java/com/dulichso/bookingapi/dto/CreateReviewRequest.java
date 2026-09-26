package com.dulichso.bookingapi.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequest {

    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
    private Byte rating;

    @NotBlank(message = "Nội dung nhận xét không được để trống")
    @Size(min = 5, max = 2000, message = "Nội dung đánh giá phải từ 5 đến 2000 ký tự")
    private String content;

    private java.util.List<String> images;
}

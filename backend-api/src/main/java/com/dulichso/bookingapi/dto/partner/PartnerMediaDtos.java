package com.dulichso.bookingapi.dto.partner;

import com.dulichso.bookingapi.entity.enums.MediaRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** FR-NCC-02 / FR-NCC-07: ảnh Homestay và ảnh loại phòng (Cloudflare Images Direct Creator Upload). */
public final class PartnerMediaDtos {
    private PartnerMediaDtos() {}

    /** Giới hạn kiểm tra ở client trước khi upload; Cloudflare Images tự chặn file không phải ảnh và file vượt giới hạn dịch vụ. */
    public static final long MAX_FILE_BYTES = 10L * 1024 * 1024;
    public static final int MAX_IMAGES_PER_OWNER = 30;

    public record DirectUploadDto(String uploadUrl, String imageId, long maxFileBytes, List<String> allowedTypes) {}

    public record AttachInput(@NotBlank @Size(max = 100) @Pattern(regexp = "[A-Za-z0-9-]+") String imageId, @Size(max = 500) String caption) {}

    public record MediaDto(Long mediaId, String url, MediaRole role, String caption, Integer sortOrder) {}
}

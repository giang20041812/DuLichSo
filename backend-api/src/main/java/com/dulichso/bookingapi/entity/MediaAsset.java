package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "media_asset")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MediaAsset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;
    @Column(name = "public_url", length = 1000)
    private String publicUrl;
    @Column(name = "mime_type", nullable = false, length = 128)
    private String mimeType;
    @Column(name = "width_px")
    private Integer widthPx;
    @Column(name = "height_px")
    private Integer heightPx;
    @Column(name = "size_bytes")
    private Long sizeBytes;
    @Column(name = "checksum_sha256", unique = true, columnDefinition = "CHAR(64)")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CHAR)
    private String checksumSha256;
    @Column(name = "alt_text", length = 500)
    private String altText;
    @Column(length = 255)
    private String credit;
    @Column(name = "source_url", length = 1000)
    private String sourceUrl;
    @Column(name = "license_note", columnDefinition = "TEXT")
    private String licenseNote;
    
    @Column(name = "uploaded_by")
    private Long uploadedBy; // Should be Account relation, but keeping simple
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

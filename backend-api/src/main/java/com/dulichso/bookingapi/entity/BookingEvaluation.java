package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/** UC-NCC-07: kết quả NCC đánh giá khả năng đáp ứng một đơn đang chờ xử lý (giữ bản mới nhất). */
@Entity
@Table(name = "booking_evaluation")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingEvaluation {
    public enum Conclusion { MEETS, NOT_MEETS, NEEDS_ADJUSTMENT }

    @Id
    @Column(name = "booking_id")
    private Long bookingId;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR) // cột là VARCHAR(20) (migration 017), không phải ENUM của MySQL
    @Column(nullable = false, length = 20)
    private Conclusion conclusion;
    @Column(name = "special_request_result", length = 1000)
    private String specialRequestResult;
    @Column(length = 1000)
    private String note;
    @Column(name = "evaluated_by")
    private Long evaluatedBy;
    @Column(name = "evaluated_at", nullable = false)
    private LocalDateTime evaluatedAt;
}

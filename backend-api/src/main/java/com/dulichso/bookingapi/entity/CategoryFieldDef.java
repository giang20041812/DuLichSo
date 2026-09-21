package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;

@Entity
@Table(name = "category_field_def")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryFieldDef {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    @Column(name = "field_key", nullable = false, length = 128)
    private String fieldKey;
    @Column(nullable = false)
    private String label;
    @Column(name = "data_type", nullable = false, length = 16)
    private String dataType;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "enum_values", columnDefinition = "json")
    private List<String> enumValues;
    
    @Column(name = "is_required_for_publish", nullable = false)
    private Boolean isRequiredForPublish = false;
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}

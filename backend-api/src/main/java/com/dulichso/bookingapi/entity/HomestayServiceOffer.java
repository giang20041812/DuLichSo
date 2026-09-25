package com.dulichso.bookingapi.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name="homestay_service_offer") @Getter @Setter @NoArgsConstructor
public class HomestayServiceOffer {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="place_id",nullable=false) private Place place;
    @Column(nullable=false) private String name;
    @Column(columnDefinition="TEXT") private String description;
    @Column(precision=12,scale=0) private BigDecimal price;
    @Column(name="price_unit",length=64) private String priceUnit;
    @Column(nullable=false) private boolean active=true;
}

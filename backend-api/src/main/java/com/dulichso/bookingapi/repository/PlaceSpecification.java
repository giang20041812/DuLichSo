package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PlaceSpecification {

    public static Specification<Place> filterPublicPlaces(
            CategoryKind kind,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            BigDecimal minRating) {
            
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Default filters for public view
            predicates.add(cb.equal(root.get("visibility"), PlaceVisibility.PUBLISHED));
            predicates.add(cb.isFalse(root.get("isDeleted")));
            
            if (kind != null) {
                predicates.add(cb.equal(root.get("kind"), kind));
            }
            
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("priceRefMin"), minPrice));
            }
            
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("priceRefMin"), maxPrice));
            }
            
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("ratingAvg"), minRating));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

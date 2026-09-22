package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.BookingNight;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PlaceSpecification {

    public static Specification<Place> filterPublicPlaces(
            CategoryKind kind,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            BigDecimal minRating,
            LocalDate checkIn,
            LocalDate checkOut) {
            
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Default filters for public view
            predicates.add(cb.equal(root.get("visibility"), PlaceVisibility.PUBLISHED));
            predicates.add(cb.isFalse(root.get("isDeleted")));
            
            if (checkIn != null && checkOut != null) {
                // A Place is available if it has at least one RoomType where totalRoomCount > max_booked_rooms
                // in the date range.
                // We use a Subquery to check if there is such a RoomType.
                Subquery<Long> availableRtSq = query.subquery(Long.class);
                Root<RoomType> rtRoot = availableRtSq.from(RoomType.class);
                availableRtSq.select(cb.count(rtRoot));
                
                Predicate placeMatch = cb.equal(rtRoot.get("place"), root);
                
                // Subquery to check if there is ANY date in the range where SUM(booked) >= totalRoomCount
                Subquery<Integer> bookedSq = availableRtSq.subquery(Integer.class);
                Root<BookingNight> bnRoot = bookedSq.from(BookingNight.class);
                Join<BookingNight, Booking> bJoin = bnRoot.join("booking");
                
                bookedSq.select(cb.sum(bnRoot.get("roomCount")));
                bookedSq.where(
                    cb.equal(bJoin.get("roomType"), rtRoot),
                    cb.greaterThanOrEqualTo(bnRoot.get("id").get("stayDate"), checkIn),
                    cb.lessThan(bnRoot.get("id").get("stayDate"), checkOut),
                    cb.notEqual(bJoin.get("status"), com.dulichso.bookingapi.entity.enums.BookingStatus.CANCELLED)
                );
                bookedSq.groupBy(bnRoot.get("id").get("stayDate"));
                bookedSq.having(cb.greaterThanOrEqualTo(cb.sum(bnRoot.<Integer>get("roomCount")), rtRoot.<Integer>get("totalRoomCount")));
                
                Predicate isAvailable = cb.not(cb.exists(bookedSq));
                
                availableRtSq.where(placeMatch, isAvailable, cb.greaterThan(rtRoot.get("totalRoomCount"), 0));
                
                predicates.add(cb.greaterThan(availableRtSq, 0L));
            }
            
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

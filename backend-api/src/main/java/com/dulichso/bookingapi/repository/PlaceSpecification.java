package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Amenity;
import com.dulichso.bookingapi.entity.Booking;
import com.dulichso.bookingapi.entity.BookingNight;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.PlaceAmenity;
import com.dulichso.bookingapi.entity.RoomAmenity;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.AmenityValue;
import com.dulichso.bookingapi.entity.enums.CategoryKind;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
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
            List<String> amenities,
            LocalDate checkIn,
            LocalDate checkOut) {
            
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 1. Default filters for public view
            predicates.add(cb.equal(root.get("visibility"), PlaceVisibility.PUBLISHED));
            predicates.add(cb.isFalse(root.get("isDeleted")));
            
            // 2. Date availability check
            if (checkIn != null && checkOut != null) {
                Subquery<Long> availableRtSq = query.subquery(Long.class);
                Root<RoomType> rtRoot = availableRtSq.from(RoomType.class);
                availableRtSq.select(cb.count(rtRoot));
                
                Predicate placeMatch = cb.equal(rtRoot.get("place"), root);
                
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
            
            // 3. Category Kind
            if (kind != null) {
                predicates.add(cb.equal(root.get("kind"), kind));
            }
            
            // 4. Price range
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("priceRefMin"), minPrice));
            }
            
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("priceRefMin"), maxPrice));
            }
            
            // 5. Rating
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("ratingAvg"), minRating));
            }

            // 6. Amenities Filter (Lọc từ cả place_amenity VÀ room_amenity)
            if (amenities != null && !amenities.isEmpty()) {
                for (String amenityCode : amenities) {
                    if (amenityCode == null || amenityCode.trim().isEmpty()) {
                        continue;
                    }
                    String codeTrimmed = amenityCode.trim();

                    // Điều kiện 1: Có trong bảng place_amenity với value = YES
                    Subquery<Long> placeAmenitySq = query.subquery(Long.class);
                    Root<PlaceAmenity> paRoot = placeAmenitySq.from(PlaceAmenity.class);
                    Join<PlaceAmenity, Amenity> paAmenityJoin = paRoot.join("amenity");
                    placeAmenitySq.select(cb.literal(1L));
                    placeAmenitySq.where(
                        cb.equal(paRoot.get("place"), root),
                        cb.equal(cb.upper(paAmenityJoin.get("code")), codeTrimmed.toUpperCase()),
                        cb.equal(paRoot.get("value"), AmenityValue.YES)
                    );

                    // Điều kiện 2: Có trong bảng room_amenity thuộc bất kỳ room_type nào của place với value = YES
                    Subquery<Long> roomAmenitySq = query.subquery(Long.class);
                    Root<RoomAmenity> raRoot = roomAmenitySq.from(RoomAmenity.class);
                    Join<RoomAmenity, RoomType> raRoomTypeJoin = raRoot.join("roomType");
                    Join<RoomAmenity, Amenity> raAmenityJoin = raRoot.join("amenity");
                    roomAmenitySq.select(cb.literal(1L));
                    roomAmenitySq.where(
                        cb.equal(raRoomTypeJoin.get("place"), root),
                        cb.equal(cb.upper(raAmenityJoin.get("code")), codeTrimmed.toUpperCase()),
                        cb.equal(raRoot.get("value"), AmenityValue.YES)
                    );

                    // Place thỏa mãn nếu tiện nghi này có ở CẤP PLACE hoặc CẤP ROOM
                    predicates.add(cb.or(
                        cb.exists(placeAmenitySq),
                        cb.exists(roomAmenitySq)
                    ));
                }
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

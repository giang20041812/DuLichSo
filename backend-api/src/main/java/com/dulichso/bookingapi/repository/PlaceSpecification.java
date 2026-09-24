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
            LocalDate checkOut,
            String province,
            String ward,
            List<Long> attractionIds) {
            
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 1. Default filters for public view
            predicates.add(cb.equal(root.get("visibility"), PlaceVisibility.PUBLISHED));
            predicates.add(cb.isFalse(root.get("isDeleted")));
            
            // 2. Date availability check (Nếu chỉ chọn checkIn thì kiểm tra đêm lưu trú checkIn đến checkIn + 1)
            LocalDate effectiveCheckIn = checkIn;
            LocalDate effectiveCheckOut = checkOut;
            if (effectiveCheckIn != null && effectiveCheckOut == null) {
                effectiveCheckOut = effectiveCheckIn.plusDays(1);
            }
            
            if (effectiveCheckIn != null && effectiveCheckOut != null) {
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
                    cb.greaterThanOrEqualTo(bnRoot.get("id").get("stayDate"), effectiveCheckIn),
                    cb.lessThan(bnRoot.get("id").get("stayDate"), effectiveCheckOut),
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

            // 4. Lọc theo Địa điểm du lịch (attractionIds)
            // Nếu có chọn điểm du lịch: tìm homestay có cùng region hoặc địa chỉ chứa region của attraction
            if (attractionIds != null && !attractionIds.isEmpty()) {
                Subquery<Long> attractionRegionSq = query.subquery(Long.class);
                Root<Place> attRoot = attractionRegionSq.from(Place.class);
                attractionRegionSq.select(attRoot.get("region").get("id"));
                attractionRegionSq.where(
                    attRoot.get("id").in(attractionIds),
                    cb.isNotNull(attRoot.get("region"))
                );

                Join<Object, Object> regionJoin = root.join("region", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(regionJoin.get("id").in(attractionRegionSq));
            } else {
                // Nếu không filter theo địa điểm, áp dụng filter Phường/Xã hoặc Tỉnh
                if (ward != null && !ward.trim().isEmpty()) {
                    String wardClean = ward.trim().toLowerCase();
                    Join<Object, Object> regionJoin = root.join("region", jakarta.persistence.criteria.JoinType.LEFT);
                    Predicate matchRegion = cb.like(cb.lower(regionJoin.get("name")), "%" + wardClean + "%");
                    Predicate matchAddress = cb.like(cb.lower(root.get("address")), "%" + wardClean + "%");
                    predicates.add(cb.or(matchRegion, matchAddress));
                } else if (province != null && !province.trim().isEmpty()) {
                    String provClean = province.trim().toLowerCase();
                    Join<Object, Object> regionJoin = root.join("region", jakarta.persistence.criteria.JoinType.LEFT);
                    Predicate matchRegion = cb.like(cb.lower(regionJoin.get("name")), "%" + provClean + "%");
                    Predicate matchAddress = cb.like(cb.lower(root.get("address")), "%" + provClean + "%");
                    predicates.add(cb.or(matchRegion, matchAddress));
                }
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

    public static Specification<Place> filterAdminPlaces(
            String keyword,
            com.dulichso.bookingapi.entity.enums.PlaceVisibility visibility,
            com.dulichso.bookingapi.entity.enums.PlaceVerificationStatus verification,
            CategoryKind kind) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (visibility != null) {
                predicates.add(cb.equal(root.get("visibility"), visibility));
            }
            if (verification != null) {
                predicates.add(cb.equal(root.get("verification"), verification));
            }
            if (kind != null) {
                predicates.add(cb.equal(root.get("kind"), kind));
            }
            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), kw),
                        cb.like(cb.lower(root.get("slug")), kw),
                        cb.like(cb.lower(root.get("address")), kw)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

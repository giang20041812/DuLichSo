package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Amenity;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.PlaceAmenity;
import com.dulichso.bookingapi.entity.RoomAmenity;
import com.dulichso.bookingapi.entity.RoomInventoryDay;
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
            String district,
            String ward,
            List<Long> attractionIds,
            String keyword,
            Integer guestCount) {
            
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.toLowerCase().trim() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                predicates.add(nameMatch);
            }
            
            // 1. Default filters for public view
            predicates.add(cb.equal(root.get("visibility"), PlaceVisibility.PUBLISHED));
            predicates.add(cb.equal(root.get("operationStatus"), com.dulichso.bookingapi.entity.enums.PlaceOperationStatus.OPERATING));
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (guestCount != null) {
                Subquery<Long> guestRoomSq = query.subquery(Long.class);
                Root<RoomType> guestRoomRoot = guestRoomSq.from(RoomType.class);
                guestRoomSq.select(cb.count(guestRoomRoot));
                guestRoomSq.where(
                        cb.equal(guestRoomRoot.get("place"), root),
                        cb.equal(guestRoomRoot.get("status"), "ACTIVE"),
                        cb.greaterThanOrEqualTo(guestRoomRoot.get("maxOccupancy"), guestCount),
                        cb.greaterThan(guestRoomRoot.get("totalRoomCount"), 0)
                );
                predicates.add(cb.greaterThan(guestRoomSq, 0L));
            }
            
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

                // RoomInventoryDay is the source of truth used by the booking flow.
                // A missing row means the room has its default total capacity and no
                // rooms are occupied yet. Reject a room type when any requested night
                // is stop-sold or has no remaining inventory.
                Subquery<Long> unavailableDaySq = availableRtSq.subquery(Long.class);
                Root<RoomInventoryDay> inventoryRoot = unavailableDaySq.from(RoomInventoryDay.class);
                jakarta.persistence.criteria.Expression<Integer> heldRooms = cb.coalesce(inventoryRoot.<Integer>get("heldRooms"), 0);
                jakarta.persistence.criteria.Expression<Integer> confirmedRooms = cb.coalesce(inventoryRoot.<Integer>get("confirmedRooms"), 0);
                jakarta.persistence.criteria.Expression<Integer> occupiedRooms = cb.sum(heldRooms, confirmedRooms);

                unavailableDaySq.select(cb.literal(1L));
                unavailableDaySq.where(
                        cb.equal(inventoryRoot.get("roomType"), rtRoot),
                        cb.greaterThanOrEqualTo(inventoryRoot.get("id").get("stayDate"), effectiveCheckIn),
                        cb.lessThan(inventoryRoot.get("id").get("stayDate"), effectiveCheckOut),
                        cb.or(
                                cb.isTrue(inventoryRoot.get("stopSell")),
                                cb.lessThanOrEqualTo(inventoryRoot.<Integer>get("totalRooms"), occupiedRooms)
                        )
                );

                Predicate isAvailable = cb.not(cb.exists(unavailableDaySq));

                availableRtSq.where(
                        placeMatch,
                        cb.equal(rtRoot.get("status"), "ACTIVE"),
                        isAvailable,
                        cb.greaterThan(rtRoot.get("totalRoomCount"), 0)
                );
                
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
                // Nếu không filter theo địa điểm, áp dụng filter Phường/Xã -> Huyện -> Tỉnh
                // Kiểm tra liên kết phân cấp cha con qua region.name, region.parent.name, region.path và place.address
                if (ward != null && !ward.trim().isEmpty()) {
                    String wardClean = ward.trim().toLowerCase();
                    Join<Object, Object> regionJoin = root.join("region", jakarta.persistence.criteria.JoinType.LEFT);
                    Predicate matchRegion = cb.like(cb.lower(regionJoin.get("name")), "%" + wardClean + "%");
                    Predicate matchPath = cb.like(cb.lower(regionJoin.get("path")), "%" + wardClean + "%");
                    Predicate matchAddress = cb.like(cb.lower(root.get("address")), "%" + wardClean + "%");
                    predicates.add(cb.or(matchRegion, matchPath, matchAddress));
                } else if (district != null && !district.trim().isEmpty()) {
                    String distClean = district.trim().toLowerCase();
                    Join<Object, Object> regionJoin = root.join("region", jakarta.persistence.criteria.JoinType.LEFT);
                    Join<Object, Object> parentJoin = regionJoin.join("parent", jakarta.persistence.criteria.JoinType.LEFT);
                    Predicate matchRegion = cb.like(cb.lower(regionJoin.get("name")), "%" + distClean + "%");
                    Predicate matchParent = cb.like(cb.lower(parentJoin.get("name")), "%" + distClean + "%");
                    Predicate matchPath = cb.like(cb.lower(regionJoin.get("path")), "%" + distClean + "%");
                    Predicate matchAddress = cb.like(cb.lower(root.get("address")), "%" + distClean + "%");
                    predicates.add(cb.or(matchRegion, matchParent, matchPath, matchAddress));
                } else if (province != null && !province.trim().isEmpty()) {
                    String provClean = province.trim().toLowerCase();
                    Join<Object, Object> regionJoin = root.join("region", jakarta.persistence.criteria.JoinType.LEFT);
                    Join<Object, Object> parentJoin = regionJoin.join("parent", jakarta.persistence.criteria.JoinType.LEFT);
                    Join<Object, Object> grandParentJoin = parentJoin.join("parent", jakarta.persistence.criteria.JoinType.LEFT);
                    Predicate matchRegion = cb.like(cb.lower(regionJoin.get("name")), "%" + provClean + "%");
                    Predicate matchParent = cb.like(cb.lower(parentJoin.get("name")), "%" + provClean + "%");
                    Predicate matchGrandParent = cb.like(cb.lower(grandParentJoin.get("name")), "%" + provClean + "%");
                    Predicate matchPath = cb.like(cb.lower(regionJoin.get("path")), "%" + provClean + "%");
                    Predicate matchAddress = cb.like(cb.lower(root.get("address")), "%" + provClean + "%");
                    predicates.add(cb.or(matchRegion, matchParent, matchGrandParent, matchPath, matchAddress));
                }
            }
            
            // 4. Price range
            if (kind == CategoryKind.HOMESTAY || minPrice != null || maxPrice != null) {
            Subquery<Long> activePricedRoomSq = query.subquery(Long.class);
            Root<RoomType> activePricedRoomRoot = activePricedRoomSq.from(RoomType.class);
            activePricedRoomSq.select(cb.count(activePricedRoomRoot));
            activePricedRoomSq.where(
                    cb.equal(activePricedRoomRoot.get("place"), root),
                    cb.equal(activePricedRoomRoot.get("status"), "ACTIVE"),
                    cb.isNotNull(activePricedRoomRoot.get("basePrice"))
            );
            predicates.add(cb.greaterThan(activePricedRoomSq, 0L));

            if (minPrice != null) {
                Subquery<Long> cheaperRoomSq = query.subquery(Long.class);
                Root<RoomType> cheaperRoomRoot = cheaperRoomSq.from(RoomType.class);
                cheaperRoomSq.select(cb.count(cheaperRoomRoot));
                cheaperRoomSq.where(
                        cb.equal(cheaperRoomRoot.get("place"), root),
                        cb.equal(cheaperRoomRoot.get("status"), "ACTIVE"),
                        cb.isNotNull(cheaperRoomRoot.get("basePrice")),
                        cb.lessThan(cheaperRoomRoot.get("basePrice"), minPrice)
                );
                predicates.add(cb.equal(cheaperRoomSq, 0L));
            }

            if (maxPrice != null) {
                Subquery<Long> affordableRoomSq = query.subquery(Long.class);
                Root<RoomType> affordableRoomRoot = affordableRoomSq.from(RoomType.class);
                affordableRoomSq.select(cb.count(affordableRoomRoot));
                affordableRoomSq.where(
                        cb.equal(affordableRoomRoot.get("place"), root),
                        cb.equal(affordableRoomRoot.get("status"), "ACTIVE"),
                        cb.isNotNull(affordableRoomRoot.get("basePrice")),
                        cb.lessThanOrEqualTo(affordableRoomRoot.get("basePrice"), maxPrice)
                );
                predicates.add(cb.greaterThan(affordableRoomSq, 0L));
            }
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
            CategoryKind kind,
            Long providerId,
            Long regionId,
            LocalDate createdFrom,
            LocalDate createdTo) {
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
            if (providerId != null) {
                predicates.add(cb.equal(root.get("provider").get("id"), providerId));
            }
            if (regionId != null) {
                predicates.add(cb.equal(root.get("region").get("id"), regionId));
            }
            if (createdFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom.atStartOfDay()));
            }
            if (createdTo != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), createdTo.plusDays(1).atStartOfDay()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%";
                Join<Object, Object> provider = root.join("provider", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), kw),
                        cb.like(cb.lower(root.get("slug")), kw),
                        cb.like(cb.lower(root.get("address")), kw),
                        cb.like(cb.lower(provider.get("name")), kw)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

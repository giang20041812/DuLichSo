package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Booking> {
    Optional<Booking> findByBookingCode(String bookingCode);
    boolean existsByBookingCode(String bookingCode);

    /** Điểm đến có Booking ở một trong các trạng thái đã cho (vd: đang hiệu lực) hay không. */
    boolean existsByPlaceIdAndStatusIn(Long placeId, java.util.Collection<com.dulichso.bookingapi.entity.enums.BookingStatus> statuses);

    /**
     * GMV (giá trị đặt phòng) theo tháng — mọi đơn CHƯA bị hủy/từ chối/hết hạn, không phụ thuộc đã thanh toán hay chưa.
     * Dùng làm số liệu tạm thay thế khi doanh thu đối soát (PaymentTransaction) = 0đ.
     * Trả về [year, month, totalAmount, count].
     */
    @org.springframework.data.jpa.repository.Query("""
        SELECT YEAR(b.createdAt), MONTH(b.createdAt), SUM(b.totalAmount), COUNT(b)
        FROM Booking b
        WHERE b.status NOT IN (com.dulichso.bookingapi.entity.enums.BookingStatus.REJECTED,
                               com.dulichso.bookingapi.entity.enums.BookingStatus.CANCELLED,
                               com.dulichso.bookingapi.entity.enums.BookingStatus.EXPIRED)
        GROUP BY YEAR(b.createdAt), MONTH(b.createdAt)
        ORDER BY YEAR(b.createdAt) DESC, MONTH(b.createdAt) DESC
    """)
    java.util.List<Object[]> sumBookingValueByMonth();

    /** Dòng tối giản phục vụ báo cáo: [createdAt, status, totalAmount, providerId, providerName, placeId, placeName]. */
    @org.springframework.data.jpa.repository.Query("""
        SELECT b.createdAt, b.status, b.totalAmount, p.id, p.name, pl.id, pl.name
        FROM Booking b JOIN b.provider p JOIN b.place pl
        WHERE b.createdAt >= :from AND b.createdAt < :to
          AND (:providerId IS NULL OR p.id = :providerId)
    """)
    java.util.List<Object[]> findReportRows(
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
            @org.springframework.data.repository.query.Param("providerId") Long providerId
    );
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select b from Booking b where b.id = :id")
    Optional<Booking> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.place p
        JOIN FETCH b.roomType rt
        WHERE (:email IS NOT NULL AND LOWER(b.guestEmail) = LOWER(:email))
           OR (:phone IS NOT NULL AND b.guestPhone = :phone)
        ORDER BY b.createdAt DESC
    """)
    java.util.List<Booking> findByGuestEmailOrPhone(
            @org.springframework.data.repository.query.Param("email") String email,
            @org.springframework.data.repository.query.Param("phone") String phone
    );

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.place p
        JOIN FETCH b.roomType rt
        WHERE b.bookingCode IN :codes
        ORDER BY b.createdAt DESC
    """)
    java.util.List<Booking> findByBookingCodes(
            @org.springframework.data.repository.query.Param("codes") java.util.Collection<String> codes
    );

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.place p
        JOIN FETCH b.roomType rt
        ORDER BY b.createdAt DESC
    """)
    java.util.List<Booking> findAllWithDetails();

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b 
        WHERE b.roomType.id = :roomTypeId 
          AND b.status IN (com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.AWAITING_PAYMENT, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.CONFIRMED)
          AND b.checkIn < :endDate 
          AND b.checkOut > :startDate
    """)
    java.util.List<Booking> findActiveBookingsByRoomTypeAndDateRange(
            @org.springframework.data.repository.query.Param("roomTypeId") Long roomTypeId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
    );

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b 
        WHERE b.place.id = :placeId 
          AND b.status IN (com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.AWAITING_PAYMENT, 
                           com.dulichso.bookingapi.entity.enums.BookingStatus.CONFIRMED)
          AND b.checkIn < :endDate 
          AND b.checkOut > :startDate
    """)
    java.util.List<Booking> findActiveBookingsByPlaceAndDateRange(
            @org.springframework.data.repository.query.Param("placeId") Long placeId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
    );

    /** ACC-BR-08: các đơn đang chờ NCC duyệt của một NCC — dùng khi tài khoản NCC bị Admin khóa, cần tự động hủy và giải phóng phòng. */
    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b JOIN FETCH b.roomType rt JOIN FETCH b.place p
        WHERE b.provider.id = :providerId AND b.status = com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING
    """)
    java.util.List<Booking> findPendingByProviderId(@org.springframework.data.repository.query.Param("providerId") Long providerId);

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b JOIN FETCH b.roomType rt JOIN FETCH b.place p
        WHERE b.place.id = :placeId
          AND b.status IN (com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING,
                           com.dulichso.bookingapi.entity.enums.BookingStatus.AWAITING_PAYMENT,
                           com.dulichso.bookingapi.entity.enums.BookingStatus.CONFIRMED)
          AND b.checkOut > :fromDate
          AND b.checkIn < :toDate
    """)
    java.util.List<Booking> findActiveByPlaceAndDateRange(
            @org.springframework.data.repository.query.Param("placeId") Long placeId,
            @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDate fromDate,
            @org.springframework.data.repository.query.Param("toDate") java.time.LocalDate toDate);

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b JOIN FETCH b.roomType rt JOIN FETCH b.place p
        WHERE b.roomType.id = :roomTypeId
          AND b.status IN (com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING,
                           com.dulichso.bookingapi.entity.enums.BookingStatus.AWAITING_PAYMENT,
                           com.dulichso.bookingapi.entity.enums.BookingStatus.CONFIRMED)
          AND b.checkOut > :fromDate
          AND b.checkIn < :toDate
    """)
    java.util.List<Booking> findActiveByRoomTypeAndDateRange(
            @org.springframework.data.repository.query.Param("roomTypeId") Long roomTypeId,
            @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDate fromDate,
            @org.springframework.data.repository.query.Param("toDate") java.time.LocalDate toDate);

    @org.springframework.data.jpa.repository.Query("""
        SELECT b FROM Booking b JOIN FETCH b.roomType rt JOIN FETCH b.place p
        WHERE b.provider.id = :providerId
          AND b.status IN (com.dulichso.bookingapi.entity.enums.BookingStatus.PENDING,
                           com.dulichso.bookingapi.entity.enums.BookingStatus.AWAITING_PAYMENT,
                           com.dulichso.bookingapi.entity.enums.BookingStatus.CONFIRMED)
          AND b.checkOut > :fromDate
    """)
    java.util.List<Booking> findActiveByProviderId(
            @org.springframework.data.repository.query.Param("providerId") Long providerId,
            @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDate fromDate);
}

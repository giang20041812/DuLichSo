package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.BookingResponseDto;
import com.dulichso.bookingapi.dto.CreateBookingRequest;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.BookingStatus;
import com.dulichso.bookingapi.entity.keys.BookingNightId;
import com.dulichso.bookingapi.entity.keys.RoomInventoryDayId;
import com.dulichso.bookingapi.repository.*;
import com.dulichso.bookingapi.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingNightRepository bookingNightRepository;
    private final RoomInventoryDayRepository roomInventoryDayRepository;
    private final PlaceRepository placeRepository;
    private final RoomTypeRepository roomTypeRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public BookingResponseDto createBooking(CreateBookingRequest request) {
        log.info("Bắt đầu xử lý đặt phòng cho placeId: {}, roomTypeId: {}", request.getPlaceId(), request.getRoomTypeId());

        // 1. Kiểm tra ngày nhận / trả phòng
        if (request.getCheckIn() == null || request.getCheckOut() == null) {
            throw new IllegalArgumentException("Ngày nhận phòng và trả phòng không được để trống.");
        }
        if (!request.getCheckOut().isAfter(request.getCheckIn())) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng.");
        }

        long nightsCount = ChronoUnit.DAYS.between(request.getCheckIn(), request.getCheckOut());
        if (nightsCount <= 0) {
            throw new IllegalArgumentException("Số đêm lưu trú tối thiểu là 1.");
        }

        // 2. Lấy thông tin Homestay và Loại phòng
        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chỗ nghỉ với ID: " + request.getPlaceId()));

        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại phòng với ID: " + request.getRoomTypeId()));

        if (!roomType.getPlace().getId().equals(place.getId())) {
            throw new IllegalArgumentException("Loại phòng không thuộc chỗ nghỉ này.");
        }

        if (place.getProvider() == null) {
            throw new IllegalStateException("Chỗ nghỉ chưa được liên kết với nhà cung cấp (Provider).");
        }

        int requestedRooms = request.getRoomCount();
        int totalCapacity = roomType.getTotalRoomCount() != null ? roomType.getTotalRoomCount() : 5;

        // 3. Chống race-condition: Kiểm tra và giữ chỗ tồn kho phòng (RoomInventoryDay) với Pessimistic Lock
        for (LocalDate date = request.getCheckIn(); date.isBefore(request.getCheckOut()); date = date.plusDays(1)) {
            final LocalDate stayDate = date;
            RoomInventoryDay inventory = roomInventoryDayRepository.findByIdForUpdate(roomType.getId(), stayDate)
                    .orElseGet(() -> {
                        // Khởi tạo bản ghi tồn kho ngày đó nếu chưa có
                        RoomInventoryDay newInv = RoomInventoryDay.builder()
                                .id(new RoomInventoryDayId(roomType.getId(), stayDate))
                                .roomType(roomType)
                                .totalRooms(totalCapacity)
                                .heldRooms(0)
                                .confirmedRooms(0)
                                .stopSell(false)
                                .updatedAt(LocalDateTime.now())
                                .build();
                        return roomInventoryDayRepository.saveAndFlush(newInv);
                    });

            if (Boolean.TRUE.equals(inventory.getStopSell())) {
                throw new IllegalStateException("Phòng đã tạm ngừng nhận khách vào ngày: " + date);
            }

            int currentlyOccupied = (inventory.getHeldRooms() != null ? inventory.getHeldRooms() : 0)
                    + (inventory.getConfirmedRooms() != null ? inventory.getConfirmedRooms() : 0);
            int available = inventory.getTotalRooms() - currentlyOccupied;

            if (available < requestedRooms) {
                throw new IllegalStateException("Không đủ phòng trống vào ngày " + date + ". Chỉ còn " + Math.max(0, available) + " phòng.");
            }

            // Tăng số lượng phòng đang giữ (held_rooms)
            inventory.setHeldRooms((inventory.getHeldRooms() != null ? inventory.getHeldRooms() : 0) + requestedRooms);
            roomInventoryDayRepository.save(inventory);
        }

        // 4. Tính toán giá tiền
        BigDecimal unitPrice = roomType.getBasePrice() != null ? roomType.getBasePrice() : BigDecimal.valueOf(500000);
        BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(nightsCount)).multiply(BigDecimal.valueOf(requestedRooms));

        // 5. Sinh mã đặt phòng duy nhất
        String bookingCode = generateUniqueBookingCode();

        // 6. Snapshot chính sách hủy phòng
        Map<String, Object> policySnapshot = new HashMap<>();
        policySnapshot.put("policyName", "Miễn phí hủy phòng");
        policySnapshot.put("freeCancelCutoffHours", 24);
        policySnapshot.put("refundType", "FULL_REFUND");
        policySnapshot.put("description", "Miễn phí hủy phòng trước 24 giờ nhận phòng.");

        // 7. Tạo bản ghi Booking
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime holdExpiry = now.plusHours(12); // Hết hạn giữ phòng sau 12h nếu không được xác nhận

        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .place(place)
                .roomType(roomType)
                .provider(place.getProvider())
                .checkIn(request.getCheckIn())
                .checkOut(request.getCheckOut())
                .roomCount(request.getRoomCount())
                .guestCount(request.getGuestCount())
                .guestName(request.getGuestName())
                .guestPhone(request.getGuestPhone())
                .guestEmail(request.getGuestEmail())
                .guestNote(request.getGuestNote())
                .status(BookingStatus.PENDING)
                .holdExpiresAt(holdExpiry)
                .currency("VND")
                .totalAmount(totalAmount)
                .policySnapshot(policySnapshot)
                .createdAt(now)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 8. Tạo bản ghi BookingNight cho từng đêm
        for (LocalDate date = request.getCheckIn(); date.isBefore(request.getCheckOut()); date = date.plusDays(1)) {
            BookingNight night = BookingNight.builder()
                    .id(new BookingNightId(savedBooking.getId(), date))
                    .booking(savedBooking)
                    .unitPrice(unitPrice)
                    .roomCount(requestedRooms)
                    .build();
            bookingNightRepository.save(night);
        }

        log.info("Tạo booking thành công với mã: {}", bookingCode);

        // 9. Map sang DTO trả về
        return mapToResponseDto(savedBooking, place, roomType, unitPrice, (int) nightsCount);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDto getBookingByCode(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));

        int nights = (int) ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
        BigDecimal unitPrice = booking.getRoomType().getBasePrice() != null
                ? booking.getRoomType().getBasePrice()
                : BigDecimal.ZERO;

        return mapToResponseDto(booking, booking.getPlace(), booking.getRoomType(), unitPrice, nights);
    }

    private BookingResponseDto mapToResponseDto(Booking booking, Place place, RoomType roomType, BigDecimal unitPrice, int nights) {
        return BookingResponseDto.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .placeId(place.getId())
                .placeName(place.getName())
                .placeAddress(place.getAddress())
                .roomTypeId(roomType.getId())
                .roomTypeName(roomType.getName())
                .checkIn(booking.getCheckIn())
                .checkOut(booking.getCheckOut())
                .nights(nights)
                .roomCount(booking.getRoomCount())
                .guestCount(booking.getGuestCount())
                .guestName(booking.getGuestName())
                .guestPhone(booking.getGuestPhone())
                .guestEmail(booking.getGuestEmail())
                .guestNote(booking.getGuestNote())
                .status(booking.getStatus().name())
                .currency(booking.getCurrency())
                .unitPrice(unitPrice)
                .totalAmount(booking.getTotalAmount())
                .createdAt(booking.getCreatedAt())
                .holdExpiresAt(booking.getHoldExpiresAt())
                .policySnapshot(booking.getPolicySnapshot())
                .build();
    }

    private String generateUniqueBookingCode() {
        for (int i = 0; i < 10; i++) {
            int codeNumber = 100000 + RANDOM.nextInt(900000);
            String code = "VJ-" + codeNumber;
            if (!bookingRepository.existsByBookingCode(code)) {
                return code;
            }
        }
        return "VJ-" + System.currentTimeMillis();
    }
}

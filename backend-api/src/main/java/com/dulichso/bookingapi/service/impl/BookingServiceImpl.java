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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingNightRepository bookingNightRepository;
    private final RoomInventoryDayRepository roomInventoryDayRepository;
    private final PlaceRepository placeRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final HomestayProfileRepository homestayProfileRepository;
    private final com.dulichso.bookingapi.service.RoomCalendarService roomCalendarService;

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

        RoomType roomType = roomTypeRepository.findLockedById(request.getRoomTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại phòng với ID: " + request.getRoomTypeId()));

        if (!roomType.getPlace().getId().equals(place.getId())) {
            throw new IllegalArgumentException("Loại phòng không thuộc chỗ nghỉ này.");
        }

        if (place.getProvider() == null) {
            throw new IllegalStateException("Chỗ nghỉ chưa được liên kết với nhà cung cấp (Provider).");
        }

        int requestedRooms = request.getRoomCount();
        if (place.getVisibility() != com.dulichso.bookingapi.entity.enums.PlaceVisibility.PUBLISHED
                || place.getOperationStatus() != com.dulichso.bookingapi.entity.enums.PlaceOperationStatus.OPERATING
                || Boolean.TRUE.equals(place.getIsDeleted()) || !"ACTIVE".equals(roomType.getStatus()))
            throw new IllegalStateException("Chỗ nghỉ hoặc loại phòng đang ngừng nhận đặt phòng.");
        if (request.getCheckIn().isBefore(LocalDate.now())) throw new IllegalArgumentException("Không thể đặt phòng trong quá khứ.");
        var quote = roomCalendarService.quote(roomType,request.getCheckIn(),request.getCheckOut(),requestedRooms,request.getGuestCount());
        if (!quote.suitable()) throw new IllegalStateException("Không đủ phòng hoặc sức chứa cho yêu cầu.");
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
        BigDecimal unitPrice = quote.nights().get(0).price();
        BigDecimal totalAmount = quote.totalAmount();

        // 5. Sinh mã đặt phòng duy nhất
        String bookingCode = generateUniqueBookingCode();

        // 6. Snapshot chính sách hủy phòng
        Map<String, Object> policySnapshot = new HashMap<>();
        CancellationPolicy policy = homestayProfileRepository.findById(place.getId())
                .map(HomestayProfile::getCurrentPolicy).orElse(null);
        if (policy != null) {
                policySnapshot.put("policyId", policy.getId());
                policySnapshot.put("policyVersion", policy.getVersion());
                policySnapshot.put("policyName", policy.getName());
                policySnapshot.put("freeCancelCutoffHours", policy.getFreeCancelCutoffHours());
                policySnapshot.put("refundType", policy.getRefundOnLateCancel().name());
                policySnapshot.put("description", policy.getContentText());
        }

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
                .policy(policy)
                .createdAt(now)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 8. Tạo bản ghi BookingNight cho từng đêm
        for (LocalDate date = request.getCheckIn(); date.isBefore(request.getCheckOut()); date = date.plusDays(1)) {
            BookingNight night = BookingNight.builder()
                    .id(new BookingNightId(savedBooking.getId(), date))
                    .booking(savedBooking)
                    .unitPrice(quote.nights().get((int) ChronoUnit.DAYS.between(request.getCheckIn(), date)).price())
                    .roomCount(requestedRooms)
                    .build();
            bookingNightRepository.save(night);
        }

        // 8.1 Lưu các dịch vụ đi kèm booking (không tính giá)
        if (request.getServiceItems() != null && !request.getServiceItems().isEmpty()) {
            List<com.dulichso.bookingapi.entity.BookingServiceItem> items = new ArrayList<>();
            for (CreateBookingRequest.ServiceItemRequest itemReq : request.getServiceItems()) {
                if (itemReq.getServiceName() != null && !itemReq.getServiceName().isBlank()) {
                    items.add(com.dulichso.bookingapi.entity.BookingServiceItem.builder()
                            .booking(savedBooking)
                            .serviceName(itemReq.getServiceName())
                            .serviceCode(itemReq.getServiceCode())
                            .note(itemReq.getNote())
                            .isIncluded(true)
                            .createdAt(now)
                            .build());
                }
            }
            if (!items.isEmpty()) {
                savedBooking.getServiceItems().addAll(items);
                bookingRepository.save(savedBooking);
            }
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
        List<BookingResponseDto.ServiceItemDto> serviceItemDtos = Collections.emptyList();
        if (booking.getServiceItems() != null && !booking.getServiceItems().isEmpty()) {
            serviceItemDtos = booking.getServiceItems().stream().map(item ->
                    BookingResponseDto.ServiceItemDto.builder()
                            .id(item.getId())
                            .serviceName(item.getServiceName())
                            .serviceCode(item.getServiceCode())
                            .note(item.getNote())
                            .isIncluded(item.getIsIncluded())
                            .build()
            ).collect(Collectors.toList());
        }

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
                .serviceItems(serviceItemDtos)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<com.dulichso.bookingapi.dto.BookedDateRangeDto> getBookedDatesByRoomType(Long roomTypeId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(15);
        LocalDate end = endDate != null ? endDate : LocalDate.now().plusMonths(3);

        java.util.List<Booking> bookings = bookingRepository.findActiveBookingsByRoomTypeAndDateRange(roomTypeId, start, end);
        return bookings.stream().map(b -> com.dulichso.bookingapi.dto.BookedDateRangeDto.builder()
                .roomTypeId(b.getRoomType().getId())
                .checkIn(b.getCheckIn())
                .checkOut(b.getCheckOut())
                .roomCount(b.getRoomCount())
                .build()
        ).collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<com.dulichso.bookingapi.dto.BookedDateRangeDto> getBookedDatesByPlace(Long placeId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(15);
        LocalDate end = endDate != null ? endDate : LocalDate.now().plusMonths(3);

        java.util.List<Booking> bookings = bookingRepository.findActiveBookingsByPlaceAndDateRange(placeId, start, end);
        return bookings.stream().map(b -> com.dulichso.bookingapi.dto.BookedDateRangeDto.builder()
                .roomTypeId(b.getRoomType().getId())
                .checkIn(b.getCheckIn())
                .checkOut(b.getCheckOut())
                .roomCount(b.getRoomCount())
                .build()
        ).collect(java.util.stream.Collectors.toList());
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

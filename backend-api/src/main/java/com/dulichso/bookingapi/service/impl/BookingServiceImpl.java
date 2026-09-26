package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.BookingResponseDto;
import com.dulichso.bookingapi.dto.CreateBookingRequest;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.ActorType;
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
    private final ReviewRepository reviewRepository;
    private final PlaceMediaRepository placeMediaRepository;
    private final RoomTypeMediaRepository roomTypeMediaRepository;
    private final BookingChangeRequestRepository bookingChangeRequestRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final com.dulichso.bookingapi.service.NotificationService notificationService;

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
    public BookingResponseDto getBookingByCode(String bookingCode, String phone) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));
        
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Yêu cầu cung cấp số điện thoại để tra cứu chi tiết đơn đặt phòng");
        }
        
        if (booking.getGuestPhone() == null || !booking.getGuestPhone().equals(phone.trim())) {
             // Return not found to not confirm existence if phone is wrong
             throw new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode);
        }

        int nights = (int) ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
        BigDecimal unitPrice = booking.getRoomType().getBasePrice() != null
                ? booking.getRoomType().getBasePrice()
                : BigDecimal.ZERO;

        return mapToResponseDto(booking, booking.getPlace(), booking.getRoomType(), unitPrice, nights);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDto> findMyBookings(String email, String phone, List<String> codes) {
        String cleanEmail = (email != null && !email.trim().isBlank()) ? email.trim() : null;
        String cleanPhone = (phone != null && !phone.trim().isBlank()) ? phone.trim() : null;

        List<Booking> bookings = new ArrayList<>();
        if (cleanEmail != null || cleanPhone != null) {
            bookings.addAll(bookingRepository.findByGuestEmailOrPhone(cleanEmail, cleanPhone));
        }

        if (codes != null && !codes.isEmpty()) {
            List<String> validCodes = codes.stream()
                    .filter(c -> c != null && !c.trim().isBlank())
                    .map(String::trim)
                    .distinct()
                    .collect(Collectors.toList());
            if (!validCodes.isEmpty()) {
                List<Booking> byCodes = bookingRepository.findByBookingCodes(validCodes);
                for (Booking b : byCodes) {
                    if (bookings.stream().noneMatch(existing -> existing.getId().equals(b.getId()))) {
                        bookings.add(b);
                    }
                }
            }
        }

        // Nếu không có thông tin filter hợp lệ hoặc không tìm thấy booking nào của khách, trả về danh sách rỗng (ACC-BR-11)
        if (bookings.isEmpty()) {
            return Collections.emptyList();
        }

        // Sắp xếp theo ngày tạo mới nhất
        bookings.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return bookings.stream().map(b -> {
            int nights = (int) ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut());
            BigDecimal unitPrice = b.getRoomType().getBasePrice() != null ? b.getRoomType().getBasePrice() : BigDecimal.ZERO;
            return mapToResponseDto(b, b.getPlace(), b.getRoomType(), unitPrice, nights);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public com.dulichso.bookingapi.dto.ReviewDto createBookingReview(String bookingCode, com.dulichso.bookingapi.dto.CreateReviewRequest request) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalStateException("Chỉ những chuyến đi đã hoàn thành (COMPLETED) mới có thể gửi đánh giá.");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new IllegalStateException("Đơn đặt phòng này đã được gửi đánh giá trước đó.");
        }

        // REV-BR-06: Trong vòng 14 ngày kể từ ngày trả phòng (checkout)
        LocalDate checkoutDate = booking.getCheckOut();
        if (checkoutDate != null && LocalDate.now().isAfter(checkoutDate.plusDays(14))) {
            throw new IllegalStateException("Đã quá thời hạn 14 ngày kể từ khi trả phòng để gửi đánh giá.");
        }

        Place place = booking.getPlace();

        Review review = Review.builder()
                .place(place)
                .booking(booking)
                .rating(request.getRating())
                .content(request.getContent() != null ? request.getContent().trim() : "")
                .images(request.getImages() != null ? request.getImages() : Collections.emptyList())
                .status(com.dulichso.bookingapi.entity.enums.ReviewStatus.VISIBLE)
                .editableUntil(checkoutDate != null ? checkoutDate.plusDays(14).atTime(23, 59, 59) : LocalDateTime.now().plusDays(14))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Cập nhật rating trung bình và tổng số đánh giá của Place
        int currentCount = place.getRatingCount() != null ? place.getRatingCount() : 0;
        BigDecimal currentAvg = place.getRatingAvg() != null ? place.getRatingAvg() : BigDecimal.ZERO;

        BigDecimal totalPoints = currentAvg.multiply(BigDecimal.valueOf(currentCount)).add(BigDecimal.valueOf(request.getRating()));
        int newCount = currentCount + 1;
        BigDecimal newAvg = totalPoints.divide(BigDecimal.valueOf(newCount), 2, java.math.RoundingMode.HALF_UP);

        place.setRatingCount(newCount);
        place.setRatingAvg(newAvg);
        placeRepository.save(place);

        return com.dulichso.bookingapi.dto.ReviewDto.builder()
                .id(savedReview.getId())
                .placeId(place.getId())
                .rating(savedReview.getRating())
                .content(savedReview.getContent())
                .images(savedReview.getImages())
                .guestName(booking.getGuestName())
                .createdAt(savedReview.getCreatedAt())
                .editableUntil(savedReview.getEditableUntil())
                .build();
    }

    @Override
    @Transactional
    public com.dulichso.bookingapi.dto.ReviewDto updateBookingReview(String bookingCode, com.dulichso.bookingapi.dto.CreateReviewRequest request) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));

        Review review = reviewRepository.findByBookingIdWithDetails(booking.getId())
                .orElseThrow(() -> new IllegalArgumentException("Chưa có đánh giá cho đơn đặt phòng này."));

        if (LocalDateTime.now().isAfter(review.getEditableUntil())) {
            throw new IllegalStateException("Đã quá thời hạn 14 ngày để chỉnh sửa đánh giá này.");
        }

        Place place = review.getPlace();
        byte oldRating = review.getRating();
        byte newRating = request.getRating();

        review.setRating(newRating);
        review.setContent(request.getContent() != null ? request.getContent().trim() : "");
        if (request.getImages() != null) {
            review.setImages(request.getImages());
        }
        review.setUpdatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);

        // Cập nhật lại rating nếu thay đổi số sao
        if (oldRating != newRating && place != null) {
            int count = place.getRatingCount() != null ? place.getRatingCount() : 1;
            BigDecimal currentAvg = place.getRatingAvg() != null ? place.getRatingAvg() : BigDecimal.valueOf(oldRating);
            BigDecimal totalPoints = currentAvg.multiply(BigDecimal.valueOf(count)).subtract(BigDecimal.valueOf(oldRating)).add(BigDecimal.valueOf(newRating));
            BigDecimal newAvg = totalPoints.divide(BigDecimal.valueOf(count), 2, java.math.RoundingMode.HALF_UP);
            place.setRatingAvg(newAvg);
            placeRepository.save(place);
        }

        return com.dulichso.bookingapi.dto.ReviewDto.builder()
                .id(saved.getId())
                .placeId(place != null ? place.getId() : null)
                .rating(saved.getRating())
                .content(saved.getContent())
                .images(saved.getImages())
                .guestName(booking.getGuestName())
                .createdAt(saved.getCreatedAt())
                .editableUntil(saved.getEditableUntil())
                .build();
    }

    @Override
    @Transactional
    public void deleteBookingReview(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));

        Review review = reviewRepository.findByBookingIdWithDetails(booking.getId())
                .orElseThrow(() -> new IllegalArgumentException("Chưa có đánh giá cho đơn đặt phòng này."));

        Place place = review.getPlace();
        byte oldRating = review.getRating();

        reviewRepository.delete(review);

        // Recalculate place rating
        if (place != null) {
            int currentCount = place.getRatingCount() != null ? place.getRatingCount() : 1;
            if (currentCount <= 1) {
                place.setRatingCount(0);
                place.setRatingAvg(BigDecimal.ZERO);
            } else {
                BigDecimal currentAvg = place.getRatingAvg() != null ? place.getRatingAvg() : BigDecimal.ZERO;
                BigDecimal totalPoints = currentAvg.multiply(BigDecimal.valueOf(currentCount)).subtract(BigDecimal.valueOf(oldRating));
                int newCount = currentCount - 1;
                BigDecimal newAvg = totalPoints.divide(BigDecimal.valueOf(newCount), 2, java.math.RoundingMode.HALF_UP);
                place.setRatingCount(newCount);
                place.setRatingAvg(newAvg);
            }
            placeRepository.save(place);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public com.dulichso.bookingapi.dto.ReviewDto getBookingReview(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));

        return reviewRepository.findByBookingIdWithDetails(booking.getId())
                .map(r -> com.dulichso.bookingapi.dto.ReviewDto.builder()
                        .id(r.getId())
                        .placeId(r.getPlace().getId())
                        .rating(r.getRating())
                        .content(r.getContent())
                        .images(r.getImages())
                        .guestName(r.getBooking() != null ? r.getBooking().getGuestName() : booking.getGuestName())
                        .createdAt(r.getCreatedAt())
                        .editableUntil(r.getEditableUntil())
                        .build())
                .orElse(null);
    }

    @Override
    @Transactional
    public BookingResponseDto cancelBooking(String bookingCode, String reason, String note) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REFUNDED) {
            throw new IllegalStateException("Đơn đặt phòng này đã được hủy trước đó.");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Không thể hủy đơn đặt phòng đã hoàn thành chuyến đi.");
        }

        LocalDate checkIn = booking.getCheckIn();
        LocalDateTime checkInTime = checkIn.atTime(14, 0);
        LocalDateTime now = LocalDateTime.now();

        Map<String, Object> snapshot = booking.getPolicySnapshot();
        if (snapshot == null) snapshot = new HashMap<>();
        snapshot.put("cancelReason", reason);
        if (note != null && !note.isBlank()) {
            snapshot.put("cancelNote", note);
        }
        snapshot.put("cancelledAt", now.toString());

        long hoursBeforeCheckIn = ChronoUnit.HOURS.between(now, checkInTime);
        int freeCancelCutoff = 24;
        if (snapshot.get("freeCancelCutoffHours") instanceof Number) {
            freeCancelCutoff = ((Number) snapshot.get("freeCancelCutoffHours")).intValue();
        }

        booking.setClosedAt(now);
        booking.setCloseReason(reason != null && !reason.isBlank() ? reason : "Khách yêu cầu hủy phòng");
        booking.setClosedByActor(ActorType.CUSTOMER);

        if (booking.getStatus() == BookingStatus.CONFIRMED && hoursBeforeCheckIn >= freeCancelCutoff) {
            booking.setStatus(BookingStatus.REFUNDED);
            snapshot.put("refundAmount", booking.getTotalAmount());
            snapshot.put("refundStatus", "APPROVED_FULL");
        } else {
            booking.setStatus(BookingStatus.CANCELLED);
        }
        booking.setPolicySnapshot(snapshot);

        Booking saved = bookingRepository.save(booking);
        if (saved.getStatus() == BookingStatus.REFUNDED) {
            try {
                notificationService.notifyBookingStatusChange(saved, BookingStatus.REFUNDED, reason);
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo REFUNDED cho booking {}: {}", saved.getBookingCode(), ex.getMessage());
            }
        }
        int nights = (int) ChronoUnit.DAYS.between(saved.getCheckIn(), saved.getCheckOut());
        BigDecimal unitPrice = saved.getRoomType().getBasePrice() != null ? saved.getRoomType().getBasePrice() : BigDecimal.ZERO;
        return mapToResponseDto(saved, saved.getPlace(), saved.getRoomType(), unitPrice, nights);
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

        String coverUrl = null;
        try {
            List<String> mediaUrls = placeMediaRepository.findPublicUrlsByPlaceId(place.getId());
            if (mediaUrls != null && !mediaUrls.isEmpty()) {
                coverUrl = mediaUrls.get(0);
            }
            if (coverUrl == null && place.getAttributes() != null && place.getAttributes().containsKey("coverImageUrl")) {
                coverUrl = String.valueOf(place.getAttributes().get("coverImageUrl"));
            }
            if (coverUrl == null && roomType != null) {
                List<String> roomMedia = roomTypeMediaRepository.findPublicUrlsByRoomTypeId(roomType.getId());
                if (roomMedia != null && !roomMedia.isEmpty()) {
                    coverUrl = roomMedia.get(0);
                }
            }
        } catch (Exception e) {
            log.warn("Không thể tải ảnh cho placeId: {}", place.getId());
        }

        List<com.dulichso.bookingapi.dto.BookingChangeRequestDto> changeRequestDtos = Collections.emptyList();
        try {
            List<BookingChangeRequest> crList = bookingChangeRequestRepository.findByBookingIdOrderByCreatedAtDesc(booking.getId());
            if (crList != null && !crList.isEmpty()) {
                changeRequestDtos = crList.stream().map(this::toChangeRequestDto).collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("Không thể tải change requests cho bookingId: {}", booking.getId());
        }

        return BookingResponseDto.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .placeId(place.getId())
                .placeName(place.getName())
                .placeAddress(place.getAddress())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .coverImageUrl(coverUrl)
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
                .changeRequests(changeRequestDtos)
                .build();
    }

    private com.dulichso.bookingapi.dto.BookingChangeRequestDto toChangeRequestDto(BookingChangeRequest cr) {
        return com.dulichso.bookingapi.dto.BookingChangeRequestDto.builder()
                .id(cr.getId())
                .bookingId(cr.getBooking() != null ? cr.getBooking().getId() : null)
                .bookingCode(cr.getBooking() != null ? cr.getBooking().getBookingCode() : null)
                .status(cr.getStatus())
                .guestName(cr.getGuestName())
                .guestPhone(cr.getGuestPhone())
                .guestEmail(cr.getGuestEmail())
                .guestNote(cr.getGuestNote())
                .checkIn(cr.getCheckIn())
                .checkOut(cr.getCheckOut())
                .roomCount(cr.getRoomCount())
                .guestCount(cr.getGuestCount())
                .reason(cr.getReason())
                .rejectionReason(cr.getRejectionReason())
                .reviewedBy(cr.getReviewedBy())
                .reviewedAt(cr.getReviewedAt())
                .createdAt(cr.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public BookingResponseDto updateBookingDetails(String bookingCode, com.dulichso.bookingapi.dto.UpdateBookingDetailsRequest request) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với mã: " + bookingCode));

        if (booking.getStatus() == BookingStatus.PENDING) {
            // Trường hợp PENDING: Được phép thay đổi trực tiếp
            applyDirectBookingChanges(booking, request);
            Booking saved = bookingRepository.save(booking);

            int nights = (int) ChronoUnit.DAYS.between(saved.getCheckIn(), saved.getCheckOut());
            BigDecimal unitPrice = saved.getRoomType().getBasePrice() != null ? saved.getRoomType().getBasePrice() : BigDecimal.ZERO;
            return mapToResponseDto(saved, saved.getPlace(), saved.getRoomType(), unitPrice, nights);
        } else if (booking.getStatus() == BookingStatus.CONFIRMED) {
            // Trường hợp CONFIRMED: Tạo yêu cầu gửi nhà quản lý duyệt
            String serviceItemsJson = null;
            if (request.getServiceItems() != null && !request.getServiceItems().isEmpty()) {
                try {
                    serviceItemsJson = objectMapper.writeValueAsString(request.getServiceItems());
                } catch (Exception e) {
                    log.error("Lỗi serialize serviceItems: {}", e.getMessage());
                }
            }

            BookingChangeRequest changeReq = BookingChangeRequest.builder()
                    .booking(booking)
                    .status(com.dulichso.bookingapi.entity.enums.BookingChangeStatus.PENDING)
                    .guestName(request.getGuestName() != null ? request.getGuestName().trim() : booking.getGuestName())
                    .guestPhone(request.getGuestPhone() != null ? request.getGuestPhone().trim() : booking.getGuestPhone())
                    .guestEmail(request.getGuestEmail() != null ? request.getGuestEmail().trim() : booking.getGuestEmail())
                    .guestNote(request.getGuestNote() != null ? request.getGuestNote().trim() : booking.getGuestNote())
                    .checkIn(request.getCheckIn() != null ? request.getCheckIn() : booking.getCheckIn())
                    .checkOut(request.getCheckOut() != null ? request.getCheckOut() : booking.getCheckOut())
                    .roomCount(request.getRoomCount() != null ? request.getRoomCount() : booking.getRoomCount())
                    .guestCount(request.getGuestCount() != null ? request.getGuestCount() : booking.getGuestCount())
                    .reason(request.getReason() != null ? request.getReason().trim() : "Khách yêu cầu đổi thông tin đơn phòng")
                    .serviceItemsJson(serviceItemsJson)
                    .createdAt(LocalDateTime.now())
                    .build();

            bookingChangeRequestRepository.save(changeReq);
            log.info("Đã tạo yêu cầu thay đổi booking {} chờ quản lý duyệt", bookingCode);

            int nights = (int) ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
            BigDecimal unitPrice = booking.getRoomType().getBasePrice() != null ? booking.getRoomType().getBasePrice() : BigDecimal.ZERO;
            return mapToResponseDto(booking, booking.getPlace(), booking.getRoomType(), unitPrice, nights);
        } else {
            throw new IllegalStateException("Không thể chỉnh sửa đơn đặt phòng ở trạng thái " + booking.getStatus());
        }
    }

    private void applyDirectBookingChanges(Booking booking, com.dulichso.bookingapi.dto.UpdateBookingDetailsRequest request) {
        if (request.getGuestName() != null && !request.getGuestName().isBlank()) {
            booking.setGuestName(request.getGuestName().trim());
        }
        if (request.getGuestPhone() != null && !request.getGuestPhone().isBlank()) {
            booking.setGuestPhone(request.getGuestPhone().trim());
        }
        if (request.getGuestEmail() != null) {
            booking.setGuestEmail(request.getGuestEmail().trim());
        }
        if (request.getGuestNote() != null) {
            booking.setGuestNote(request.getGuestNote().trim());
        }

        LocalDate newCheckIn = request.getCheckIn() != null ? request.getCheckIn() : booking.getCheckIn();
        LocalDate newCheckOut = request.getCheckOut() != null ? request.getCheckOut() : booking.getCheckOut();
        int newRoomCount = request.getRoomCount() != null ? request.getRoomCount() : booking.getRoomCount();
        int newGuestCount = request.getGuestCount() != null ? request.getGuestCount() : booking.getGuestCount();

        boolean datesOrRoomsChanged = !newCheckIn.equals(booking.getCheckIn())
                || !newCheckOut.equals(booking.getCheckOut())
                || newRoomCount != booking.getRoomCount();

        if (datesOrRoomsChanged) {
            if (newCheckIn.isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Không thể chọn ngày nhận phòng trước ngày hiện tại.");
            }
            if (!newCheckOut.isAfter(newCheckIn)) {
                throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng.");
            }

            RoomType roomType = booking.getRoomType();
            int totalCapacity = roomType.getTotalRoomCount() != null ? roomType.getTotalRoomCount() : 5;

            // 1. Nhả tồn kho ngày cũ
            for (LocalDate d = booking.getCheckIn(); d.isBefore(booking.getCheckOut()); d = d.plusDays(1)) {
                final LocalDate stayDate = d;
                roomInventoryDayRepository.findByIdForUpdate(roomType.getId(), stayDate).ifPresent(inv -> {
                    int held = inv.getHeldRooms() != null ? inv.getHeldRooms() : 0;
                    inv.setHeldRooms(Math.max(0, held - booking.getRoomCount()));
                    roomInventoryDayRepository.save(inv);
                });
            }

            // 2. Giữ tồn kho ngày mới
            for (LocalDate d = newCheckIn; d.isBefore(newCheckOut); d = d.plusDays(1)) {
                final LocalDate stayDate = d;
                RoomInventoryDay inv = roomInventoryDayRepository.findByIdForUpdate(roomType.getId(), stayDate)
                        .orElseGet(() -> {
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

                if (Boolean.TRUE.equals(inv.getStopSell())) {
                    throw new IllegalStateException("Phòng đã tạm ngừng nhận khách vào ngày: " + stayDate);
                }

                int occupied = (inv.getHeldRooms() != null ? inv.getHeldRooms() : 0)
                        + (inv.getConfirmedRooms() != null ? inv.getConfirmedRooms() : 0);
                int available = inv.getTotalRooms() - occupied;
                if (available < newRoomCount) {
                    throw new IllegalStateException("Không đủ phòng trống vào ngày " + stayDate + ". Chỉ còn " + Math.max(0, available) + " phòng.");
                }

                inv.setHeldRooms((inv.getHeldRooms() != null ? inv.getHeldRooms() : 0) + newRoomCount);
                roomInventoryDayRepository.save(inv);
            }

            // 3. Cập nhật lại booking_night
            bookingNightRepository.deleteByBookingId(booking.getId());
            BigDecimal unitPrice = roomType.getBasePrice() != null ? roomType.getBasePrice() : BigDecimal.valueOf(500000);
            for (LocalDate d = newCheckIn; d.isBefore(newCheckOut); d = d.plusDays(1)) {
                BookingNight night = BookingNight.builder()
                        .id(new BookingNightId(booking.getId(), d))
                        .booking(booking)
                        .unitPrice(unitPrice)
                        .roomCount(newRoomCount)
                        .build();
                bookingNightRepository.save(night);
            }

            long nightsCount = ChronoUnit.DAYS.between(newCheckIn, newCheckOut);
            BigDecimal newTotal = unitPrice.multiply(BigDecimal.valueOf(nightsCount)).multiply(BigDecimal.valueOf(newRoomCount));

            booking.setCheckIn(newCheckIn);
            booking.setCheckOut(newCheckOut);
            booking.setRoomCount(newRoomCount);
            booking.setTotalAmount(newTotal);
        }

        booking.setGuestCount(newGuestCount);

        // Cập nhật các dịch vụ tư vấn đính kèm (nếu có gửi lên)
        if (request.getServiceItems() != null) {
            booking.getServiceItems().clear();
            for (CreateBookingRequest.ServiceItemRequest itemReq : request.getServiceItems()) {
                BookingServiceItem item = BookingServiceItem.builder()
                        .booking(booking)
                        .serviceName(itemReq.getServiceName())
                        .serviceCode(itemReq.getServiceCode())
                        .note(itemReq.getNote())
                        .isIncluded(itemReq.getIsIncluded() != null ? itemReq.getIsIncluded() : true)
                        .build();
                booking.getServiceItems().add(item);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.dulichso.bookingapi.dto.BookingChangeRequestDto> getChangeRequestsByBookingCode(String bookingCode) {
        return bookingChangeRequestRepository.findByBookingCodeOrderByCreatedAtDesc(bookingCode)
                .stream()
                .map(this::toChangeRequestDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponseDto reviewBookingChangeRequest(Long changeRequestId, boolean approved, String rejectionReason, Long reviewerId) {
        BookingChangeRequest changeReq = bookingChangeRequestRepository.findById(changeRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu thay đổi với ID: " + changeRequestId));

        if (changeReq.getStatus() != com.dulichso.bookingapi.entity.enums.BookingChangeStatus.PENDING) {
            throw new IllegalStateException("Yêu cầu này đã được xử lý trước đó với trạng thái: " + changeReq.getStatus());
        }

        Booking booking = changeReq.getBooking();
        LocalDateTime now = LocalDateTime.now();

        if (approved) {
            changeReq.setStatus(com.dulichso.bookingapi.entity.enums.BookingChangeStatus.APPROVED);
            changeReq.setReviewedBy(reviewerId);
            changeReq.setReviewedAt(now);

            // Cập nhật thông tin sang booking
            com.dulichso.bookingapi.dto.UpdateBookingDetailsRequest req = com.dulichso.bookingapi.dto.UpdateBookingDetailsRequest.builder()
                    .guestName(changeReq.getGuestName())
                    .guestPhone(changeReq.getGuestPhone())
                    .guestEmail(changeReq.getGuestEmail())
                    .guestNote(changeReq.getGuestNote())
                    .checkIn(changeReq.getCheckIn())
                    .checkOut(changeReq.getCheckOut())
                    .roomCount(changeReq.getRoomCount())
                    .guestCount(changeReq.getGuestCount())
                    .build();

            // Nếu thay đổi ngày/phòng ở CONFIRMED, chuyển đổi tồn kho confirmed_rooms
            LocalDate oldCheckIn = booking.getCheckIn();
            LocalDate oldCheckOut = booking.getCheckOut();
            int oldRooms = booking.getRoomCount();

            LocalDate newCheckIn = changeReq.getCheckIn() != null ? changeReq.getCheckIn() : oldCheckIn;
            LocalDate newCheckOut = changeReq.getCheckOut() != null ? changeReq.getCheckOut() : oldCheckOut;
            int newRooms = changeReq.getRoomCount() != null ? changeReq.getRoomCount() : oldRooms;

            boolean datesOrRoomsChanged = !newCheckIn.equals(oldCheckIn) || !newCheckOut.equals(oldCheckOut) || newRooms != oldRooms;
            if (datesOrRoomsChanged) {
                if (!newCheckOut.isAfter(newCheckIn)) {
                    throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng.");
                }
                RoomType roomType = booking.getRoomType();
                int totalCapacity = roomType.getTotalRoomCount() != null ? roomType.getTotalRoomCount() : 5;

                // Nhả confirmed_rooms cũ
                for (LocalDate d = oldCheckIn; d.isBefore(oldCheckOut); d = d.plusDays(1)) {
                    final LocalDate stayDate = d;
                    roomInventoryDayRepository.findByIdForUpdate(roomType.getId(), stayDate).ifPresent(inv -> {
                        int conf = inv.getConfirmedRooms() != null ? inv.getConfirmedRooms() : 0;
                        inv.setConfirmedRooms(Math.max(0, conf - oldRooms));
                        roomInventoryDayRepository.save(inv);
                    });
                }

                // Giữ confirmed_rooms mới
                for (LocalDate d = newCheckIn; d.isBefore(newCheckOut); d = d.plusDays(1)) {
                    final LocalDate stayDate = d;
                    RoomInventoryDay inv = roomInventoryDayRepository.findByIdForUpdate(roomType.getId(), stayDate)
                            .orElseGet(() -> {
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

                    inv.setConfirmedRooms((inv.getConfirmedRooms() != null ? inv.getConfirmedRooms() : 0) + newRooms);
                    roomInventoryDayRepository.save(inv);
                }

                bookingNightRepository.deleteByBookingId(booking.getId());
                BigDecimal unitPrice = roomType.getBasePrice() != null ? roomType.getBasePrice() : BigDecimal.valueOf(500000);
                for (LocalDate d = newCheckIn; d.isBefore(newCheckOut); d = d.plusDays(1)) {
                    BookingNight night = BookingNight.builder()
                            .id(new BookingNightId(booking.getId(), d))
                            .booking(booking)
                            .unitPrice(unitPrice)
                            .roomCount(newRooms)
                            .build();
                    bookingNightRepository.save(night);
                }

                long nightsCount = ChronoUnit.DAYS.between(newCheckIn, newCheckOut);
                BigDecimal newTotal = unitPrice.multiply(BigDecimal.valueOf(nightsCount)).multiply(BigDecimal.valueOf(newRooms));
                booking.setCheckIn(newCheckIn);
                booking.setCheckOut(newCheckOut);
                booking.setRoomCount(newRooms);
                booking.setTotalAmount(newTotal);
            }

            if (changeReq.getGuestName() != null) booking.setGuestName(changeReq.getGuestName());
            if (changeReq.getGuestPhone() != null) booking.setGuestPhone(changeReq.getGuestPhone());
            if (changeReq.getGuestEmail() != null) booking.setGuestEmail(changeReq.getGuestEmail());
            if (changeReq.getGuestNote() != null) booking.setGuestNote(changeReq.getGuestNote());
            if (changeReq.getGuestCount() != null) booking.setGuestCount(changeReq.getGuestCount());

            // Áp dụng cập nhật serviceItems nếu có lưu trong change request
            if (changeReq.getServiceItemsJson() != null && !changeReq.getServiceItemsJson().isBlank()) {
                try {
                    List<CreateBookingRequest.ServiceItemRequest> reqItems = objectMapper.readValue(
                            changeReq.getServiceItemsJson(),
                            new com.fasterxml.jackson.core.type.TypeReference<List<CreateBookingRequest.ServiceItemRequest>>() {}
                    );
                    booking.getServiceItems().clear();
                    for (CreateBookingRequest.ServiceItemRequest itemReq : reqItems) {
                        BookingServiceItem item = BookingServiceItem.builder()
                                .booking(booking)
                                .serviceName(itemReq.getServiceName())
                                .serviceCode(itemReq.getServiceCode())
                                .note(itemReq.getNote())
                                .isIncluded(itemReq.getIsIncluded() != null ? itemReq.getIsIncluded() : true)
                                .build();
                        booking.getServiceItems().add(item);
                    }
                } catch (Exception e) {
                    log.error("Lỗi parse serviceItemsJson khi quản lý duyệt change request {}: {}", changeRequestId, e.getMessage());
                }
            }

            bookingRepository.save(booking);
        } else {
            changeReq.setStatus(com.dulichso.bookingapi.entity.enums.BookingChangeStatus.REJECTED);
            changeReq.setRejectionReason(rejectionReason != null && !rejectionReason.isBlank() ? rejectionReason : "Nhà quản lý từ chối yêu cầu thay đổi.");
            changeReq.setReviewedBy(reviewerId);
            changeReq.setReviewedAt(now);
        }

        bookingChangeRequestRepository.save(changeReq);

        int nights = (int) ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
        BigDecimal unitPrice = booking.getRoomType().getBasePrice() != null ? booking.getRoomType().getBasePrice() : BigDecimal.ZERO;
        return mapToResponseDto(booking, booking.getPlace(), booking.getRoomType(), unitPrice, nights);
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

    @Override
    @Transactional(readOnly = true)
    public com.dulichso.bookingapi.dto.CheckAvailabilityResponse checkAvailability(
            Long roomTypeId, LocalDate checkIn, LocalDate checkOut, int roomCount, String excludeBookingCode) {
        if (checkIn == null || checkOut == null) {
            return com.dulichso.bookingapi.dto.CheckAvailabilityResponse.builder()
                    .available(false)
                    .requestedRooms(roomCount)
                    .minAvailableRooms(0)
                    .message("Ngày nhận phòng và trả phòng không được để trống.")
                    .build();
        }
        if (!checkOut.isAfter(checkIn)) {
            return com.dulichso.bookingapi.dto.CheckAvailabilityResponse.builder()
                    .available(false)
                    .requestedRooms(roomCount)
                    .minAvailableRooms(0)
                    .message("Ngày trả phòng phải sau ngày nhận phòng.")
                    .build();
        }
        if (roomCount <= 0) {
            return com.dulichso.bookingapi.dto.CheckAvailabilityResponse.builder()
                    .available(false)
                    .requestedRooms(roomCount)
                    .minAvailableRooms(0)
                    .message("Số lượng phòng yêu cầu tối thiểu là 1.")
                    .build();
        }

        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hạng phòng với ID: " + roomTypeId));

        int totalCapacity = roomType.getTotalRoomCount() != null ? roomType.getTotalRoomCount() : 5;

        // Tìm booking được loại trừ nếu có
        Booking excludeBooking = null;
        if (excludeBookingCode != null && !excludeBookingCode.trim().isBlank()) {
            excludeBooking = bookingRepository.findByBookingCode(excludeBookingCode.trim()).orElse(null);
        }

        int minAvailable = Integer.MAX_VALUE;

        for (LocalDate d = checkIn; d.isBefore(checkOut); d = d.plusDays(1)) {
            final LocalDate stayDate = d;
            RoomInventoryDay inv = roomInventoryDayRepository.findById(new RoomInventoryDayId(roomTypeId, stayDate))
                    .orElse(null);

            if (inv != null && Boolean.TRUE.equals(inv.getStopSell())) {
                return com.dulichso.bookingapi.dto.CheckAvailabilityResponse.builder()
                        .available(false)
                        .requestedRooms(roomCount)
                        .minAvailableRooms(0)
                        .message("Phòng đã tạm ngừng nhận khách vào ngày: " + stayDate)
                        .build();
            }

            int occupied = 0;
            if (inv != null) {
                occupied = (inv.getHeldRooms() != null ? inv.getHeldRooms() : 0)
                        + (inv.getConfirmedRooms() != null ? inv.getConfirmedRooms() : 0);
            }

            // Nếu ngày này đang được giữ bởi chính booking đang chỉnh sửa, không tính số phòng đó là occupied
            if (excludeBooking != null
                    && !stayDate.isBefore(excludeBooking.getCheckIn())
                    && stayDate.isBefore(excludeBooking.getCheckOut())
                    && excludeBooking.getRoomType().getId().equals(roomTypeId)) {
                occupied = Math.max(0, occupied - excludeBooking.getRoomCount());
            }

            int dayTotal = (inv != null && inv.getTotalRooms() != null) ? inv.getTotalRooms() : totalCapacity;
            int available = Math.max(0, dayTotal - occupied);

            if (available < minAvailable) {
                minAvailable = available;
            }

            if (available < roomCount) {
                return com.dulichso.bookingapi.dto.CheckAvailabilityResponse.builder()
                        .available(false)
                        .requestedRooms(roomCount)
                        .minAvailableRooms(available)
                        .message("Ngày " + stayDate + " chỉ còn trống " + available + " phòng (yêu cầu " + roomCount + " phòng). Vui lòng chọn ngày khác!")
                        .build();
            }
        }

        int finalMin = minAvailable == Integer.MAX_VALUE ? totalCapacity : minAvailable;
        return com.dulichso.bookingapi.dto.CheckAvailabilityResponse.builder()
                .available(true)
                .requestedRooms(roomCount)
                .minAvailableRooms(finalMin)
                .message("Phòng khả dụng! Hiện còn " + finalMin + " phòng trống cho khoảng thời gian này.")
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

    @Override
    @Transactional
    public BookingResponseDto updateBookingStatus(Long bookingId, BookingStatus newStatus, String reason, Long actorAccountId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng với ID: " + bookingId));

        if (newStatus == BookingStatus.CONFIRMED) {
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setConfirmedAt(LocalDateTime.now());
            try {
                notificationService.notifyBookingStatusChange(booking, BookingStatus.CONFIRMED, reason);
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo CONFIRMED: {}", ex.getMessage());
            }
        } else if (newStatus == BookingStatus.REJECTED) {
            booking.setStatus(BookingStatus.REJECTED);
            booking.setClosedAt(LocalDateTime.now());
            booking.setCloseReason(reason != null && !reason.isBlank() ? reason : "Đối tác/Quản lý từ chối đơn đặt phòng.");
            try {
                notificationService.notifyBookingStatusChange(booking, BookingStatus.REJECTED, reason);
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo REJECTED: {}", ex.getMessage());
            }
        } else if (newStatus == BookingStatus.REFUNDED) {
            booking.setStatus(BookingStatus.REFUNDED);
            booking.setClosedAt(LocalDateTime.now());
            booking.setCloseReason(reason != null && !reason.isBlank() ? reason : "Hoàn tiền đơn đặt phòng.");
            try {
                notificationService.notifyBookingStatusChange(booking, BookingStatus.REFUNDED, reason);
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo REFUNDED: {}", ex.getMessage());
            }
        } else {
            booking.setStatus(newStatus);
        }

        Booking saved = bookingRepository.save(booking);
        int nights = (int) ChronoUnit.DAYS.between(saved.getCheckIn(), saved.getCheckOut());
        BigDecimal unitPrice = saved.getRoomType().getBasePrice() != null ? saved.getRoomType().getBasePrice() : BigDecimal.ZERO;
        return mapToResponseDto(saved, saved.getPlace(), saved.getRoomType(), unitPrice, nights);
    }
}

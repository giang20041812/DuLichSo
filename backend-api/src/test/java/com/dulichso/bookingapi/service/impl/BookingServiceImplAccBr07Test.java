package com.dulichso.bookingapi.service.impl;

import com.dulichso.bookingapi.dto.CreateBookingRequest;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Place;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.RoomType;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.PlaceRepository;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * ACC-BR-07: một Homestay không được nhận Booking mới khi NCC sở hữu nó đang "ngừng hoạt động" (Provider.status)
 * HOẶC tài khoản đăng nhập của NCC đó đang bị khóa (Account.status) — hai trạng thái độc lập, chỉ cần một
 * trong hai là không ACTIVE thì phải chặn. Chỉ kiểm tra guard sớm trong createBooking (trước khi chạm tới
 * tồn kho phòng), nên các repository/service khác không cần mock.
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceImplAccBr07Test {

    @Mock
    private PlaceRepository placeRepository;
    @Mock
    private RoomTypeRepository roomTypeRepository;
    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private BookingServiceImpl service;

    @BeforeEach
    void setUp() {
        // No manual initialization needed, @InjectMocks handles it
    }

    private CreateBookingRequest request() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setPlaceId(1L);
        req.setRoomTypeId(2L);
        req.setCheckIn(LocalDate.now().plusDays(3));
        req.setCheckOut(LocalDate.now().plusDays(5));
        req.setRoomCount(1);
        req.setGuestCount(2);
        return req;
    }

    private Place placeWithProvider(Provider provider) {
        RoomType roomType = RoomType.builder().id(2L).build();
        Place place = Place.builder().id(1L).provider(provider).build();
        roomType.setPlace(place);
        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));
        when(roomTypeRepository.findLockedById(2L)).thenReturn(Optional.of(roomType));
        return place;
    }

    @Test
    @DisplayName("Provider SUSPENDED: chặn đặt phòng mới")
    void providerSuspended_blocksBooking() {
        Provider provider = Provider.builder().id(9L).status(ProviderStatus.SUSPENDED).build();
        placeWithProvider(provider);

        assertThrows(IllegalStateException.class, () -> service.createBooking(request()));
    }

    @Test
    @DisplayName("Provider ACTIVE nhưng tài khoản đăng nhập NCC bị khóa: vẫn chặn đặt phòng mới")
    void providerAccountLocked_blocksBooking() {
        Provider provider = Provider.builder().id(9L).status(ProviderStatus.ACTIVE).build();
        placeWithProvider(provider);
        Account lockedAccount = Account.builder().id(5L).status(AccountStatus.INACTIVE).build();
        when(accountRepository.findByProviderIdOrderByIdAsc(9L)).thenReturn(List.of(lockedAccount));

        assertThrows(IllegalStateException.class, () -> service.createBooking(request()));
    }

    @Test
    @DisplayName("Provider ACTIVE và tài khoản NCC ACTIVE: vượt qua guard ACC-BR-07 (lỗi tiếp theo không phải do NCC)")
    void providerAndAccountActive_passesGuard() {
        Provider provider = Provider.builder().id(9L).status(ProviderStatus.ACTIVE).build();
        Place place = placeWithProvider(provider);
        place.setVisibility(com.dulichso.bookingapi.entity.enums.PlaceVisibility.PUBLISHED);
        Account activeAccount = Account.builder().id(5L).status(AccountStatus.ACTIVE).build();
        when(accountRepository.findByProviderIdOrderByIdAsc(9L)).thenReturn(List.of(activeAccount));

        // Guard ACC-BR-07 phải KHÔNG chặn ở đây — lỗi (nếu có) phải đến từ bước sau đó (vd: NPE do các mock
        // khác chưa thiết lập), không được là IllegalStateException "Nhà cung cấp hiện không hoạt động".
        try {
            service.createBooking(request());
        } catch (IllegalStateException ex) {
            org.junit.jupiter.api.Assertions.assertFalse(
                    ex.getMessage() != null && ex.getMessage().contains("Nhà cung cấp hiện không hoạt động"),
                    "Không được chặn khi Provider và Account của NCC đều đang ACTIVE");
        } catch (Exception ignored) {
            // Các phụ thuộc phía sau (roomType.status, roomCalendarService...) không được mock trong test này
            // — chỉ quan tâm guard ACC-BR-07 đã được vượt qua, không quan tâm lỗi tiếp theo.
        }
    }
}

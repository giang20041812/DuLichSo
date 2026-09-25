# Bàn giao từ module NCC cho module Admin và Khách hàng

Module NCC (nhánh `ncc`) đã có backend và DB cho các chức năng dưới đây. Một số use case cần thêm phần giao diện hoặc API ở module Admin hoặc Khách hàng mới chạy trọn vẹn. Các file của 2 module đó NCC **không sửa**, nên mình ghi lại ở đây để các bạn làm tiếp.

Migration liên quan: `backend-api/src/main/resources/db/changelog/changes/008-booking-feedback-reviews-provider-applications.xml`.

---

## Phần cho module Admin

### 1. Duyệt hồ sơ đăng ký NCC (FR-AD-03, đi cùng UC-NCC-08)

NCC tự đăng ký qua `POST /api/v1/auth/provider/register` (trang `/register/partner`). Hồ sơ được lưu vào bảng **`provider_application`** với `status = 'PENDING'`. Bảng `provider` không có trạng thái chờ duyệt (UC-09), nên **chưa có `provider` hay `account` nào được tạo lúc đăng ký**.

Admin cần làm:
- Màn hình danh sách hồ sơ, lọc theo `status` (`PENDING` / `APPROVED` / `REJECTED`).
- **Duyệt:** trong cùng một transaction, khóa hồ sơ (pessimistic lock) rồi:
  1. Kiểm tra lại `contact_phone` / `contact_email` chưa thuộc tài khoản nào (`AccountRepository.findByIdentifier`).
  2. Tạo `Provider` (`name = business_name`, `contact_*`, `address`, `status = ACTIVE`).
  3. Tạo `Account` (`role = PROVIDER`, `status = ACTIVE`, `phone`, `email`, `full_name = contact_name`, `provider = provider vừa tạo`). **`password_hash` lấy nguyên từ hồ sơ**, vì đã được băm BCrypt, không băm lại.
  4. Cập nhật hồ sơ: `status = 'APPROVED'`, `provider_id`, `reviewed_by`, `reviewed_at`.
- **Từ chối:** `status = 'REJECTED'`, `review_note = lý do` (tối đa 500 ký tự), `reviewed_by`, `reviewed_at`.
- Mẫu thông báo đã có sẵn: `PROVIDER_APPLICATION_APPROVED` (`{{business_name}}`) và `PROVIDER_APPLICATION_REJECTED` (`{{business_name}}`, `{{reason}}`).
- Tùy chọn: khi NCC đăng nhập lúc hồ sơ chưa duyệt, `AccountAuthService.login` có thể tra `provider_application` theo identifier và mật khẩu để báo "Hồ sơ đang chờ duyệt" thay vì "Sai thông tin đăng nhập".

### 2. Lỗi có sẵn: `principal.accountId()` luôn `null`

`JwtAuthenticationFilter` tạo `new UserPrincipal(null, username, role, null)`, nên **21 chỗ trong 7 controller Admin** (`AdminAccount`, `AdminFinance`, `AdminPlace`, `AdminProvider`, `AdminSos`, `AdminTraveler`) luôn nhận `accountId = null`. Hậu quả: API duyệt/từ chối hoàn tiền luôn trả 401, audit log không biết ai thao tác, và các kiểm tra "không tự thao tác trên chính mình" không có tác dụng.

Gợi ý sửa: trong filter, tra `accountRepository.findByIdentifier(username)`. Filter vốn đã tra như vậy cho role PROVIDER ở `isProviderBlocked`. Sau đó truyền `account.getId()` và `account.getProvider().getId()` vào `UserPrincipal`.

---

## Phần cho module Khách hàng

### 3. Cho khách xem kết quả xử lý đơn (FR-NCC-22)

Khi NCC chấp nhận hoặc từ chối, backend đã ghi đầy đủ:
- `booking.status`: `AWAITING_PAYMENT` (đã chấp nhận, `payment_deadline_at` = lúc chấp nhận + 15 phút) hoặc `REJECTED`.
- `booking.close_reason`: lý do từ chối.
- `booking_status_history`: dòng có `actor = 'PROVIDER'`, `reason` = lời nhắn của chủ nhà khi chấp nhận (phương án phòng, điều kiện, phản hồi yêu cầu đặc biệt).
- Nếu NCC đổi phương án phòng khi chấp nhận thì `booking.room_type_id`, `booking.total_amount` và các dòng `booking_night` được cập nhật.
- Bảng `notification` có bản ghi `PENDING` với template `BOOKING_ACCEPTED_CUSTOMER` / `BOOKING_REJECTED_CUSTOMER`. Chưa có bộ gửi SMS/email.

Khách hàng cần làm: trang tra cứu đơn cho khách không có tài khoản. **Nên yêu cầu cả mã đơn và số điện thoại** (UC-06), dùng `POST` để số điện thoại không nằm trong URL, và giới hạn số lần thử. Có thể dùng lại `com.dulichso.bookingapi.security.SimpleRateLimiter`.

### 4. Khách trả lời yêu cầu bổ sung thông tin (FR-NCC-14)

NCC gửi yêu cầu qua `POST /api/v1/partner/bookings/{id}/info-requests`. Yêu cầu được lưu vào bảng **`booking_info_request`** (`message`, `created_at`, `response_text`, `responded_at`). Đơn vẫn `PENDING` và vẫn giữ phòng. Mỗi đơn chỉ có tối đa 1 yêu cầu chưa được trả lời (`responded_at IS NULL`). Template thông báo: `BOOKING_INFO_REQUESTED`.

Khách hàng cần làm, ví dụ ngay trong trang tra cứu đơn:
- Hiện các yêu cầu. Có thể gọi `PartnerBookingService.infoRequests(em, bookingId)` để lấy danh sách.
- Cho khách trả lời: set `response_text` (tối đa 1000 ký tự) và `responded_at`. Nên khóa booking và chỉ cho trả lời khi `status = PENDING`. Có thể cho khách cập nhật `guest_email` / `guest_note`.
- Template báo cho NCC: `BOOKING_INFO_ANSWERED` (`recipient_type = ACCOUNT`, tài khoản của provider).

Màn xử lý đơn của NCC tự hiện câu trả lời khi `response_text` có giá trị.

### 5. Hiện phản hồi của chủ nhà dưới đánh giá (FR-KH-26, đi cùng UC-NCC-10)

Bảng `review` có thêm cột `provider_reply` (TEXT), `provider_reply_at`, `provider_reply_by`. Entity `Review` đã có các field này. Cần:
- Thêm `providerReply`, `providerReplyAt` vào `dto/ReviewDto.java` và map trong `PublicPlaceService.getPlaceReviews`.
- Thêm 2 field đó vào `types/review.ts` và hiển thị dưới mỗi đánh giá trên trang Homestay.

### 6. Link tới trang đăng ký đối tác

Trang `/register/partner` đã có nhưng chưa được link từ đâu. Nên thêm link ở `RegisterPage.tsx` (thay câu "vui lòng liên hệ Quản trị viên để được cấp tài khoản") và ở `PortalLoginPage.tsx`.

### 7. Lỗi bảo mật có sẵn: `GET /api/public/bookings/{bookingCode}`

Endpoint này trả về tên, số điện thoại, email của khách mà chỉ cần biết mã đơn. Mã có dạng `VJ-` + 6 chữ số nên dò được. Frontend hiện không gọi endpoint này (`getBookingByCode` trong `bookingService.ts` không có chỗ nào dùng). Nên xóa, hoặc bắt nhập thêm số điện thoại như mục 3.

# AGENTS.md — DuLichSo Project Rules

Đọc file này trước khi thực hiện bất kỳ task nào trong project. Áp dụng cho
mọi module trong `frontend-pwa` và mọi agent làm việc trong workspace này.

## Tech Stack
- Frontend: React + Vite + TypeScript (strict mode) — PWA
- Backend: Java Spring Boot (Maven)
- Tích hợp: SEPay, Google Maps, Cloudflare Images (ảnh/video), Firebase Cloud
  Messaging, Gemini API

## Nguyên tắc TypeScript — BẮT BUỘC

1. **Không dùng `any`.** Nếu thực sự không xác định được kiểu dữ liệu, dùng
   `unknown` và narrow type trước khi sử dụng. Không được dùng `any` để né
   lỗi compile.

2. **Không dùng `@ts-ignore`.** Nếu bắt buộc phải bỏ qua một lỗi type, dùng
   `@ts-expect-error` kèm comment giải thích lý do cụ thể (tối thiểu một câu),
   và phải xóa comment đó ngay khi lỗi gốc được sửa. Không để `@ts-expect-error`
   tồn tại quá 1 sprint mà không có ticket theo dõi.

3. **Type cho dữ liệu bên thứ ba phải dựa trên tài liệu chính thức**, không
   tự đoán field. Áp dụng cho: response của SEPay, Google Maps API, Firebase,
   Cloudflare Images, Gemini API. Nếu chưa xác minh được cấu trúc response thật, phải
   ghi rõ `// TODO: verify against docs — chưa xác minh với API thật` ngay
   trong file định nghĩa type, và không được coi task đó là "Done".

4. **Không định nghĩa trùng type.** Toàn bộ type/interface dùng chung giữa
   các module (Homestay, Booking, Room, Review, Itinerary, User...) chỉ định
   nghĩa MỘT LẦN trong `src/types/`. Trước khi tạo interface mới, phải kiểm
   tra `src/types/` xem đã có chưa — nếu có, import lại, không viết lại.

5. **Tên field phải khớp với backend.** Field trong type ở frontend phải
   trùng tên với field trả về từ Entity/DTO tương ứng bên `backend-api`
   (kiểm tra trong `src/main/java/.../entity` hoặc DTO trước khi định nghĩa
   type frontend). Không tự ý đổi tên field cho "đẹp" (vd: không đổi
   `checkInDate` thành `checkIn` nếu backend trả `checkInDate`).

6. **Trước khi báo task hoàn thành, phải chạy `tsc --noEmit` và
   `npm run lint` không có lỗi.** Không được sửa `tsconfig.json` hoặc
   `eslint.config.js` để tắt rule nhằm qua lỗi — nếu thấy rule quá chặt cho
   một trường hợp cụ thể, dừng lại và hỏi thay vì tự nới lỏng cấu hình.

## Cấu trúc thư mục type bắt buộc

```
frontend-pwa/src/types/
├─ homestay.ts
├─ booking.ts
├─ room.ts
├─ review.ts
├─ itinerary.ts
├─ user.ts
└─ integrations/
   ├─ sepay.ts
   ├─ google-maps.ts
   ├─ firebase.ts
   └─ gemini.ts
```

## Nguyên tắc UI & Styling — BẮT BUỘC

1. **Border-radius tinh gọn, sắc sảo (ít bo tròn, không bo tròn quá đà)**:
   - Các thành phần giao diện như nút bấm (buttons), panels, cards, dialogs/modals, inputs, dropdowns... chỉ sử dụng border-radius nhỏ / vừa phải (subtle/sharp).
   - Thang giá trị chuẩn:
     - Nhỏ (sm): `4px` (`rounded-sm` hoặc `rounded`)
     - Vừa (md): `6px` (`rounded-md` - khuyên dùng cho button, input)
     - Lớn (lg): tối đa `8px` (`rounded-lg` - dành cho card, modal, panel lớn)
   - TUYỆT ĐỐI KHÔNG dùng border-radius quá tròn như `rounded-2xl`, `rounded-3xl`, `rounded-full` cho panels, cards, modals, containers hay nút bấm (trừ avatar tròn hoặc chip/badge đặc thù khi có chỉ định rõ).
   - Không thiết kế nút bấm dạng pill capsule (tròn xoe 2 đầu).

2. **Bảng màu sống động chuẩn thiên nhiên (Eco Tropical Glow: Teal, Aqua, Golden Sun & Sunset Coral)**:
   - Primary: `#048C73` (`--color-primary`, Deep Teal) — màu thương hiệu cốt lõi, Header, thanh tìm kiếm chủ đạo, active links.
   - Secondary: `#06B6D4` / `#3DC9D9` (`--color-secondary`, Bright Aqua) — điểm nhấn biển trời, sông nước, icon tươi mát.
   - Tropical Sun / Nắng Vàng Lúa Chín: `#F59E0B` (`--color-sun`, Golden Amber) — rating sao, huy hiệu mùa vụ/nổi bật, tag giá ưu đãi, tạo sinh khí ấm áp rực rỡ.
   - Tropical Sunset / Cam San Hô CTA: `#F97316` / `#EA580C` (`--color-coral`, Coral / Sunset Orange) — nút hành động chuyển đổi cao (Đặt phòng, Xem chi tiết, Nhận ưu đãi), tạo điểm nhấn thị giác cuốn hút.
   - Eco Leaf / Sinh Thái: `#10B981` / `#52D967` (`--color-accent`, Emerald Green) — nhãn sinh thái bản địa, bảo hiểm, cam kết xanh.
   - Backgrounds: Canvas `#F6FAF8` (Eco Mist trong lành dịu nhẹ), Surface `#FFFFFF` (Pure White).
   - Tuyệt đối không hardcode mã hex bừa bãi; luôn dùng CSS variable tokens đã định nghĩa trong `src/styles/globals.css`.

3. **Chiều sâu thị giác & Hiệu ứng tương tác (Visual Depth & Micro-interactions)**:
   - Sử dụng tinted soft shadow (đổ bóng màu nhẹ) thay vì bóng xám đen đơn điệu để card nổi khối sống động, cao cấp.
   - Card hover effect: Nhẹ nhàng nâng lên 2px (`hover:-translate-y-0.5`), viền sáng lên nhẹ nhàng (`transition-all duration-300`).
   - Micro-animations: Mượt mà với cubic-bezier chuẩn (`200ms - 300ms`).

## Nguyên tắc kiến trúc hệ thống — BẮT BUỘC

### Backend / dữ liệu
- Đặt phòng (booking) phải chống race condition: dùng unique constraint ở DB
  cho cặp (room_id, khoảng ngày) hoặc pessimistic lock khi kiểm tra + tạo
  booking trong cùng transaction. Không được chỉ "check rồi insert" tách rời.
- Không bao giờ trả thẳng JPA Entity ra API — luôn map qua DTO. Đặc biệt chú
  ý các quan hệ hai chiều (`@OneToMany`/`@ManyToOne`) dễ gây vòng lặp
  serialize hoặc lộ field nội bộ không nên public.
- Khi query danh sách có include quan hệ lazy load (vd: homestay kèm rooms,
  reviews), phải dùng fetch join hoặc `@EntityGraph` — không load list rồi
  loop truy cập quan hệ lazy (N+1 query).
- Index cho các cột dùng để search/filter nhiều: vị trí, khoảng ngày, giá.

### AI booking (Gemini)
- **Gemini KHÔNG BAO GIỜ được sinh ra raw SQL để backend thực thi trực
  tiếp.** Đây là lỗ hổng prompt injection → SQL injection. Gemini chỉ được
  trả về tham số lọc có cấu trúc (JSON: location, priceRange, dateRange,
  guestCount...); backend tự build query bằng query builder/ORM đã kiểm
  soát (JPA Criteria/Specification), không ghép chuỗi SQL từ output AI.
- Validate schema của structured output từ Gemini trước khi dùng (đúng kiểu
  dữ liệu, đúng field cho phép) — không tin tưởng tuyệt đối response AI trả
  về đã đúng định dạng.
- Có rate limit cho endpoint gọi Gemini (theo user/IP) để tránh phát sinh
  chi phí không kiểm soát khi bị spam.

### Thanh toán (SEPay)
- Webhook nhận callback phải xác minh chữ ký (signature) theo tài liệu
  SEPay — không xử lý request nếu chữ ký sai hoặc thiếu.
- Webhook phải idempotent: dùng mã giao dịch làm khóa duy nhất, nhận trùng
  lần 2 thì bỏ qua, không cộng tiền/tạo booking lại.
- Có cơ chế giữ chỗ (hold) kèm timeout: nếu khách vào trang thanh toán rồi
  bỏ ngang, phòng phải được nhả lại sau một khoảng thời gian xác định, không
  giữ vô thời hạn.

### Bên thứ ba (Maps, Cloudflare Images, FCM)
- API key Google Maps phải giới hạn theo domain/app (restrict key), không
  dùng key không giới hạn.
- Upload ảnh/video lên Cloudflare Images phải qua cơ chế Direct Creator Upload (Backend gọi Cloudflare API để lấy upload URL 1 lần, Frontend dùng URL đó để upload ảnh trực tiếp).
- Giới hạn loại file và dung lượng tối đa khi nhận upload từ client.

### Secrets & môi trường
- Vite expose mọi biến có tiền tố `VITE_` thẳng vào bundle frontend, ai mở
  DevTools cũng đọc được. Secret key (SEPay secret, Cloudflare API Token,
  Gemini server key...) chỉ được đặt ở backend, KHÔNG BAO GIỜ đặt tiền tố
  `VITE_`. Chỉ public/publishable key mới được đưa ra frontend.
- CORS không được cấu hình `*` (allow tất cả origin) kể cả lúc dev — phải
  khai rõ origin cho phép ngay từ đầu.

### Phân quyền theo actor
- Mọi endpoint CRUD phải kiểm tra không chỉ "đã đăng nhập" mà cả "có sở hữu
  resource này không" (row-level authorization). Ví dụ: đối tác A không
  được xem/sửa dữ liệu homestay của đối tác B dù cả hai đều có role
  DOI_TAC.

## Git
- Commit theo conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`...)
- Không commit `.env`, chỉ commit `.env.example`
- Nhánh: `main` (production), `develop` (tích hợp), `feature/<ten-tinh-nang>`

## Khi không chắc chắn
Nếu một quyết định kiến trúc hoặc type ảnh hưởng đến nhiều module (vd: đổi
field dùng chung, đổi cấu trúc response AI booking), agent phải dừng lại và
hỏi trước khi thực hiện, thay vì tự quyết rồi generate hàng loạt code dựa
trên giả định sai.

## Không chạy playwright bừa bãi

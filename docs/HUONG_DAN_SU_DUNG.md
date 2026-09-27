# Hướng dẫn sử dụng DuLichSo — Admin, Nhà cung cấp, Khách và Vận hành

Tài liệu này mô tả **các chức năng mới và thay đổi** sau đợt hoàn thiện Admin/NCC (NFR + duyệt thay đổi). Đọc mục **0** trước, các mục sau tra cứu khi cần.

> Ghi chú độ tin cậy: mọi chức năng dưới đây đã có test tự động ở mức service (151 test, xem `BAO_CAO_TRUOC_SAU.xlsx`), nhưng **chưa chạy trên MySQL thật và chưa thử bằng trình duyệt**. Trước khi dùng thật, chạy backend một lần để áp dụng migration (mục 4.2) rồi làm theo "Kiểm tra nhanh sau khi cài" (mục 4.6).

---

## 0. Đọc nhanh: ai làm gì, ở đâu

| Bên | Việc cần làm | Vị trí trên giao diện |
|---|---|---|
| Admin | Duyệt/từ chối hồ sơ NCC mới | Đối tác / NCC → tab **Hồ sơ đăng ký** |
| Admin | Duyệt/từ chối thay đổi Homestay, phòng, giá của NCC | Kiểm duyệt điểm đến → tab **Yêu cầu thay đổi** |
| Admin | Ẩn / gỡ / giữ nguyên / khôi phục đánh giá | Kiểm duyệt điểm đến → tab **Đánh giá** |
| Admin | Đổi quyền tài khoản (Admin ⇄ NCC) | Tài khoản → mở tài khoản → **Đổi quyền** |
| Admin | Xem dòng tiền từng NCC / Homestay | Tài chính → khối **Dòng tiền nhà cung cấp / Homestay** |
| Admin | Tra cứu nhật ký hệ thống (ai làm gì, lúc nào) | Tổng quan → **Hoạt động gần đây** → **Xem tất cả** |
| NCC | Đăng ký làm đối tác, chờ duyệt | `/register/partner` |
| NCC | Sửa Homestay/phòng/giá khi đang công khai → **chờ Admin duyệt** | Trang Homestay và Phòng, giá của NCC (giao diện cũ) |
| Mọi tài khoản Admin/NCC | Phiên hết hạn sau 30 phút không thao tác | Tự đăng xuất, đăng nhập lại |

**Ba quy tắc cần nhớ**
1. NCC sửa Homestay **đang công khai** thì dữ liệu công khai **không đổi cho đến khi Admin duyệt**.
2. Mọi thao tác có hậu quả (duyệt, từ chối, ẩn, gỡ, đổi quyền) đều hỏi xác nhận và **được ghi vào Nhật ký hệ thống**.
3. Đổi quyền, khóa tài khoản hoặc đặt lại mật khẩu sẽ **đăng xuất ngay** mọi phiên đang mở của tài khoản đó.

---

## 1. Dành cho Quản trị viên (Admin)

### 1.1 Đăng nhập và phiên làm việc
- Đăng nhập tại `/admin/login` (hoặc `/portal/login`).
- Phiên tự hết hạn khi **30 phút không thao tác** (hoặc sau 8 giờ kể từ lúc đăng nhập). Hệ thống đưa bạn về trang đăng nhập.
- Bấm **Đăng xuất** sẽ thu hồi phiên trên máy chủ (không chỉ xóa ở trình duyệt).
- Nếu tài khoản bạn bị khóa hoặc bị đổi quyền trong lúc đang dùng, lần thao tác tiếp theo sẽ bị đăng xuất.

### 1.2 Duyệt hồ sơ NCC mới (Đối tác / NCC → tab "Hồ sơ đăng ký")
NCC tự đăng ký ở `/register/partner`. Hồ sơ nằm ở đây với trạng thái **Chờ duyệt** (con số trên tab là số hồ sơ đang chờ).

1. Chọn hồ sơ (bấm dòng hoặc **Xem**) để đọc: cơ sở, người liên hệ, SĐT, email, địa chỉ, giấy phép kinh doanh, mô tả.
2. **Duyệt**: hệ thống tạo đối tác + tài khoản đăng nhập cho NCC bằng đúng thông tin và **mật khẩu NCC đã tự đặt** (bạn không cần cấp mật khẩu). NCC nhận thông báo.
3. **Từ chối**: bắt buộc nhập lý do; NCC nhận thông báo kèm lý do và có thể đăng ký lại.

Lưu ý
- Nếu SĐT hoặc email của hồ sơ đã thuộc tài khoản khác, hồ sơ hiện cảnh báo đỏ và **không thể duyệt** (chỉ từ chối).
- Hồ sơ đã xử lý không thể xử lý lại.
- Bộ lọc: trạng thái (mặc định Chờ duyệt), từ khóa (tên cơ sở, người liên hệ, SĐT, email), ngày gửi. Có phân trang.

### 1.3 Duyệt thay đổi Homestay / phòng / giá (Kiểm duyệt điểm đến → tab "Yêu cầu thay đổi")
Khi NCC sửa **thông tin Homestay, loại phòng hoặc giá** (giá cơ bản, cuối tuần, giá đặc biệt) của Homestay **đang công khai**, thay đổi vào đây thay vì ghi thẳng.

1. Bấm dòng để mở ngăn bên phải: mỗi trường thay đổi hiện **Hiện tại** (bên trái) và **Đề xuất mới** (bên phải).
2. Nếu thấy cảnh báo vàng "Dữ liệu chính thức đã thay đổi kể từ lúc gửi", nội dung "Hiện tại" có thể không còn khớp — đọc kỹ trước khi duyệt.
3. **Duyệt**: nội dung mới được ghi vào dữ liệu chính thức. **Từ chối**: bắt buộc lý do, dữ liệu giữ nguyên.
4. Nếu duyệt báo lỗi (ví dụ giảm số phòng khi đã có đơn giữ chỗ), yêu cầu vẫn ở trạng thái chờ: hãy **Từ chối** kèm lý do để NCC sửa lại.

Không cần duyệt: lịch tồn phòng, khóa ngày, ảnh/video, và mọi thay đổi trên Homestay **chưa công khai** (nháp/đã gỡ).

### 1.4 Kiểm duyệt đánh giá (Kiểm duyệt điểm đến → tab "Đánh giá")
Danh sách đánh giá kèm ngữ cảnh: Homestay, NCC, tên khách, mã đặt phòng (không hiển thị SĐT/email khách). Lọc theo trạng thái, số sao, từ khóa, ngày.

| Thao tác | Kết quả | Lý do |
|---|---|---|
| **Giữ nguyên** | Không đổi, chỉ ghi nhận đã xem xét | Không bắt buộc |
| **Ẩn** | Không hiển thị công khai, **không tính vào điểm** Homestay; khôi phục được | Bắt buộc |
| **Gỡ** | Gỡ vì vi phạm, **không khôi phục**, không tính vào điểm | Bắt buộc |
| **Khôi phục** (chỉ với đánh giá đang ẩn) | Hiển thị lại, tính lại điểm | Không bắt buộc |

Điểm trung bình và số đánh giá của Homestay được **tính lại tự động** mỗi khi trạng thái thay đổi.

### 1.5 Quản lý tài khoản và đổi quyền (Tài khoản)
- Tìm, xem chi tiết, khóa/mở, đặt lại mật khẩu như trước.
- **Đổi quyền** (mới): mở tài khoản quản trị/NCC → mục "Quyền truy cập hiện tại" → **Đổi quyền**.
  - Quản trị viên → Nhà cung cấp: chọn nhà cung cấp (chỉ hiện NCC **chưa có** tài khoản).
  - Nhà cung cấp → Quản trị viên: không cần chọn thêm.
  - Nhập **lý do** → **Xem lại** → **Xác nhận đổi quyền**.
  - Hệ thống chặn: tự đổi quyền của chính mình; hạ quyền Admin đang hoạt động **cuối cùng**; NCC đã có tài khoản khác.
  - Có hiệu lực ngay và **đăng xuất** mọi phiên đang mở của tài khoản đó.
- Hệ thống hiện chỉ có 2 quyền (Admin, Nhà cung cấp); chưa có phân quyền chi tiết theo chức năng.

### 1.6 Dòng tiền NCC / Homestay (Tài chính → "Dòng tiền nhà cung cấp / Homestay")
Chọn **Nhóm theo**: nhà cung cấp hoặc Homestay. Chọn kỳ (mặc định từ đầu tháng đến hôm nay, tối đa 3 năm), tìm theo tên, sắp xếp, phân trang.

| Cột | Ý nghĩa |
|---|---|
| Booking đã thu | Số đơn có thanh toán thành công trong kỳ |
| Thu | Tổng tiền thanh toán thành công (tính theo ngày thanh toán) |
| Hoàn | Tổng tiền đã hoàn (tính theo ngày xử lý hoàn) |
| Chờ hoàn | Tiền hoàn đang chờ duyệt **hiện tại** (chưa trừ vào Ròng) |
| Ròng | Thu − Hoàn (có thể âm nếu hoàn nhiều hơn thu trong kỳ) |

Dải tổng ở đầu bảng luôn tính **trên toàn bộ kết quả đã lọc**, không phụ thuộc trang đang xem. Chưa có khái niệm hoa hồng sàn hay chi trả NCC.

### 1.7 Nhật ký hệ thống (Tổng quan → Hoạt động gần đây → "Xem tất cả")
Chỉ đọc, không sửa/xóa được. Lọc: thời gian, người thao tác (Admin/NCC/Khách/Hệ thống), kết quả (Thành công/Thất bại/Bị từ chối), loại đối tượng, mã hành động hoặc mã đối tượng. Bấm một dòng để xem **trước/sau** và lý do.

Được ghi: đăng nhập, đăng nhập thất bại, đăng nhập bị chặn, đăng xuất, bị từ chối truy cập, đổi quyền/trạng thái/mật khẩu, duyệt/từ chối hồ sơ NCC, duyệt/từ chối thay đổi, kiểm duyệt đánh giá, hoàn tiền, SOS, dọn dữ liệu định kỳ.
Định danh trong log được che (ví dụ `a***@gmail.com`, `*******678`); **không** ghi mật khẩu, token hay OTP.
Bảng "Hoạt động gần đây" ở Tổng quan **không hiện** các dòng đăng nhập/đăng xuất (quá dày); muốn xem hãy vào "Xem tất cả".
Nhật ký được **giữ 180 ngày** rồi tự xóa (mục 4.4).

### 1.8 Các mục Admin không đổi
Tổng quan (số liệu), Báo cáo, Đặt phòng (giám sát, ghi chú xác minh, đơn cần chú ý), Tài chính (duyệt/từ chối hoàn tiền), SOS. Danh sách **Đối tác** giờ có phân trang (15 dòng/trang).

---

## 2. Dành cho Nhà cung cấp (NCC)

### 2.1 Đăng ký và chờ duyệt
Đăng ký tại `/register/partner`. Sau khi gửi, hồ sơ **chờ Admin duyệt**; chưa đăng nhập được. Khi được duyệt, đăng nhập bằng SĐT/email và mật khẩu đã đặt lúc đăng ký. Nếu bị từ chối, bạn nhận lý do và có thể đăng ký lại.
Hạn chế hiện tại: nếu đăng nhập khi hồ sơ chưa duyệt, hệ thống vẫn báo "Sai thông tin đăng nhập" (chưa có thông báo "đang chờ duyệt").

### 2.2 Sửa Homestay, loại phòng, giá
- **Homestay chưa công khai (nháp / đã gỡ):** lưu là có hiệu lực ngay như trước.
- **Homestay đang công khai:** khi bấm Lưu, bạn thấy thông báo *"Homestay đang công khai nên thay đổi đã được gửi cho quản trị viên duyệt. Dữ liệu hiện hành chưa thay đổi..."*. Khách vẫn thấy nội dung cũ cho đến khi Admin duyệt.
  - Gửi lại lần nữa cho cùng đối tượng sẽ **thay thế** yêu cầu đang chờ trước đó.
  - Gửi nội dung y hệt hiện tại sẽ bị từ chối ("Không có thay đổi nào").
  - Sau khi Admin duyệt, mở lại trang sẽ thấy nội dung mới; nếu bị từ chối, dữ liệu giữ nguyên.
- **Không cần duyệt:** lịch tồn phòng, khóa ngày, ảnh/video, phản hồi đánh giá.
- Hạn chế hiện tại: chưa có màn hình để NCC xem danh sách yêu cầu và trạng thái duyệt (API đã sẵn: `GET /api/v1/partner/change-requests`), và chưa có thông báo khi được duyệt/từ chối.

### 2.3 Phiên đăng nhập
Hết hạn sau 30 phút không thao tác, hoặc ngay khi tài khoản bị khóa/đổi quyền/đặt lại mật khẩu. NCC chỉ xem và sửa dữ liệu **của chính mình**; máy chủ kiểm tra thật, không chỉ ẩn menu.

---

## 3. Dành cho Khách du lịch
Không đổi giao diện hay cách dùng. Khác biệt duy nhất phía sau: đăng nhập và đăng nhập thất bại của khách được ghi vào nhật ký (định danh được che). Đánh giá bị Admin ẩn/gỡ sẽ **không còn hiển thị** ở trang Homestay và không tính vào điểm sao.

---

## 4. Dành cho Kỹ thuật / Vận hành

### 4.1 Biến môi trường mới (đều có giá trị mặc định)
| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `SESSION_IDLE_TIMEOUT_MINUTES` | 30 | Số phút không thao tác thì hết phiên Admin/NCC |
| `JWT_EXPIRATION_MS` | 28800000 (8 giờ) | Thời hạn tối đa của một phiên (trước đây 24 giờ) |
| `JPA_SHOW_SQL` | false | In SQL ra log (chỉ bật khi debug; SQL có thể chứa dữ liệu cá nhân) |
| `RETENTION_ENABLED` | true | Bật/tắt job dọn dữ liệu quá hạn |
| `RETENTION_AUDIT_LOG_DAYS` | 180 | Giữ nhật ký hệ thống bao nhiêu ngày |
| `RETENTION_RESET_TOKEN_DAYS` | 7 | Xóa mã OTP đặt lại mật khẩu sau khi hết hạn bao nhiêu ngày |
| `RETENTION_NOTIFICATION_DAYS` | 90 | Giữ thông báo trong ứng dụng bao nhiêu ngày |
| `RETENTION_CRON` | `0 30 3 * * *` | Lịch chạy job dọn (03:30 mỗi ngày) |

Thời hạn nhỏ hơn 1 ngày bị từ chối khi khởi động (tránh xóa nhầm toàn bộ). **Booking, đánh giá, tài khoản không tự xóa**; thời hạn lưu cần bộ phận pháp chế quyết định.

### 4.2 Migration (Liquibase, tự chạy khi khởi động backend)
| File | Nội dung |
|---|---|
| `011-security-session-audit` | `account.token_version`, `account.last_activity_at`; `audit_log.result`, `audit_log.ip`, `entity_id` cho phép null; 3 index |
| `012-partner-change-request` | Bảng `partner_change_request` |
| `013-report-performance-indexes` | Index cho tra cứu Booking/báo cáo/dòng tiền theo thời gian |
| `014-review-moderation` | Trạng thái `REMOVED` cho `review`, cột người/lý do/thời điểm kiểm duyệt |

**Sao lưu CSDL trước khi chạy lần đầu.** Sau khi triển khai, mọi Admin/NCC đang đăng nhập bị đăng xuất một lần (token cũ không có phiên bản).

### 4.3 API mới (tất cả `/api/v1/admin/**` chỉ ADMIN)
| Chức năng | API |
|---|---|
| Nhật ký hệ thống | `GET /audit-logs`, `GET /audit-logs/{id}` |
| Duyệt thay đổi NCC | `GET /change-requests`, `/summary`, `/{id}`, `POST /{id}/approve`, `POST /{id}/reject` |
| Duyệt hồ sơ NCC | `GET /provider-applications`, `/summary`, `/{id}`, `POST /{id}/approve`, `POST /{id}/reject` |
| Kiểm duyệt đánh giá | `GET /reviews`, `/{id}`, `POST /{id}/moderate` (`KEEP/HIDE/REMOVE/RESTORE`) |
| Dòng tiền | `GET /finance/cashflow` |
| Đổi quyền | `PATCH /accounts/{id}/role` |
| NCC | `GET /api/v1/partner/change-requests`, `DELETE /api/v1/partner/change-requests/{id}` (rút lại) |
| Đăng xuất | `POST /api/v1/auth/portal/logout` |
| Sức khỏe hệ thống | `GET /api/public/health` (200 = ứng dụng + CSDL ổn, 503 = CSDL lỗi) |

Đổi hành vi: `PUT /partner/homestays/{id}`, `POST/PUT /partner/homestays/{id}/rooms...`, `.../prices...` trả **202** + `{changeRequestId, status, message}` khi Homestay đang công khai.
Mã lỗi phiên mới: `401 SESSION_EXPIRED` (quá 30 phút không thao tác), `401 SESSION_REVOKED` (đổi quyền/khóa/đặt lại mật khẩu/đăng xuất).

### 4.4 Chính sách lưu giữ dữ liệu
| Dữ liệu | Thời hạn | Cách xử lý |
|---|---|---|
| Nhật ký hệ thống | 180 ngày | Xóa tự động hằng ngày |
| Mã OTP đặt lại mật khẩu | 7 ngày sau hết hạn | Xóa tự động |
| Thông báo trong ứng dụng | 90 ngày | Xóa tự động |
| Booking, đánh giá, tài khoản | Chưa quyết định | **Không xóa tự động**; cần pháp chế chốt |

Mỗi lần job xóa được dữ liệu, một dòng `DATA_RETENTION_PURGE` (người thao tác: Hệ thống) được ghi vào nhật ký kèm số bản ghi đã xóa.

### 4.5 Sao lưu và phục hồi
Script: `ops/backup/backup-mysql.sh`, `ops/backup/restore-mysql.sh` (cần `mysqldump`/`mysql`, bash; trên Windows dùng Git Bash).

- **Sao lưu** (mục tiêu RPO ≤ 24 giờ): đặt lịch chạy hằng ngày, ví dụ cron `30 2 * * * DB_USERNAME=... DB_PASSWORD=... /path/backup-mysql.sh`. Mỗi file `.sql.gz` có `.sha256`; tự xóa bản cũ hơn `BACKUP_RETAIN_DAYS` (mặc định 14).
- **Phục hồi** (mục tiêu RTO ≤ 4 giờ): `CONFIRM_RESTORE=yes DB_USERNAME=... DB_PASSWORD=... ./restore-mysql.sh <file.sql.gz> [TARGET_DB]`. Mặc định phục hồi vào CSDL an toàn `dulichso_restore_test`; muốn ghi đè CSDL thật phải chỉ định tên rõ ràng.
- **Việc còn phải làm bằng tay:** đặt lịch chạy, sao chép file sao lưu ra nơi lưu trữ ngoài máy chủ, và **thử phục hồi định kỳ** (khuyến nghị mỗi tháng). Các script này **chưa được chạy thử** trong quá trình phát triển.

### 4.6 Kiểm tra nhanh sau khi cài
1. Khởi động backend → không có lỗi Liquibase/JPQL; `GET /api/public/health` trả `UP`.
2. Đăng nhập Admin → mở Tổng quan → "Xem tất cả" thấy dòng `Đăng nhập`.
3. NCC test sửa tên một Homestay **đang công khai** → thấy thông báo chờ duyệt → Admin vào tab Yêu cầu thay đổi thấy cũ/mới → Duyệt → mở trang công khai thấy tên mới.
4. Đăng ký một NCC mới → Admin duyệt → NCC đăng nhập được.
5. Đổi quyền một tài khoản test → tài khoản đó bị đăng xuất ở lần thao tác tiếp theo.
6. Chạy test backend: `mvn test` (kết quả mong đợi: 151 test, **3 lỗi có sẵn** ở `PartnerBookingServiceTest` — xem 5.1).

---

## 5. Sự cố thường gặp

### 5.1 Vấn đề đã có từ trước (không do đợt này)
- 3 test `PartnerBookingServiceTest` fail: code hiện xác nhận đơn (CONFIRMED) ngay khi NCC chấp nhận thay vì chờ thanh toán (AWAITING_PAYMENT) như test kỳ vọng. Cần quyết định nghiệp vụ nào đúng rồi sửa test hoặc code.
- `tsc` báo 3 biến không dùng trong `Header.tsx`.
- `.env.example` từng chứa mật khẩu MySQL thật (đã thay bằng giá trị giả, nhưng vẫn nằm trong lịch sử git → nên **đổi mật khẩu MySQL root**).

### 5.2 Câu hỏi thường gặp
| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| Bị đưa về trang đăng nhập bất ngờ | Quá 30 phút không thao tác, hoặc tài khoản vừa bị đổi quyền/khóa/đặt lại mật khẩu |
| NCC báo "sửa xong nhưng khách vẫn thấy nội dung cũ" | Homestay đang công khai: chờ Admin duyệt ở tab Yêu cầu thay đổi |
| Admin bấm Duyệt thay đổi báo lỗi | Dữ liệu đề xuất không còn hợp lệ (vd giảm số phòng khi đã có đơn giữ chỗ). Từ chối kèm lý do |
| Không duyệt được hồ sơ NCC | SĐT/email đã thuộc tài khoản khác. Từ chối kèm lý do |
| Không thấy NCC trong danh sách chọn khi đổi quyền Admin → NCC | Chỉ hiện NCC chưa có tài khoản (mỗi NCC một tài khoản) |
| Tổng "Ròng" ở dòng tiền âm | Trong kỳ hoàn nhiều hơn thu (hoàn cho đơn đã thu ở kỳ trước) |
| Tab "Hồ sơ đăng ký"/"Yêu cầu thay đổi" không có số | Không tải được số đếm; danh sách vẫn xem được |

---

## 6. Phụ lục: mã hành động trong Nhật ký hệ thống
| Mã | Nghĩa |
|---|---|
| `LOGIN_SUCCESS` / `LOGIN_FAILED` / `LOGIN_BLOCKED` / `LOGOUT` | Đăng nhập / thất bại / bị chặn (khóa, đình chỉ) / đăng xuất |
| `ACCESS_DENIED` | Người đã đăng nhập bị từ chối truy cập một API (ghi đường dẫn, không ghi tham số) |
| `UPDATE_ACCOUNT_ROLE` | Đổi quyền tài khoản |
| `UPDATE_ACCOUNT_STATUS`, `RESET_PASSWORD` | Khóa/mở tài khoản, đặt lại mật khẩu |
| `PROVIDER_APPLICATION_APPROVED` / `_REJECTED` | Duyệt / từ chối hồ sơ NCC |
| `CHANGE_REQUEST_APPROVED` / `_REJECTED` | Duyệt / từ chối thay đổi Homestay/phòng/giá |
| `REVIEW_KEPT` / `_HIDDEN` / `_REMOVED` / `_RESTORED` | Giữ nguyên / ẩn / gỡ / khôi phục đánh giá |
| `DATA_RETENTION_PURGE` | Job dọn dữ liệu quá hạn lưu giữ |

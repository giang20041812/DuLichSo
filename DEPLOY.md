# Hướng dẫn deploy DuLichSo

## 1. Database (MySQL 8)
1. Tạo schema `dulichso` và chạy `dulichsoDBscript.sql` (cấu trúc bảng).
2. Chạy **`dulichso_deploy.sql`** — 1 file duy nhất gồm: xóa dữ liệu cũ → nạp dữ liệu Mù Cang Chải → tạo tài khoản đăng nhập.
   > Cảnh báo: file này `TRUNCATE` toàn bộ bảng (kể cả `account`, `booking`). Chỉ chạy trên DB mới hoặc khi chấp nhận mất dữ liệu.
3. Bảng `traveler` (khách du lịch) tự tạo khi backend khởi động lần đầu (Liquibase 004, 005).

### Tài khoản sau khi chạy `dulichso_deploy.sql`
| Vai trò | Đăng nhập | Mật khẩu |
|---|---|---|
| Admin | `admin@taybactrails.vn` hoặc `0988888888` | `Admin@123456` |
| NCC (40 tài khoản) | SĐT của từng cơ sở (xem SELECT cuối file) | `Ncc@123456` |

**Đổi mật khẩu ngay sau khi đăng nhập** (Admin → Quản lý Tài khoản → biểu tượng chìa khóa).

## 2. Backend (Spring Boot, Java 17+)
Đặt các biến môi trường (xem `backend-api/.env.example`):

| Biến | Ý nghĩa |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Kết nối MySQL |
| `JWT_SECRET` | Chuỗi bí mật ≥ 32 ký tự — **bắt buộc đổi**, không dùng mặc định |
| `CORS_ALLOWED_ORIGINS` | Origin frontend, vd `https://app.example.com` (nhiều origin cách nhau dấu phẩy) |
| `GOOGLE_OAUTH_CLIENT_ID` | Client ID Google (nếu dùng đăng nhập Google) |
| `APP_QA_MOCK_ACCOUNTS` | Để `false` (mặc định) trên production |

Chạy: `mvn -DskipTests package` rồi `java -jar target/*.jar`.

## 3. Frontend (Vite)
Tạo `frontend-pwa/.env.production`:
```
VITE_API_ORIGIN=https://api.example.com   # để trống nếu dùng reverse proxy cùng domain
VITE_GOOGLE_OAUTH_CLIENT_ID=xxxx.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=...
```
Build: `npm ci && npm run build` → thư mục `dist/`.

Chọn **một** trong hai cách kết nối API:
- **Cùng domain (khuyến nghị):** nginx phục vụ `dist/` và chuyển `/api` sang backend, `VITE_API_ORIGIN` để trống:
  ```nginx
  server {
    listen 80;
    root /var/www/dulichso/dist;
    location /api/ { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
    location / { try_files $uri /index.html; }
  }
  ```
- **Khác domain:** đặt `VITE_API_ORIGIN` = URL backend và thêm origin frontend vào `CORS_ALLOWED_ORIGINS`.

Host tĩnh (Vercel/Netlify) đã có sẵn `vercel.json` và `public/_redirects` để trang `/login`, `/admin`... không bị 404 khi tải lại.

## 4. Google đăng nhập
Google Cloud Console → Credentials → OAuth Client (Web) → thêm domain frontend vào **Authorized JavaScript origins**. Không có bước này nút Google sẽ báo lỗi origin.

## 5. Kiểm tra sau deploy
- `POST /api/v1/auth/portal/login` với Admin → trả token.
- Đăng nhập NCC bằng SĐT → vào `/partner`.
- Mở `/admin` → các tab tải được dữ liệu (nếu 403 kiểm tra `CORS_ALLOWED_ORIGINS` và JWT).

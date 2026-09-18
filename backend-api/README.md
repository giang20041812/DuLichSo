# Backend API - Booking System

## Yêu cầu cài đặt
- Java 17
- Maven 3.8+
- Docker & Docker Compose (cho Database & Redis)

## Thiết lập môi trường (Local)

1. **Khởi chạy Database & Redis bằng Docker Compose:**
```bash
docker-compose up -d
```

2. **Cấu hình biến môi trường:**
- Copy file `.env.example` thành `.env` (hoặc cấu hình trực tiếp vào Run Configuration của IDE).
- Đảm bảo các thông tin kết nối DB khớp với cấu hình trong `docker-compose.yml`.

3. **Chạy ứng dụng:**
Sử dụng IDE (IntelliJ/Eclipse) để chạy class `BookingApiApplication`, hoặc chạy qua Maven:
```bash
mvn spring-boot:run
```

## Lưu ý về tích hợp
- **SEPay Webhook:** Cần public port localhost thông qua Ngrok (`ngrok http 8080`) để test webhook từ SEPay ở môi trường local.
- **Firebase:** Cần thêm file `serviceAccountKey.json` từ Firebase Console để cấu hình FCM.

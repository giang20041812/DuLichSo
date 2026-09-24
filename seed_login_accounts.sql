-- ============================================================================
-- Tài khoản đăng nhập để test / bàn giao. Chạy 1 lần trên database đã deploy (MySQL).
-- Mật khẩu lưu dạng BCrypt — backend đã hỗ trợ đăng nhập bằng BCrypt.
--
--   ADMIN : admin@taybactrails.vn (hoặc SĐT 0988888888)   / Admin@123456
--   NCC   : SĐT của từng nhà cung cấp (xem kết quả SELECT cuối file) / Ncc@123456
--
-- !!! ĐỔI MẬT KHẨU NGAY sau khi đăng nhập được (tab Quản lý Tài khoản → biểu tượng chìa khóa).
-- !!! Không dùng các mật khẩu này trên môi trường thật.
-- Có thể chạy lại nhiều lần (idempotent).
-- ============================================================================

-- 1. Tài khoản ADMIN
INSERT INTO account (email, phone, password_hash, role, status, provider_id, full_name)
VALUES ('admin@taybactrails.vn', '0988888888',
        '$2a$10$RybDHBN8Jj.niSKa0MhBVub/RoLNp1U40wHgaIKAEUwwUXYBexC9K',
        'ADMIN', 'ACTIVE', NULL, 'Quản trị viên')
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    role          = 'ADMIN',
    status        = 'ACTIVE',
    provider_id   = NULL;

-- 2. Đặt mật khẩu cho mọi tài khoản NCC còn mật khẩu giữ chỗ (PLACEHOLDER) từ file InititialData.sql
UPDATE account
SET password_hash = '$2a$10$Grje4POomgt3eaepEipIwuSB15M9EzOwDSpcNowc6e6zSyU6es1iu',
    status        = 'ACTIVE'
WHERE role = 'PROVIDER'
  AND password_hash LIKE '%PLACEHOLDER%';

-- 3. Kiểm tra: danh sách tài khoản NCC và trạng thái cơ sở.
--    NCC chỉ đăng nhập được khi cả tài khoản (a.status) và cơ sở (provider_status) đều ACTIVE.
SELECT a.id            AS account_id,
       a.phone         AS login_phone,
       a.email         AS login_email,
       a.status        AS account_status,
       p.name          AS provider_name,
       p.status        AS provider_status
FROM account a
LEFT JOIN provider p ON p.id = a.provider_id
ORDER BY a.role, a.id;

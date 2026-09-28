-- Dữ liệu demo CHỈ để xem thử màn hình "Tài chính" phía Admin trên máy dev cục bộ.
-- KHÔNG phải migration chính thức — không nằm trong db.changelog-master.xml, không chạy tự động.
-- An toàn để chạy nhiều lần: các INSERT dùng booking_code/mã cố định (VJ-9000xx), chạy lại sẽ báo lỗi trùng
-- khóa (booking_code UNIQUE) thay vì tạo trùng dữ liệu — nếu muốn seed lại, xóa các bản ghi VJ-9000xx trước.
START TRANSACTION;

-- Cổng thanh toán demo (bảng payment_gateway hiện chưa có dòng nào trên máy dev này).
INSERT INTO payment_gateway (code, name, is_active)
SELECT 'SEPAY_DEMO', 'SePay (Demo)', 1
WHERE NOT EXISTS (SELECT 1 FROM payment_gateway WHERE code = 'SEPAY_DEMO');
SET @gateway_id = (SELECT id FROM payment_gateway WHERE code = 'SEPAY_DEMO');
SET @admin_id = 41; -- admin@taybactrails.vn — đổi lại nếu tài khoản này không tồn tại trên máy bạn.

-- ── 8 Booking demo trải trên nhiều NCC/Homestay và nhiều tháng để biểu đồ doanh thu có dữ liệu ──
INSERT INTO booking (booking_code, place_id, room_type_id, provider_id, check_in, check_out, room_count, guest_count,
                      guest_name, guest_phone, guest_email, status, currency, total_amount, policy_snapshot,
                      created_at, confirmed_at)
VALUES
  ('VJ-900001', 1,  1,  1, '2026-09-03', '2026-09-05', 1, 2, 'Nguyễn Văn Demo A', '+84900000001', 'demoa@example.test', 'COMPLETED', 'VND', 1600000, JSON_OBJECT(), '2026-09-02 09:00:00', '2026-09-02 09:05:00'),
  ('VJ-900002', 2,  4,  2, '2026-09-08', '2026-09-11', 1, 3, 'Trần Thị Demo B',  '+84900000002', 'demob@example.test', 'CONFIRMED', 'VND', 3600000, JSON_OBJECT(), '2026-09-07 10:00:00', '2026-09-07 10:05:00'),
  ('VJ-900003', 3,  7,  3, '2026-09-13', '2026-09-15', 1, 2, 'Lê Văn Demo C',    '+84900000003', 'democ@example.test', 'COMPLETED', 'VND', 1300000, JSON_OBJECT(), '2026-09-12 08:00:00', '2026-09-12 08:05:00'),
  ('VJ-900004', 4,  10, 4, '2026-09-18', '2026-09-22', 1, 2, 'Phạm Thị Demo D',  '+84900000004', 'demod@example.test', 'COMPLETED', 'VND', 1600000, JSON_OBJECT(), '2026-09-17 14:00:00', '2026-09-17 14:05:00'),
  ('VJ-900005', 5,  13, 5, '2026-09-20', '2026-09-22', 1, 2, 'Hoàng Văn Demo E', '+84900000005', 'demoe@example.test', 'COMPLETED', 'VND', 1200000, JSON_OBJECT(), '2026-09-19 11:00:00', '2026-09-19 11:05:00'),
  ('VJ-900006', 11, 30, 1, '2026-07-10', '2026-07-12', 1, 2, 'Vũ Thị Demo F',    '+84900000006', 'demof@example.test', 'COMPLETED', 'VND', 1400000, JSON_OBJECT(), '2026-07-09 09:00:00', '2026-07-09 09:05:00'),
  ('VJ-900007', 2,  5,  2, '2026-06-05', '2026-06-06', 1, 2, 'Đặng Văn Demo G',  '+84900000007', 'demog@example.test', 'COMPLETED', 'VND', 1600000, JSON_OBJECT(), '2026-06-04 09:00:00', '2026-06-04 09:05:00'),
  ('VJ-900008', 3,  8,  3, '2026-05-15', '2026-05-18', 1, 3, 'Bùi Thị Demo H',   '+84900000008', 'demoh@example.test', 'COMPLETED', 'VND', 1350000, JSON_OBJECT(), '2026-05-14 09:00:00', '2026-05-14 09:05:00');

-- ── Giao dịch thanh toán thành công (SUCCESS) cho từng Booking — mỗi Booking tối đa 1 giao dịch SUCCESS ──
INSERT INTO payment_transaction (booking_id, gateway_id, external_txn_id, amount, currency, status, initiated_at, paid_at)
SELECT b.id, @gateway_id, CONCAT('DEMO-TXN-', b.booking_code), b.total_amount, 'VND', 'SUCCESS', b.created_at, b.confirmed_at
FROM booking b WHERE b.booking_code IN
  ('VJ-900001','VJ-900002','VJ-900003','VJ-900004','VJ-900005','VJ-900006','VJ-900007','VJ-900008');

-- ── Hoàn tiền: 1 đang chờ duyệt (để thấy nút Duyệt/Từ chối hoạt động), 1 đã duyệt, 1 đã từ chối ──
INSERT INTO refund (booking_id, payment_transaction_id, refund_type, amount, reason, status, requested_at, processed_at, processed_by)
SELECT b.id, pt.id, 'FULL_REFUND', b.total_amount,
       'NCC tạm ngừng hoạt động, khách yêu cầu hoàn tiền toàn bộ.', 'PENDING', '2026-09-23 08:00:00', NULL, NULL
FROM booking b JOIN payment_transaction pt ON pt.booking_id = b.id WHERE b.booking_code = 'VJ-900004';

INSERT INTO refund (booking_id, payment_transaction_id, refund_type, amount, reason, status, requested_at, processed_at, processed_by)
SELECT b.id, pt.id, 'FULL_REFUND', b.total_amount,
       'Homestay báo hết phòng vào phút chót, đã xác minh và duyệt hoàn.', 'PROCESSED', '2026-09-13 08:00:00', '2026-09-13 09:00:00', @admin_id
FROM booking b JOIN payment_transaction pt ON pt.booking_id = b.id WHERE b.booking_code = 'VJ-900003';

INSERT INTO refund (booking_id, payment_transaction_id, refund_type, amount, reason, status, requested_at, processed_at, processed_by)
SELECT b.id, pt.id, 'NO_REFUND', b.total_amount,
       'Yêu cầu hủy gửi sau thời hạn hủy miễn phí trong chính sách.', 'REJECTED', '2026-09-21 08:00:00', '2026-09-21 09:00:00', @admin_id
FROM booking b JOIN payment_transaction pt ON pt.booking_id = b.id WHERE b.booking_code = 'VJ-900005';

COMMIT;

-- Kiểm tra nhanh sau khi chạy:
SELECT (SELECT COUNT(*) FROM booking WHERE booking_code LIKE 'VJ-9000%') AS demo_bookings,
       (SELECT COUNT(*) FROM payment_transaction WHERE external_txn_id LIKE 'DEMO-TXN-%') AS demo_payments,
       (SELECT COUNT(*) FROM refund WHERE reason LIKE '%hoàn%' OR reason LIKE '%hủy%') AS demo_refunds_hint;

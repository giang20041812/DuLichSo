#!/usr/bin/env bash
# NFR-BKP-01: sao lưu toàn bộ CSDL DuLichSo (booking, tài khoản, homestay, giá, tình trạng phòng, đánh giá, audit log).
# Chạy hằng ngày (RPO <= 24 giờ). Thông tin đăng nhập lấy từ biến môi trường, KHÔNG ghi vào file này.
#
#   DB_USERNAME, DB_PASSWORD   bắt buộc
#   DB_HOST (localhost), DB_PORT (3306), DB_NAME (dulichso)
#   BACKUP_DIR (./backups), BACKUP_RETAIN_DAYS (14)
set -euo pipefail

: "${DB_USERNAME:?Thiếu DB_USERNAME}"
: "${DB_PASSWORD:?Thiếu DB_PASSWORD}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-dulichso}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y%m%d-%H%M%S)"
file="$BACKUP_DIR/${DB_NAME}-${stamp}.sql.gz"

# MYSQL_PWD để mật khẩu không xuất hiện trong danh sách tiến trình.
# --single-transaction: sao lưu nhất quán không khóa bảng (InnoDB).
MYSQL_PWD="$DB_PASSWORD" mysqldump \
  --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USERNAME" \
  --single-transaction --routines --triggers --events \
  --default-character-set=utf8mb4 --set-gtid-purged=OFF \
  "$DB_NAME" | gzip > "$file.partial"

# Chỉ công nhận bản sao lưu khi file nén nguyên vẹn.
gzip -t "$file.partial"
mv "$file.partial" "$file"
sha256sum "$file" > "$file.sha256"

# Xóa bản sao lưu cũ hơn số ngày giữ lại.
find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}-*.sql.gz*" -mtime +"$RETAIN_DAYS" -delete

echo "OK: $file ($(du -h "$file" | cut -f1))"

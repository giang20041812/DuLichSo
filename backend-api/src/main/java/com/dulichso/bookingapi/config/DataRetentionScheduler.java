package com.dulichso.bookingapi.config;

import com.dulichso.bookingapi.service.DataRetentionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;

/** Chạy dọn dữ liệu quá hạn lưu giữ mỗi ngày (mặc định 03:30). Tắt bằng app.retention.enabled=false. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.retention.enabled", havingValue = "true", matchIfMissing = true)
public class DataRetentionScheduler {
    private static final Logger log = LoggerFactory.getLogger(DataRetentionScheduler.class);

    private final DataRetentionService retention;

    public DataRetentionScheduler(DataRetentionService retention) {
        this.retention = retention;
    }

    @Scheduled(cron = "${app.retention.cron:0 30 3 * * *}")
    public void run() {
        try {
            retention.purge(LocalDateTime.now());
        } catch (Exception ex) {
            // Lỗi dọn dữ liệu không được làm sập ứng dụng; lần chạy sau sẽ thử lại.
            log.error("Dọn dữ liệu theo chính sách lưu giữ thất bại: {}", ex.getMessage());
        }
    }
}

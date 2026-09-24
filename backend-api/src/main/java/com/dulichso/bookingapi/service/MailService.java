package com.dulichso.bookingapi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Gửi email qua SMTP (cấu hình MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD).
 * Gửi bất đồng bộ để thời gian phản hồi API không tiết lộ email có tồn tại hay không.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String host;
    private final String username;
    private final String from;

    public MailService(ObjectProvider<JavaMailSender> mailSender,
                       @Value("${spring.mail.host:}") String host,
                       @Value("${spring.mail.username:}") String username,
                       @Value("${app.mail.from:}") String from) {
        this.mailSender = mailSender;
        this.host = host;
        this.username = username;
        this.from = from;
    }

    public boolean isConfigured() {
        return host != null && !host.isBlank() && username != null && !username.isBlank();
    }

    @Async
    public void sendText(String to, String subject, String body) {
        if (!isConfigured()) {
            log.warn("Chưa cấu hình SMTP (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD) — bỏ qua gửi email tới {}", mask(to));
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.warn("Không có JavaMailSender — bỏ qua gửi email tới {}", mask(to));
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from != null && !from.isBlank() ? from : username);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
            log.info("Đã gửi email '{}' tới {}", subject, mask(to));
        } catch (Exception ex) {
            log.error("Gửi email tới {} thất bại: {}", mask(to), ex.getMessage());
        }
    }

    static String mask(String email) {
        if (email == null) return "";
        int at = email.indexOf('@');
        if (at <= 1) return "***" + (at >= 0 ? email.substring(at) : "");
        return email.charAt(0) + "***" + email.substring(at);
    }
}

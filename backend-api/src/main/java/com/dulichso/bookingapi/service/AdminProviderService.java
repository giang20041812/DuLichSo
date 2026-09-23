package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.admin.AdminProviderDtos.*;
import com.dulichso.bookingapi.entity.Account;
import com.dulichso.bookingapi.entity.Provider;
import com.dulichso.bookingapi.entity.enums.AccountRole;
import com.dulichso.bookingapi.entity.enums.AccountStatus;
import com.dulichso.bookingapi.entity.enums.ProviderStatus;
import com.dulichso.bookingapi.repository.AccountRepository;
import com.dulichso.bookingapi.repository.ProviderRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AdminProviderService {

    private final ProviderRepository providerRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public AdminProviderService(ProviderRepository providerRepository,
                                AccountRepository accountRepository,
                                PasswordEncoder passwordEncoder,
                                AuditLogService auditLogService) {
        this.providerRepository = providerRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<ProviderSummaryDto> getProviders(ProviderStatus status) {
        List<Provider> providers = (status != null)
                ? providerRepository.findByStatusOrderByCreatedAtDesc(status)
                : providerRepository.findAllByOrderByCreatedAtDesc();

        // Lấy số lượng places và accounts theo provider để tránh N+1 queries
        Map<Long, Long> placeCounts = new HashMap<>();
        for (Object[] row : providerRepository.countPlacesByProvider()) {
            if (row[0] != null) {
                placeCounts.put((Long) row[0], ((Number) row[1]).longValue());
            }
        }

        Map<Long, Long> accountCounts = new HashMap<>();
        for (Object[] row : providerRepository.countAccountsByProvider()) {
            if (row[0] != null) {
                accountCounts.put((Long) row[0], ((Number) row[1]).longValue());
            }
        }

        return providers.stream()
                .map(p -> mapToDto(p, placeCounts.getOrDefault(p.getId(), 0L), accountCounts.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProviderSummaryDto getProviderById(Long id) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đối tác NCC với ID: " + id));

        // Đếm số lượng
        long placeCount = providerRepository.countPlacesByProvider().stream()
                .filter(row -> Objects.equals(row[0], id))
                .map(row -> ((Number) row[1]).longValue())
                .findFirst().orElse(0L);

        long accountCount = providerRepository.countAccountsByProvider().stream()
                .filter(row -> Objects.equals(row[0], id))
                .map(row -> ((Number) row[1]).longValue())
                .findFirst().orElse(0L);

        return mapToDto(provider, placeCount, accountCount);
    }

    @Transactional
    public ProviderSummaryDto createProviderWithAccount(CreateProviderWithAccountRequest request, Long callerAccountId) {
        if (accountRepository.existsByEmail(request.getAccountEmail())) {
            throw new IllegalArgumentException("Email tài khoản " + request.getAccountEmail() + " đã được sử dụng");
        }

        // 1. Tạo Provider luôn ở trạng thái ACTIVE (schema chuẩn xác nhận không có Pending Approval)
        Provider provider = Provider.builder()
                .name(request.getName().trim())
                .contactName(request.getContactName() != null ? request.getContactName().trim() : null)
                .contactPhone(request.getContactPhone() != null ? request.getContactPhone().trim() : null)
                .contactEmail(request.getContactEmail() != null ? request.getContactEmail().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .note(request.getNote())
                .status(ProviderStatus.ACTIVE)
                .build();

        Provider savedProvider = providerRepository.save(provider);

        // 2. Tạo tài khoản đăng nhập đầu tiên cho NCC
        Account account = Account.builder()
                .email(request.getAccountEmail().trim().toLowerCase())
                .phone(request.getAccountPhone() != null ? request.getAccountPhone().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getAccountPassword()))
                .fullName(request.getAccountFullName().trim())
                .role(AccountRole.PROVIDER)
                .status(AccountStatus.ACTIVE)
                .provider(savedProvider)
                .build();

        accountRepository.save(account);

        auditLogService.record(
                callerAccountId,
                "CREATE_PROVIDER",
                "Provider",
                savedProvider.getId(),
                "Tạo mới Đối tác NCC và tài khoản đăng nhập đầu tiên: " + savedProvider.getName(),
                null,
                Map.of("providerName", savedProvider.getName(), "accountEmail", account.getEmail())
        );

        return mapToDto(savedProvider, 0L, 1L);
    }

    @Transactional
    public ProviderSummaryDto updateProvider(Long id, UpdateProviderRequest request, Long callerAccountId) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đối tác NCC với ID: " + id));

        Map<String, Object> before = Map.of(
                "name", Objects.toString(provider.getName(), ""),
                "contactName", Objects.toString(provider.getContactName(), ""),
                "contactPhone", Objects.toString(provider.getContactPhone(), "")
        );

        provider.setName(request.getName().trim());
        if (request.getContactName() != null) provider.setContactName(request.getContactName().trim());
        if (request.getContactPhone() != null) provider.setContactPhone(request.getContactPhone().trim());
        if (request.getContactEmail() != null) provider.setContactEmail(request.getContactEmail().trim());
        if (request.getAddress() != null) provider.setAddress(request.getAddress().trim());
        if (request.getNote() != null) provider.setNote(request.getNote());

        Provider saved = providerRepository.save(provider);

        auditLogService.record(
                callerAccountId,
                "UPDATE_PROVIDER",
                "Provider",
                saved.getId(),
                "Cập nhật hồ sơ đối tác NCC",
                before,
                Map.of(
                        "name", Objects.toString(saved.getName(), ""),
                        "contactName", Objects.toString(saved.getContactName(), ""),
                        "contactPhone", Objects.toString(saved.getContactPhone(), "")
                )
        );

        return getProviderById(saved.getId());
    }

    @Transactional
    public ProviderSummaryDto updateProviderStatus(Long id, UpdateProviderStatusRequest request, Long callerAccountId) {
        Provider provider = providerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đối tác NCC với ID: " + id));

        ProviderStatus oldStatus = provider.getStatus();
        provider.setStatus(request.getStatus());
        Provider saved = providerRepository.save(provider);

        auditLogService.record(
                callerAccountId,
                "UPDATE_PROVIDER_STATUS",
                "Provider",
                saved.getId(),
                request.getReason() != null ? request.getReason() : "Thay đổi trạng thái Đối tác NCC",
                Map.of("status", oldStatus.name()),
                Map.of("status", saved.getStatus().name())
        );

        return getProviderById(saved.getId());
    }

    private ProviderSummaryDto mapToDto(Provider p, long placeCount, long accountCount) {
        return ProviderSummaryDto.builder()
                .id(p.getId())
                .name(p.getName())
                .contactName(p.getContactName())
                .contactPhone(p.getContactPhone())
                .contactEmail(p.getContactEmail())
                .address(p.getAddress())
                .note(p.getNote())
                .status(p.getStatus())
                .placeCount(placeCount)
                .accountCount(accountCount)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

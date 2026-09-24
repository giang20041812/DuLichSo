package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.SosRequest;
import com.dulichso.bookingapi.entity.enums.SosRequestStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SosRequestRepository extends JpaRepository<SosRequest, Long> {

    /**
     * Lấy danh sách SOS request theo status, kèm assignedContact (tránh N+1).
     */
    @EntityGraph(attributePaths = {"assignedContact", "assignedContact.region"})
    List<SosRequest> findByStatusOrderByCreatedAtDesc(SosRequestStatus status);

    long countByStatus(SosRequestStatus status);

    /**
     * Lấy tất cả SOS request, sắp xếp mới nhất trước, kèm assignedContact.
     */
    @EntityGraph(attributePaths = {"assignedContact", "assignedContact.region"})
    List<SosRequest> findAllByOrderByCreatedAtDesc();

    /**
     * Lấy chi tiết 1 SOS request kèm assigned contact để tránh N+1.
     */
    @EntityGraph(attributePaths = {"assignedContact", "assignedContact.region"})
    Optional<SosRequest> findWithContactById(Long id);
}

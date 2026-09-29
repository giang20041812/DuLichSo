package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.PartnerChangeRequest;
import com.dulichso.bookingapi.entity.enums.ChangeRequestStatus;
import com.dulichso.bookingapi.entity.enums.ChangeTargetType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PartnerChangeRequestRepository extends JpaRepository<PartnerChangeRequest, Long>, JpaSpecificationExecutor<PartnerChangeRequest> {

    /** Khóa bản ghi khi duyệt/từ chối/hủy để hai người không xử lý cùng một yêu cầu. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from PartnerChangeRequest c where c.id = :id")
    Optional<PartnerChangeRequest> findByIdForUpdate(@Param("id") Long id);

    /** Yêu cầu đang chờ cùng đối tượng — bị thay thế khi NCC gửi yêu cầu mới. */
    @Query("""
            select c from PartnerChangeRequest c
            where c.status = :status and c.place.id = :placeId and c.targetType = :type
              and ((:targetId is null and c.targetId is null) or c.targetId = :targetId)
              and ((:roomTypeId is null and c.roomTypeId is null) or c.roomTypeId = :roomTypeId)
            """)
    List<PartnerChangeRequest> findOpen(@Param("status") ChangeRequestStatus status, @Param("placeId") Long placeId,
                                        @Param("type") ChangeTargetType type, @Param("targetId") Long targetId,
                                        @Param("roomTypeId") Long roomTypeId);

    long countByStatus(ChangeRequestStatus status);

    /** UC-NCC-02: Homestay đang có yêu cầu xuất bản lần đầu chờ Admin duyệt. */
    @Query("""
            select distinct c.place.id from PartnerChangeRequest c
            where c.status = com.dulichso.bookingapi.entity.enums.ChangeRequestStatus.PENDING
              and c.operation = com.dulichso.bookingapi.entity.enums.ChangeOperation.PUBLISH and c.place.id in :ids
            """)
    List<Long> pendingPublishPlaceIds(@Param("ids") List<Long> ids);
}

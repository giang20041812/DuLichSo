package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {

    List<EmergencyContact> findByIsActiveTrue();

    List<EmergencyContact> findByRegionId(Long regionId);

    List<EmergencyContact> findByRegionIdAndIsActiveTrue(Long regionId);
}

package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegionRepository extends JpaRepository<Region, Long> {

    Optional<Region> findByCode(String code);

    List<Region> findByIsActiveTrue();

    List<Region> findByParentId(Long parentId);
}

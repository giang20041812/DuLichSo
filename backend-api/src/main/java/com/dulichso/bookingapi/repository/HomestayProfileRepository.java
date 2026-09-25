package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.HomestayProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HomestayProfileRepository extends JpaRepository<HomestayProfile, Long> {
    @Override
    @EntityGraph(attributePaths = "currentPolicy")
    Optional<HomestayProfile> findById(Long id);
}

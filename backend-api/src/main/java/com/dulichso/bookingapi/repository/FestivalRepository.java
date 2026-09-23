package com.dulichso.bookingapi.repository;

import com.dulichso.bookingapi.entity.Festival;
import com.dulichso.bookingapi.entity.enums.PlaceVisibility;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FestivalRepository extends JpaRepository<Festival, Long> {

    @EntityGraph(attributePaths = {"occurrences", "region"})
    List<Festival> findByVisibilityAndIsDeletedFalseOrderByIdAsc(PlaceVisibility visibility);

    @EntityGraph(attributePaths = {"occurrences", "region"})
    Optional<Festival> findBySlugAndIsDeletedFalse(String slug);
}

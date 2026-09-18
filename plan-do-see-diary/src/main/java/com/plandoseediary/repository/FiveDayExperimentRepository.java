package com.plandoseediary.repository;

import com.plandoseediary.domain.FiveDayExperiment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FiveDayExperimentRepository
        extends JpaRepository<FiveDayExperiment, Long> {

    Optional<FiveDayExperiment> findByUserUsername(
            String username
    );

    boolean existsByUserUsername(
            String username
    );
}
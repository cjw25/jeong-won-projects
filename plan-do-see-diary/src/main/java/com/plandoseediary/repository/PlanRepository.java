package com.plandoseediary.repository;

import com.plandoseediary.domain.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanRepository
        extends JpaRepository<Plan, Long> {

    List<Plan> findAllByOwnerUsernameOrderByIdAsc(
            String username
    );

    Optional<Plan> findByIdAndOwnerUsername(
            Long id,
            String username
    );
}
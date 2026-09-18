package com.plandoseediary.repository;

import com.plandoseediary.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    Optional<Review> findByPlanId(
            Long planId
    );

    List<Review> findByPlanOwnerUsernameOrderByPlanIdAsc(
            String username
    );
}
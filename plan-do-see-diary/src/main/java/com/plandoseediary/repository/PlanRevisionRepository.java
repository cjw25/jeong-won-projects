package com.plandoseediary.repository;

import com.plandoseediary.domain.PlanRevision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanRevisionRepository extends JpaRepository<PlanRevision, Long> {

    List<PlanRevision> findByPlanIdOrderByRevisionNoAsc(Long planId);

    long countByPlanId(Long planId);
}
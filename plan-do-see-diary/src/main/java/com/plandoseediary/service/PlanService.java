package com.plandoseediary.service;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.PlanRevision;
import com.plandoseediary.repository.PlanRepository;
import com.plandoseediary.repository.PlanRevisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanService {

    private final PlanRepository planRepository;
    private final PlanRevisionRepository planRevisionRepository;

    public Plan createPlan(Plan plan) {
        Plan savedPlan = planRepository.save(plan);

        PlanRevision firstRevision =
                PlanRevision.from(savedPlan, 1);

        planRevisionRepository.save(firstRevision);

        return savedPlan;
    }

    @Transactional(readOnly = true)
    public List<Plan> findAll() {
        return planRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Plan findById(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "계획을 찾을 수 없습니다. id=" + id
                        )
                );
    }

    @Transactional(readOnly = true)
    public List<PlanRevision> findRevisions(Long planId) {
        return planRevisionRepository
                .findByPlanIdOrderByRevisionNoAsc(planId);
    }

    public Plan updatePlan(Long id, Plan changedPlan) {

        Plan originalPlan = findById(id);

        int nextRevisionNo =
                (int) planRevisionRepository.countByPlanId(id) + 1;

        originalPlan.setTitle(changedPlan.getTitle());
        originalPlan.setStartDate(changedPlan.getStartDate());
        originalPlan.setEndDate(changedPlan.getEndDate());
        originalPlan.setPriority(changedPlan.getPriority());
        originalPlan.setSuccessCriteria(changedPlan.getSuccessCriteria());
        originalPlan.setEstimatedMinutes(changedPlan.getEstimatedMinutes());
        originalPlan.setCarriedNote(changedPlan.getCarriedNote());

        Plan savedPlan = planRepository.save(originalPlan);

        PlanRevision revision =
                PlanRevision.from(savedPlan, nextRevisionNo);

        planRevisionRepository.save(revision);

        return savedPlan;
    }
}
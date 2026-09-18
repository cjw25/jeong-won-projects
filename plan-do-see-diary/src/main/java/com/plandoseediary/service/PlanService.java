package com.plandoseediary.service;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.PlanRevision;
import com.plandoseediary.domain.User;
import com.plandoseediary.repository.PlanRepository;
import com.plandoseediary.repository.PlanRevisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanService {

    private final PlanRepository planRepository;
    private final PlanRevisionRepository planRevisionRepository;
    private final CurrentUserService currentUserService;

    public Plan createPlan(Plan plan) {

        User currentUser =
                currentUserService.getCurrentUser();

        plan.setOwner(currentUser);

        Plan savedPlan =
                planRepository.save(plan);

        PlanRevision firstRevision =
                PlanRevision.from(
                        savedPlan,
                        1
                );

        planRevisionRepository.save(
                firstRevision
        );

        return savedPlan;
    }


    @Transactional(readOnly = true)
    public List<Plan> findAll() {

        String username =
                currentUserService
                        .getCurrentUsername();

        return planRepository
                .findAllByOwnerUsernameOrderByIdAsc(
                        username
                );
    }


    @Transactional(readOnly = true)
    public Plan findById(Long id) {

        String username =
                currentUserService
                        .getCurrentUsername();

        return planRepository
                .findByIdAndOwnerUsername(
                        id,
                        username
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "계획을 찾을 수 없습니다."
                        )
                );
    }


    @Transactional(readOnly = true)
    public List<PlanRevision> findRevisions(
            Long planId
    ) {

        /*
         * 먼저 현재 로그인 사용자의
         * 계획인지 확인한다.
         *
         * 남의 계획이면 여기서 404.
         */
        findById(planId);

        return planRevisionRepository
                .findByPlanIdOrderByRevisionNoAsc(
                        planId
                );
    }


    public Plan updatePlan(
            Long id,
            Plan changedPlan
    ) {

        /*
         * findById 자체가
         * 현재 사용자 소유권을 검사한다.
         */
        Plan originalPlan =
                findById(id);

        int nextRevisionNo =
                (int) planRevisionRepository
                        .countByPlanId(id)
                        + 1;

        originalPlan.setTitle(
                changedPlan.getTitle()
        );

        originalPlan.setStartDate(
                changedPlan.getStartDate()
        );

        originalPlan.setEndDate(
                changedPlan.getEndDate()
        );

        originalPlan.setPriority(
                changedPlan.getPriority()
        );

        originalPlan.setSuccessCriteria(
                changedPlan
                        .getSuccessCriteria()
        );

        originalPlan.setEstimatedMinutes(
                changedPlan
                        .getEstimatedMinutes()
        );

        originalPlan.setCarriedNote(
                changedPlan.getCarriedNote()
        );

        /*
         * owner는 수정하지 않는다.
         */

        Plan savedPlan =
                planRepository.save(
                        originalPlan
                );

        PlanRevision revision =
                PlanRevision.from(
                        savedPlan,
                        nextRevisionNo
                );

        planRevisionRepository.save(
                revision
        );

        return savedPlan;
    }
}
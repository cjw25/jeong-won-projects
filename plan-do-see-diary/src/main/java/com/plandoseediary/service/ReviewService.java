package com.plandoseediary.service;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.Review;
import com.plandoseediary.dto.ReviewForm;
import com.plandoseediary.repository.PlanRepository;
import com.plandoseediary.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PlanRepository planRepository;

    public Review save(
            Long planId,
            ReviewForm form
    ) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "계획을 찾을 수 없습니다. id=" + planId
                        )
                );

        Review review = reviewRepository
                .findByPlanId(planId)
                .orElseGet(() -> {
                    Review newReview = new Review();
                    newReview.setPlan(plan);
                    return newReview;
                });

        review.setGoodPoint(form.getGoodPoint());
        review.setGapPoint(form.getGapPoint());
        review.setNextImprovement(form.getNextImprovement());

        return reviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public Optional<Review> findByPlanId(Long planId) {
        return reviewRepository.findByPlanId(planId);
    }

    @Transactional(readOnly = true)
    public Review findRequiredByPlanId(Long planId) {
        return reviewRepository.findByPlanId(planId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "먼저 돌아보기를 작성해야 합니다."
                        )
                );
    }
}
package com.plandoseediary.controller;

import com.plandoseediary.domain.Review;
import com.plandoseediary.dto.ReviewForm;
import com.plandoseediary.service.PlanService;
import com.plandoseediary.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
@RequestMapping("/plans/{planId}/review")
public class ReviewController {

    private final ReviewService reviewService;
    private final PlanService planService;

    @GetMapping
    public String form(
            @PathVariable Long planId,
            Model model
    ) {
        model.addAttribute(
                "plan",
                planService.findById(planId)
        );

        ReviewForm reviewForm =
                reviewService.findByPlanId(planId)
                        .map(ReviewForm::from)
                        .orElseGet(ReviewForm::new);

        model.addAttribute(
                "reviewForm",
                reviewForm
        );

        model.addAttribute(
                "review",
                reviewService.findByPlanId(planId).orElse(null)
        );

        return "reviews/form";
    }

    @PostMapping
    public String save(
            @PathVariable Long planId,
            @Valid @ModelAttribute ReviewForm reviewForm,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {

            model.addAttribute(
                    "plan",
                    planService.findById(planId)
            );

            model.addAttribute(
                    "review",
                    reviewService.findByPlanId(planId).orElse(null)
            );

            return "reviews/form";
        }

        reviewService.save(
                planId,
                reviewForm
        );

        return "redirect:/plans/" + planId + "/review";
    }

    @GetMapping("/next")
    public String nextPlan(
            @PathVariable Long planId,
            RedirectAttributes redirectAttributes
    ) {
        Review review =
                reviewService.findRequiredByPlanId(planId);

        String improvement =
                review.getNextImprovement();

        if (improvement == null
                || improvement.isBlank()) {
            throw new IllegalStateException(
                    "다음 계획으로 보낼 개선점이 없습니다."
            );
        }

        redirectAttributes.addAttribute(
                "carriedNote",
                improvement
        );

        return "redirect:/plans/new";
    }
}
package com.plandoseediary.dto;

import com.plandoseediary.domain.Review;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewForm {

    private String goodPoint;

    private String gapPoint;

    @NotBlank
    private String nextImprovement;

    public static ReviewForm from(Review review) {
        ReviewForm form = new ReviewForm();
        form.setGoodPoint(review.getGoodPoint());
        form.setGapPoint(review.getGapPoint());
        form.setNextImprovement(review.getNextImprovement());
        return form;
    }
}
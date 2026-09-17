package com.plandoseediary.dto;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.Priority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PlanForm {

    @NotBlank
    private String title;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    private Priority priority;

    @NotBlank
    private String successCriteria;

    @NotNull
    @Min(1)
    private Integer estimatedMinutes;

    private String carriedNote;

    public Plan toEntity() {
        Plan plan = new Plan();
        plan.setTitle(title);
        plan.setStartDate(startDate);
        plan.setEndDate(endDate);
        plan.setPriority(priority);
        plan.setSuccessCriteria(successCriteria);
        plan.setEstimatedMinutes(estimatedMinutes);
        plan.setCarriedNote(carriedNote);
        return plan;
    }

    public static PlanForm from(Plan plan) {
        PlanForm form = new PlanForm();
        form.setTitle(plan.getTitle());
        form.setStartDate(plan.getStartDate());
        form.setEndDate(plan.getEndDate());
        form.setPriority(plan.getPriority());
        form.setSuccessCriteria(plan.getSuccessCriteria());
        form.setEstimatedMinutes(plan.getEstimatedMinutes());
        form.setCarriedNote(plan.getCarriedNote());
        return form;
    }
}
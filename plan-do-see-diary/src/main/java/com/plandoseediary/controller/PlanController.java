package com.plandoseediary.controller;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.Priority;
import com.plandoseediary.dto.PlanForm;
import com.plandoseediary.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/plans")
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("plans", planService.findAll());
        return "plans/list";
    }

    @GetMapping("/new")
    public String createForm(
            @RequestParam(required = false) String carriedNote,
            Model model
    ) {
        PlanForm planForm = new PlanForm();

        if (carriedNote != null
                && !carriedNote.isBlank()) {
            planForm.setCarriedNote(carriedNote);
        }

        model.addAttribute(
                "planForm",
                planForm
        );

        model.addAttribute(
                "priorities",
                Priority.values()
        );

        return "plans/form";
    }

    @PostMapping
    public String create(
            @Valid @ModelAttribute PlanForm planForm,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("priorities", Priority.values());
            return "plans/form";
        }

        Plan savedPlan = planService.createPlan(planForm.toEntity());

        return "redirect:/plans/" + savedPlan.getId();
    }

    @GetMapping("/{id}")
    public String detail(
            @PathVariable Long id,
            Model model
    ) {
        model.addAttribute("plan", planService.findById(id));
        model.addAttribute("revisions", planService.findRevisions(id));
        return "plans/detail";
    }

    @GetMapping("/{id}/edit")
    public String editForm(
            @PathVariable Long id,
            Model model
    ) {
        Plan plan = planService.findById(id);

        model.addAttribute("plan", plan);
        model.addAttribute("planForm", PlanForm.from(plan));
        model.addAttribute("priorities", Priority.values());

        return "plans/edit";
    }

    @PostMapping("/{id}")
    public String update(
            @PathVariable Long id,
            @Valid @ModelAttribute PlanForm planForm,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("plan", planService.findById(id));
            model.addAttribute("priorities", Priority.values());
            return "plans/edit";
        }

        planService.updatePlan(id, planForm.toEntity());

        return "redirect:/plans/" + id;
    }
}
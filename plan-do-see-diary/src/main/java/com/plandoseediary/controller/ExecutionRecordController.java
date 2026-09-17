package com.plandoseediary.controller;

import com.plandoseediary.domain.Todo;
import com.plandoseediary.dto.ExecutionRecordForm;
import com.plandoseediary.service.ExecutionRecordService;
import com.plandoseediary.service.PlanService;
import com.plandoseediary.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/plans/{planId}/todos/{todoId}/executions")
public class ExecutionRecordController {

    private final ExecutionRecordService executionRecordService;
    private final TodoService todoService;
    private final PlanService planService;

    @GetMapping
    public String list(
            @PathVariable Long planId,
            @PathVariable Long todoId,
            Model model
    ) {
        Todo todo = todoService.findById(todoId);

        model.addAttribute("plan", planService.findById(planId));
        model.addAttribute("todo", todo);
        model.addAttribute(
                "records",
                executionRecordService.findByTodo(todoId)
        );

        return "executions/list";
    }

    @GetMapping("/new")
    public String createForm(
            @PathVariable Long planId,
            @PathVariable Long todoId,
            Model model
    ) {
        model.addAttribute("plan", planService.findById(planId));
        model.addAttribute("todo", todoService.findById(todoId));
        model.addAttribute(
                "executionRecordForm",
                new ExecutionRecordForm()
        );

        return "executions/form";
    }

    @PostMapping
    public String create(
            @PathVariable Long planId,
            @PathVariable Long todoId,
            @Valid @ModelAttribute ExecutionRecordForm executionRecordForm,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("plan", planService.findById(planId));
            model.addAttribute("todo", todoService.findById(todoId));

            return "executions/form";
        }

        try {
            executionRecordService.create(
                    todoId,
                    executionRecordForm.getStartedAt(),
                    executionRecordForm.getEndedAt(),
                    executionRecordForm.getBlockedReason()
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            model.addAttribute("plan", planService.findById(planId));
            model.addAttribute("todo", todoService.findById(todoId));
            model.addAttribute("recordError", e.getMessage());

            return "executions/form";
        }

        return "redirect:/plans/"
                + planId
                + "/todos/"
                + todoId
                + "/executions";
    }
}
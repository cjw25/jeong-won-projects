package com.plandoseediary.controller;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.Priority;
import com.plandoseediary.domain.Todo;
import com.plandoseediary.dto.TodoForm;
import com.plandoseediary.service.PlanService;
import com.plandoseediary.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@RequestMapping("/plans/{planId}/todos")
public class TodoController {

    private final TodoService todoService;
    private final PlanService planService;

    @GetMapping
    public String list(
            @PathVariable Long planId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String tag,
            Model model
    ) {
        Plan plan = planService.findById(planId);

        List<Todo> todos;

        if (keyword != null && !keyword.isBlank()) {
            todos = todoService.search(planId, keyword);
        } else if ("completed".equals(status)) {
            todos = todoService.filterByCompleted(planId, true);
        } else if ("progress".equals(status)) {
            todos = todoService.filterByCompleted(planId, false);
        } else if (priority != null) {
            todos = todoService.filterByPriority(planId, priority);
        } else if (tag != null && !tag.isBlank()) {
            todos = todoService.filterByTag(planId, tag);
        } else {
            todos = todoService.findAllByPlan(planId);
        }

        model.addAttribute("plan", plan);
        model.addAttribute("todos", todos);
        model.addAttribute("priorities", Priority.values());

        model.addAttribute("keyword", keyword);
        model.addAttribute("status", status);
        model.addAttribute("selectedPriority", priority);
        model.addAttribute("tag", tag);

        Map<Long, String> completionKeys = new HashMap<>();

        for (Todo todo : todos) {
            if (!todo.isCompleted()) {
                completionKeys.put(
                        todo.getId(),
                        UUID.randomUUID().toString()
                );
            }
        }

        model.addAttribute(
                "completionKeys",
                completionKeys
        );

        return "todos/list";
    }

    @GetMapping("/new")
    public String createForm(
            @PathVariable Long planId,
            Model model
    ) {
        model.addAttribute("plan", planService.findById(planId));
        model.addAttribute("todoForm", new TodoForm());
        model.addAttribute("priorities", Priority.values());

        return "todos/form";
    }

    @PostMapping
    public String create(
            @PathVariable Long planId,
            @Valid @ModelAttribute TodoForm todoForm,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("plan", planService.findById(planId));
            model.addAttribute("priorities", Priority.values());

            return "todos/form";
        }

        todoService.createTodo(
                planId,
                todoForm.getContent(),
                todoForm.getDueDate(),
                todoForm.getPriority(),
                todoForm.getTag(),
                todoForm.getEstimatedMinutes()
        );

        return "redirect:/plans/" + planId + "/todos";
    }

    @GetMapping("/{todoId}/edit")
    public String editForm(
            @PathVariable Long planId,
            @PathVariable Long todoId,
            Model model
    ) {
        Todo todo = todoService.findById(todoId);

        model.addAttribute("plan", planService.findById(planId));
        model.addAttribute("todo", todo);
        model.addAttribute("todoForm", TodoForm.from(todo));
        model.addAttribute("priorities", Priority.values());

        return "todos/edit";
    }

    @PostMapping("/{todoId}")
    public String update(
            @PathVariable Long planId,
            @PathVariable Long todoId,
            @Valid @ModelAttribute TodoForm todoForm,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("plan", planService.findById(planId));
            model.addAttribute("todo", todoService.findById(todoId));
            model.addAttribute("priorities", Priority.values());

            return "todos/edit";
        }

        todoService.updateTodo(
                todoId,
                todoForm.getContent(),
                todoForm.getDueDate(),
                todoForm.getPriority(),
                todoForm.getTag(),
                todoForm.getEstimatedMinutes()
        );

        return "redirect:/plans/" + planId + "/todos";
    }

    @PostMapping("/{todoId}/complete")
    public String complete(
            @PathVariable Long planId,
            @PathVariable Long todoId,
            @RequestParam String requestKey
    ) {
        todoService.completeTodo(todoId, requestKey);

        return "redirect:/plans/" + planId + "/todos";
    }

    @PostMapping("/{todoId}/reopen")
    public String reopen(
            @PathVariable Long planId,
            @PathVariable Long todoId
    ) {
        todoService.reopenTodo(todoId);

        return "redirect:/plans/" + planId + "/todos";
    }

    @PostMapping("/{todoId}/delete")
    public String delete(
            @PathVariable Long planId,
            @PathVariable Long todoId
    ) {
        todoService.deleteTodo(todoId);

        return "redirect:/plans/" + planId + "/todos";
    }
}
package com.plandoseediary.controller;

import com.plandoseediary.dto.SeeSummary;
import com.plandoseediary.service.PlanService;
import com.plandoseediary.service.SeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/plans/{planId}/see")
public class SeeController {

    private final SeeService seeService;
    private final PlanService planService;

    @GetMapping
    public String see(
            @PathVariable Long planId,
            Model model
    ) {
        SeeSummary summary =
                seeService.getSummary(planId);

        model.addAttribute(
                "plan",
                planService.findById(planId)
        );

        model.addAttribute(
                "summary",
                summary
        );

        return "see/detail";
    }

    @GetMapping("/items")
    public String items(
            @PathVariable Long planId,
            @RequestParam String type,
            Model model
    ) {
        model.addAttribute(
                "plan",
                planService.findById(planId)
        );

        model.addAttribute(
                "type",
                type
        );

        model.addAttribute(
                "title",
                getTitle(type)
        );

        model.addAttribute(
                "todos",
                seeService.getTodoSources(
                        planId,
                        type
                )
        );

        model.addAttribute(
                "records",
                seeService.getExecutionSources(
                        planId,
                        type
                )
        );

        return "see/items";
    }

    private String getTitle(String type) {

        return switch (type) {
            case "all" -> "전체 할 일의 원본 기록";
            case "completed" -> "완료 집계의 원본 기록";
            case "overdue" -> "기한 초과 집계의 원본 기록";
            case "blocked" -> "막힌 할 일 집계의 원본 기록";
            case "expected" -> "예상 시간의 원본 기록";
            case "actual" -> "실제 시간의 원본 기록";
            case "difference" -> "시간 차이의 원본 기록";

            default ->
                    throw new IllegalArgumentException(
                            "지원하지 않는 집계 유형입니다: " + type
                    );
        };
    }
}
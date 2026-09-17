package com.plandoseediary.controller;

import com.plandoseediary.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final PlanService planService;

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("plans", planService.findAll());
        return "home";
    }
}
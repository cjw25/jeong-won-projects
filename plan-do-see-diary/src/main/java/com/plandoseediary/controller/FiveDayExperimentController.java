package com.plandoseediary.controller;

import com.plandoseediary.dto.FiveDayExperimentForm;
import com.plandoseediary.dto.FiveDayRecordForm;
import com.plandoseediary.dto.RuleChangeForm;
import com.plandoseediary.service.FiveDayExperimentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/five-day")
public class FiveDayExperimentController {

    private final FiveDayExperimentService experimentService;


    @GetMapping
    public String dashboard(
            @RequestParam(required = false) String saved,
            @RequestParam(required = false) String ruleChanged,
            Model model
    ) {

        if (
                experimentService
                        .findCurrentOptional()
                        .isEmpty()
        ) {

            return "redirect:/five-day/setup";
        }


        model.addAttribute(
                "experiment",
                experimentService.findCurrent()
        );

        model.addAttribute(
                "records",
                experimentService.findCurrentRecords()
        );

        model.addAttribute(
                "recordCount",
                experimentService.countCurrentRecords()
        );

        model.addAttribute(
                "stats",
                experimentService.getStats()
        );

        model.addAttribute(
                "today",
                experimentService.today()
        );

        model.addAttribute(
                "hasTodayRecord",
                experimentService.hasTodayRecord()
        );

        model.addAttribute(
                "canRecordToday",
                experimentService.canRecordToday()
        );

        model.addAttribute(
                "mustChangeRule",
                experimentService.mustChangeRule()
        );

        model.addAttribute(
                "canChangeRule",
                experimentService.canChangeRule()
        );


        if (saved != null) {

            model.addAttribute(
                    "savedMessage",
                    "오늘 기록이 저장되었습니다."
            );
        }


        if (ruleChanged != null) {

            model.addAttribute(
                    "ruleChangedMessage",
                    "계획 규칙이 변경되었습니다. 이제 3일차 기록부터 새 규칙을 사용합니다."
            );
        }


        return "five-day/dashboard";
    }


    @GetMapping("/setup")
    public String setupForm(
            Model model
    ) {

        if (
                experimentService
                        .findCurrentOptional()
                        .isPresent()
        ) {

            return "redirect:/five-day";
        }


        model.addAttribute(
                "fiveDayExperimentForm",
                experimentService.createDefaultForm()
        );


        return "five-day/setup";
    }


    @PostMapping("/setup")
    public String setup(
            @Valid
            @ModelAttribute("fiveDayExperimentForm")
            FiveDayExperimentForm form,

            BindingResult bindingResult,

            Model model
    ) {

        if (bindingResult.hasErrors()) {

            return "five-day/setup";
        }


        try {

            experimentService.create(
                    form
            );

        } catch (IllegalStateException e) {

            model.addAttribute(
                    "setupError",
                    e.getMessage()
            );

            return "five-day/setup";
        }


        return "redirect:/five-day";
    }


    @GetMapping("/records/new")
    public String recordForm(
            Model model
    ) {

        if (
                experimentService
                        .mustChangeRule()
        ) {

            return "redirect:/five-day/rule-change";
        }


        if (
                !experimentService
                        .canRecordToday()
        ) {

            return "redirect:/five-day";
        }


        model.addAttribute(
                "fiveDayRecordForm",
                new FiveDayRecordForm()
        );

        model.addAttribute(
                "experiment",
                experimentService.findCurrent()
        );

        model.addAttribute(
                "today",
                experimentService.today()
        );

        model.addAttribute(
                "dayNumber",
                experimentService.nextDayNumber()
        );


        return "five-day/record";
    }


    @PostMapping("/records")
    public String saveRecord(
            @Valid
            @ModelAttribute("fiveDayRecordForm")
            FiveDayRecordForm form,

            BindingResult bindingResult,

            Model model
    ) {

        if (bindingResult.hasErrors()) {

            model.addAttribute(
                    "experiment",
                    experimentService.findCurrent()
            );

            model.addAttribute(
                    "today",
                    experimentService.today()
            );

            model.addAttribute(
                    "dayNumber",
                    experimentService.nextDayNumber()
            );

            return "five-day/record";
        }


        try {

            experimentService.createRecord(
                    form
            );

        } catch (IllegalStateException e) {

            model.addAttribute(
                    "recordError",
                    e.getMessage()
            );

            model.addAttribute(
                    "experiment",
                    experimentService.findCurrent()
            );

            model.addAttribute(
                    "today",
                    experimentService.today()
            );

            model.addAttribute(
                    "dayNumber",
                    experimentService.nextDayNumber()
            );

            return "five-day/record";
        }


        return "redirect:/five-day?saved";
    }


    @GetMapping("/rule-change")
    public String ruleChangeForm(
            Model model
    ) {

        if (
                !experimentService
                        .canChangeRule()
        ) {

            return "redirect:/five-day";
        }


        RuleChangeForm form =
                new RuleChangeForm();


        form.setChangedPlanRule(
                "하루 시작 전에 오늘 할 일을 최대 2개까지 정한다."
        );


        model.addAttribute(
                "ruleChangeForm",
                form
        );

        model.addAttribute(
                "experiment",
                experimentService.findCurrent()
        );

        model.addAttribute(
                "records",
                experimentService.findCurrentRecords()
        );


        return "five-day/rule-change";
    }


    @PostMapping("/rule-change")
    public String changeRule(
            @Valid
            @ModelAttribute("ruleChangeForm")
            RuleChangeForm form,

            BindingResult bindingResult,

            Model model
    ) {

        if (bindingResult.hasErrors()) {

            model.addAttribute(
                    "experiment",
                    experimentService.findCurrent()
            );

            model.addAttribute(
                    "records",
                    experimentService.findCurrentRecords()
            );

            return "five-day/rule-change";
        }


        try {

            experimentService.changeRule(
                    form
            );

        } catch (
                IllegalStateException
                | IllegalArgumentException e
        ) {

            model.addAttribute(
                    "ruleChangeError",
                    e.getMessage()
            );

            model.addAttribute(
                    "experiment",
                    experimentService.findCurrent()
            );

            model.addAttribute(
                    "records",
                    experimentService.findCurrentRecords()
            );

            return "five-day/rule-change";
        }


        return "redirect:/five-day?ruleChanged";
    }
}
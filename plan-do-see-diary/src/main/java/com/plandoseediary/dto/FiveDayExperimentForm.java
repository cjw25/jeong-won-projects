package com.plandoseediary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FiveDayExperimentForm {

    @NotBlank(message = "질문을 입력해주세요.")
    @Size(max = 500)
    private String question;

    @NotBlank(message = "관찰 지표를 입력해주세요.")
    @Size(max = 100)
    private String metricName;

    @NotBlank(message = "단위를 입력해주세요.")
    @Size(max = 50)
    private String unit;

    @NotBlank(message = "계산 규칙을 입력해주세요.")
    @Size(max = 1000)
    private String calculationRule;

    @NotBlank(message = "최초 계획 규칙을 입력해주세요.")
    @Size(max = 1000)
    private String originalPlanRule;

    @NotBlank(message = "빠진 값 처리 규칙을 입력해주세요.")
    @Size(max = 1000)
    private String missingValueRule;

    @NotBlank(message = "중복 값 처리 규칙을 입력해주세요.")
    @Size(max = 1000)
    private String duplicateValueRule;

    @NotBlank(message = "이상치 처리 규칙을 입력해주세요.")
    @Size(max = 1000)
    private String outlierRule;

    @NotBlank(message = "반올림 규칙을 입력해주세요.")
    @Size(max = 500)
    private String roundingRule;

    @NotBlank(message = "주 시작 요일을 입력해주세요.")
    @Size(max = 20)
    private String weekStart;
}
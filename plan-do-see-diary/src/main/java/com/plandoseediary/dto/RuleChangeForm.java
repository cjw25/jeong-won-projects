package com.plandoseediary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RuleChangeForm {

    @NotBlank(message = "변경할 계획 규칙을 입력해주세요.")
    @Size(max = 1000)
    private String changedPlanRule;

    @NotBlank(message = "규칙을 바꾸는 이유를 입력해주세요.")
    @Size(max = 1000)
    private String reason;
}
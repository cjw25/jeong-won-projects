package com.plandoseediary.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FiveDayRecordForm {

    @NotNull(message = "실제 집중 시간을 입력해주세요.")
    @PositiveOrZero(message = "집중 시간은 0분 이상이어야 합니다.")
    private Integer metricValue;

    @Size(
            max = 1000,
            message = "기록은 1000자 이하로 입력해주세요."
    )
    private String note;
}
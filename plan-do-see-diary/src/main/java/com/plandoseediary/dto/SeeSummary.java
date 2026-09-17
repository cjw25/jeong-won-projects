package com.plandoseediary.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SeeSummary {

    private Long planId;

    private long taskCount;

    private long completedCount;

    private long overdueCount;

    private long blockedCount;

    private long expectedMinutes;

    private long actualMinutes;

    private long differenceMinutes;
}
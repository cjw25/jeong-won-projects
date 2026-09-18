package com.plandoseediary.dto;

public record FiveDayStats(

        long totalMinutes,
        long averageMinutes,

        long beforeTotalMinutes,
        long beforeAverageMinutes,
        int beforeCount,

        long afterTotalMinutes,
        long afterAverageMinutes,
        int afterCount
) {
}
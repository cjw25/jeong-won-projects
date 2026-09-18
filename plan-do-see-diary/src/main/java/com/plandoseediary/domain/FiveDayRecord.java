package com.plandoseediary.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "five_day_records",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_five_day_record_date",
                        columnNames = {
                                "experiment_id",
                                "record_date"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class FiveDayRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "experiment_id",
            nullable = false
    )
    private FiveDayExperiment experiment;


    /*
     * C07
     * 실제 서로 다른 날짜
     */
    @Column(
            name = "record_date",
            nullable = false
    )
    private LocalDate recordDate;


    /*
     * 동일 지표:
     * 하루 실제 집중 시간
     *
     * 단위:
     * 분
     */
    @Column(
            name = "metric_value",
            nullable = false
    )
    private Integer metricValue;


    /*
     * 그날의 간단한 기록
     */
    @Column(
            length = 1000
    )
    private String note;


    /*
     * 이 기록 당시 실제 적용 중이던 계획 규칙을
     * 스냅샷으로 보존한다.
     *
     * 1~2일차 = originalPlanRule
     * 3~5일차 = changedPlanRule
     */
    @Column(
            name = "applied_plan_rule",
            nullable = false,
            length = 1000
    )
    private String appliedPlanRule;


    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;


    @PrePersist
    public void prePersist() {

        createdAt =
                LocalDateTime.now();
    }
}
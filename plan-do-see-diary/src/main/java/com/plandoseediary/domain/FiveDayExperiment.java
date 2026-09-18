package com.plandoseediary.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "five_day_experiments",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_five_day_experiment_user",
                        columnNames = "user_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class FiveDayExperiment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;

    @Column(
            nullable = false,
            length = 500
    )
    private String question;

    @Column(
            name = "metric_name",
            nullable = false,
            length = 100
    )
    private String metricName;

    @Column(
            nullable = false,
            length = 50
    )
    private String unit;

    @Column(
            name = "calculation_rule",
            nullable = false,
            length = 1000
    )
    private String calculationRule;

    @Column(
            name = "original_plan_rule",
            nullable = false,
            length = 1000
    )
    private String originalPlanRule;

    @Column(
            name = "changed_plan_rule",
            length = 1000
    )
    private String changedPlanRule;

    @Column(
            name = "rule_changed_at"
    )
    private LocalDateTime ruleChangedAt;

    @Column(
            name = "rule_change_reason",
            length = 1000
    )
    private String ruleChangeReason;

    /*
     * C12
     * 규칙 변경이 DAY 1 기록 뒤라는 근거
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "rule_change_after_record1_id"
    )
    private FiveDayRecord ruleChangeAfterRecord1;

    /*
     * C12
     * 규칙 변경이 DAY 2 기록 뒤라는 근거
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "rule_change_after_record2_id"
    )
    private FiveDayRecord ruleChangeAfterRecord2;

    @Column(
            name = "missing_value_rule",
            nullable = false,
            length = 1000
    )
    private String missingValueRule;

    @Column(
            name = "duplicate_value_rule",
            nullable = false,
            length = 1000
    )
    private String duplicateValueRule;

    @Column(
            name = "outlier_rule",
            nullable = false,
            length = 1000
    )
    private String outlierRule;

    @Column(
            name = "rounding_rule",
            nullable = false,
            length = 500
    )
    private String roundingRule;

    @Column(
            name = "week_start",
            nullable = false,
            length = 20
    )
    private String weekStart;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public boolean isRuleChanged() {
        return ruleChangedAt != null;
    }
}
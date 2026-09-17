package com.plandoseediary.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "plan_revisions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_plan_revision",
                        columnNames = {"plan_id", "revision_no"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class PlanRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @Column(name = "revision_no", nullable = false)
    private Integer revisionNo;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority;

    @Column(name = "success_criteria", nullable = false, length = 1000)
    private String successCriteria;

    @Column(name = "estimated_minutes", nullable = false)
    private Integer estimatedMinutes;

    @Column(name = "carried_note", length = 1000)
    private String carriedNote;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    public void prePersist() {
        this.recordedAt = LocalDateTime.now();
    }

    public static PlanRevision from(Plan plan, int revisionNo) {
        PlanRevision revision = new PlanRevision();

        revision.setPlan(plan);
        revision.setRevisionNo(revisionNo);
        revision.setTitle(plan.getTitle());
        revision.setStartDate(plan.getStartDate());
        revision.setEndDate(plan.getEndDate());
        revision.setPriority(plan.getPriority());
        revision.setSuccessCriteria(plan.getSuccessCriteria());
        revision.setEstimatedMinutes(plan.getEstimatedMinutes());
        revision.setCarriedNote(plan.getCarriedNote());

        return revision;
    }
}
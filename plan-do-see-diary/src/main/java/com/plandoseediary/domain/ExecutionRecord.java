package com.plandoseediary.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Table(name = "execution_records")
@Getter
@Setter
@NoArgsConstructor
public class ExecutionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "todo_id", nullable = false)
    private Todo todo;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at", nullable = false)
    private LocalDateTime endedAt;

    @Column(name = "actual_minutes", nullable = false)
    private Integer actualMinutes;

    @Column(name = "blocked_reason", length = 1000)
    private String blockedReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void calculateActualMinutes() {

        if (startedAt == null || endedAt == null) {
            throw new IllegalStateException(
                    "시작 시각과 종료 시각이 모두 필요합니다."
            );
        }

        if (endedAt.isBefore(startedAt)) {
            throw new IllegalArgumentException(
                    "종료 시각은 시작 시각보다 빠를 수 없습니다."
            );
        }

        long minutes =
                Duration.between(startedAt, endedAt).toMinutes();

        this.actualMinutes = Math.toIntExact(minutes);
    }
}
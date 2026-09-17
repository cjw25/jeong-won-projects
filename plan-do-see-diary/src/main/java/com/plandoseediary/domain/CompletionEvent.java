package com.plandoseediary.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "completion_events",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_completion_request_key",
                        columnNames = "request_key"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class CompletionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "todo_id", nullable = false)
    private Todo todo;

    @Column(
            name = "request_key",
            nullable = false,
            unique = true,
            length = 100
    )
    private String requestKey;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        LocalDateTime now = LocalDateTime.now();

        if (completedAt == null) {
            completedAt = now;
        }

        createdAt = now;
    }
}
package com.plandoseediary.repository;

import com.plandoseediary.domain.Priority;
import com.plandoseediary.domain.Todo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TodoRepository
        extends JpaRepository<Todo, Long> {

    Optional<Todo> findByIdAndPlanIdAndPlanOwnerUsername(
            Long id,
            Long planId,
            String username
    );

    List<Todo> findByPlanIdAndPlanOwnerUsernameAndDeletedFalse(
            Long planId,
            String username
    );

    List<Todo> findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndCompleted(
            Long planId,
            String username,
            boolean completed
    );

    List<Todo> findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndPriority(
            Long planId,
            String username,
            Priority priority
    );

    List<Todo> findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndTagContainingIgnoreCase(
            Long planId,
            String username,
            String tag
    );

    List<Todo> findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndContentContainingIgnoreCase(
            Long planId,
            String username,
            String keyword
    );

    List<Todo> findByPlanOwnerUsernameOrderByIdAsc(
            String username
    );
}
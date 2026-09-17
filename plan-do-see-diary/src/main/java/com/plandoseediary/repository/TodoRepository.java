package com.plandoseediary.repository;

import com.plandoseediary.domain.Priority;
import com.plandoseediary.domain.Todo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Long> {

    List<Todo> findByPlanIdAndDeletedFalse(Long planId);

    List<Todo> findByPlanIdAndDeletedFalseAndCompleted(
            Long planId,
            boolean completed
    );

    List<Todo> findByPlanIdAndDeletedFalseAndPriority(
            Long planId,
            Priority priority
    );

    List<Todo> findByPlanIdAndDeletedFalseAndTagContainingIgnoreCase(
            Long planId,
            String tag
    );

    List<Todo> findByPlanIdAndDeletedFalseAndContentContainingIgnoreCase(
            Long planId,
            String keyword
    );
}
package com.plandoseediary.repository;

import com.plandoseediary.domain.CompletionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompletionEventRepository
        extends JpaRepository<CompletionEvent, Long> {

    @Modifying
    @Query(
            value = """
                    INSERT IGNORE INTO completion_events
                    (todo_id, request_key, completed_at, created_at)
                    VALUES (:todoId, :requestKey, NOW(), NOW())
                    """,
            nativeQuery = true
    )
    int insertIfAbsent(
            @Param("todoId") Long todoId,
            @Param("requestKey") String requestKey
    );

    List<CompletionEvent> findByTodoIdOrderByCompletedAtDesc(
            Long todoId
    );

    long countByTodoId(
            Long todoId
    );

    List<CompletionEvent>
    findByTodoPlanOwnerUsernameOrderByCompletedAtAsc(
            String username
    );
}
package com.plandoseediary.repository;

import com.plandoseediary.domain.ExecutionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExecutionRecordRepository
        extends JpaRepository<ExecutionRecord, Long> {

    List<ExecutionRecord> findByTodoIdOrderByStartedAtDesc(
            Long todoId
    );

    @Query("""
            SELECT e
            FROM ExecutionRecord e
            JOIN FETCH e.todo t
            WHERE t.plan.id = :planId
              AND t.deleted = false
            ORDER BY e.startedAt ASC
            """)
    List<ExecutionRecord> findActiveRecordsByPlanId(
            @Param("planId") Long planId
    );

    List<ExecutionRecord>
    findByTodoPlanOwnerUsernameOrderByStartedAtAsc(
            String username
    );
}
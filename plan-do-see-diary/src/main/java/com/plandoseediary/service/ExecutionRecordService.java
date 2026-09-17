package com.plandoseediary.service;

import com.plandoseediary.domain.ExecutionRecord;
import com.plandoseediary.domain.Todo;
import com.plandoseediary.repository.ExecutionRecordRepository;
import com.plandoseediary.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExecutionRecordService {

    private final ExecutionRecordRepository executionRecordRepository;
    private final TodoRepository todoRepository;

    public ExecutionRecord create(
            Long todoId,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            String blockedReason
    ) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "할 일을 찾을 수 없습니다. id=" + todoId
                        )
                );

        if (todo.isDeleted()) {
            throw new IllegalStateException(
                    "삭제된 할 일에는 실행 기록을 남길 수 없습니다."
            );
        }

        ExecutionRecord record = new ExecutionRecord();

        record.setTodo(todo);
        record.setStartedAt(startedAt);
        record.setEndedAt(endedAt);
        record.setBlockedReason(blockedReason);

        record.calculateActualMinutes();

        return executionRecordRepository.save(record);
    }

    @Transactional(readOnly = true)
    public List<ExecutionRecord> findByTodo(Long todoId) {
        return executionRecordRepository
                .findByTodoIdOrderByStartedAtDesc(todoId);
    }
}
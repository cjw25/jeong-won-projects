package com.plandoseediary.service;

import com.plandoseediary.domain.ExecutionRecord;
import com.plandoseediary.domain.Todo;
import com.plandoseediary.repository.ExecutionRecordRepository;
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
    private final TodoService todoService;


    public ExecutionRecord create(
            Long planId,
            Long todoId,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            String blockedReason
    ) {

        /*
         * 현재 로그인 사용자의 Plan 안에 있는 Todo인지 검사.
         * 남의 Todo이거나 planId와 todoId 조합이 틀리면 404.
         */
        Todo todo =
                todoService.findById(
                        planId,
                        todoId
                );

        if (todo.isDeleted()) {
            throw new IllegalStateException(
                    "삭제된 할 일에는 실행 기록을 남길 수 없습니다."
            );
        }

        ExecutionRecord record =
                new ExecutionRecord();

        record.setTodo(todo);
        record.setStartedAt(startedAt);
        record.setEndedAt(endedAt);
        record.setBlockedReason(blockedReason);

        record.calculateActualMinutes();

        return executionRecordRepository.save(record);
    }


    @Transactional(readOnly = true)
    public List<ExecutionRecord> findByTodo(
            Long planId,
            Long todoId
    ) {

        Todo todo =
                todoService.findById(
                        planId,
                        todoId
                );

        return executionRecordRepository
                .findByTodoIdOrderByStartedAtDesc(
                        todo.getId()
                );
    }
}
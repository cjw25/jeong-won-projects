package com.plandoseediary.service;

import com.plandoseediary.domain.ExecutionRecord;
import com.plandoseediary.domain.Todo;
import com.plandoseediary.dto.SeeSummary;
import com.plandoseediary.repository.ExecutionRecordRepository;
import com.plandoseediary.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeeService {

    private static final ZoneId SEOUL_ZONE =
            ZoneId.of("Asia/Seoul");

    private final TodoRepository todoRepository;
    private final ExecutionRecordRepository executionRecordRepository;

    private final PlanService planService;
    private final CurrentUserService currentUserService;


    public SeeSummary getSummary(
            Long planId
    ) {

        /*
         * 현재 로그인 사용자의 계획인지 먼저 검사.
         * 남의 planId라면 404.
         */
        planService.findById(planId);

        String username =
                currentUserService
                        .getCurrentUsername();


        List<Todo> todos =
                todoRepository
                        .findByPlanIdAndPlanOwnerUsernameAndDeletedFalse(
                                planId,
                                username
                        );


        /*
         * planService에서 소유권 검사를 이미 했으므로
         * 이 planId에 속한 실행기록만 집계한다.
         */
        List<ExecutionRecord> executionRecords =
                executionRecordRepository
                        .findActiveRecordsByPlanId(
                                planId
                        );


        LocalDate today =
                LocalDate.now(
                        SEOUL_ZONE
                );


        long taskCount =
                todos.size();


        long completedCount =
                todos.stream()
                        .filter(Todo::isCompleted)
                        .count();


        long overdueCount =
                todos.stream()
                        .filter(todo ->
                                !todo.isCompleted()
                        )
                        .filter(todo ->
                                todo.getDueDate()
                                        .isBefore(today)
                        )
                        .count();


        long expectedMinutes =
                todos.stream()
                        .map(
                                Todo::getEstimatedMinutes
                        )
                        .filter(
                                value -> value != null
                        )
                        .mapToLong(
                                Integer::longValue
                        )
                        .sum();


        long actualMinutes =
                executionRecords.stream()
                        .map(
                                ExecutionRecord::getActualMinutes
                        )
                        .filter(
                                value -> value != null
                        )
                        .mapToLong(
                                Integer::longValue
                        )
                        .sum();


        Set<Long> blockedTodoIds =
                new HashSet<>();


        for (
                ExecutionRecord record
                : executionRecords
        ) {

            String blockedReason =
                    record.getBlockedReason();

            if (
                    blockedReason != null
                            && !blockedReason.isBlank()
            ) {

                blockedTodoIds.add(
                        record
                                .getTodo()
                                .getId()
                );
            }
        }


        long blockedCount =
                blockedTodoIds.size();


        long differenceMinutes =
                actualMinutes
                        - expectedMinutes;


        return new SeeSummary(
                planId,
                taskCount,
                completedCount,
                overdueCount,
                blockedCount,
                expectedMinutes,
                actualMinutes,
                differenceMinutes
        );
    }


    public List<Todo> getTodoSources(
            Long planId,
            String type
    ) {

        /*
         * 남의 See 화면 직접 접근 차단
         */
        planService.findById(planId);

        String username =
                currentUserService
                        .getCurrentUsername();


        List<Todo> todos =
                todoRepository
                        .findByPlanIdAndPlanOwnerUsernameAndDeletedFalse(
                                planId,
                                username
                        );


        LocalDate today =
                LocalDate.now(
                        SEOUL_ZONE
                );


        return switch (type) {

            case "all",
                 "expected",
                 "difference" ->
                    todos;


            case "completed" ->
                    todos.stream()
                            .filter(
                                    Todo::isCompleted
                            )
                            .toList();


            case "overdue" ->
                    todos.stream()
                            .filter(todo ->
                                    !todo.isCompleted()
                            )
                            .filter(todo ->
                                    todo.getDueDate()
                                            .isBefore(today)
                            )
                            .toList();


            case "blocked" -> {

                List<ExecutionRecord> records =
                        executionRecordRepository
                                .findActiveRecordsByPlanId(
                                        planId
                                );


                Set<Long> blockedIds =
                        new HashSet<>();


                for (
                        ExecutionRecord record
                        : records
                ) {

                    String reason =
                            record.getBlockedReason();

                    if (
                            reason != null
                                    && !reason.isBlank()
                    ) {

                        blockedIds.add(
                                record
                                        .getTodo()
                                        .getId()
                        );
                    }
                }


                yield todos.stream()
                        .filter(todo ->
                                blockedIds.contains(
                                        todo.getId()
                                )
                        )
                        .toList();
            }


            case "actual" ->
                    List.of();


            default ->
                    throw new IllegalArgumentException(
                            "지원하지 않는 집계 유형입니다: "
                                    + type
                    );
        };
    }


    public List<ExecutionRecord> getExecutionSources(
            Long planId,
            String type
    ) {

        /*
         * 현재 사용자의 Plan인지 확인
         */
        planService.findById(planId);


        List<ExecutionRecord> records =
                executionRecordRepository
                        .findActiveRecordsByPlanId(
                                planId
                        );


        return switch (type) {

            case "actual",
                 "difference" ->
                    records;


            case "blocked" ->
                    records.stream()
                            .filter(record ->
                                    record.getBlockedReason()
                                            != null
                            )
                            .filter(record ->
                                    !record
                                            .getBlockedReason()
                                            .isBlank()
                            )
                            .toList();


            case "all",
                 "completed",
                 "overdue",
                 "expected" ->
                    List.of();


            default ->
                    throw new IllegalArgumentException(
                            "지원하지 않는 집계 유형입니다: "
                                    + type
                    );
        };
    }
}
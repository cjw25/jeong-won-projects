package com.plandoseediary.service;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.Priority;
import com.plandoseediary.domain.Todo;
import com.plandoseediary.repository.CompletionEventRepository;
import com.plandoseediary.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TodoService {

    private final TodoRepository todoRepository;
    private final CompletionEventRepository completionEventRepository;
    private final PlanService planService;
    private final CurrentUserService currentUserService;

    private final Comparator<Todo> todoComparator =
            Comparator
                    .comparing(Todo::isCompleted)
                    .thenComparing(
                            Todo::getPriority,
                            Comparator.comparingInt(this::priorityOrder)
                    )
                    .thenComparing(Todo::getDueDate)
                    .thenComparing(Todo::getId);


    private int priorityOrder(Priority priority) {

        return switch (priority) {

            case HIGH -> 0;
            case MEDIUM -> 1;
            case LOW -> 2;
        };
    }


    public Todo createTodo(
            Long planId,
            String content,
            LocalDate dueDate,
            Priority priority,
            String tag,
            Integer estimatedMinutes
    ) {

        /*
         * 현재 로그인 사용자의 계획인지 먼저 확인.
         * 남의 계획이면 404.
         */
        Plan plan =
                planService.findById(planId);

        Todo todo =
                new Todo();

        todo.setPlan(plan);
        todo.setContent(content);
        todo.setDueDate(dueDate);
        todo.setPriority(priority);
        todo.setTag(tag);
        todo.setEstimatedMinutes(estimatedMinutes);
        todo.setCompleted(false);
        todo.setDeleted(false);

        return todoRepository.save(todo);
    }


    @Transactional(readOnly = true)
    public Todo findById(
            Long planId,
            Long todoId
    ) {

        String username =
                currentUserService
                        .getCurrentUsername();

        return todoRepository
                .findByIdAndPlanIdAndPlanOwnerUsername(
                        todoId,
                        planId,
                        username
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "할 일을 찾을 수 없습니다."
                        )
                );
    }


    @Transactional(readOnly = true)
    public List<Todo> findAllByPlan(
            Long planId
    ) {

        planService.findById(planId);

        String username =
                currentUserService
                        .getCurrentUsername();

        return todoRepository
                .findByPlanIdAndPlanOwnerUsernameAndDeletedFalse(
                        planId,
                        username
                )
                .stream()
                .sorted(todoComparator)
                .toList();
    }


    public Todo updateTodo(
            Long planId,
            Long todoId,
            String content,
            LocalDate dueDate,
            Priority priority,
            String tag,
            Integer estimatedMinutes
    ) {

        Todo todo =
                findById(
                        planId,
                        todoId
                );

        if (todo.isDeleted()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND
            );
        }

        todo.setContent(content);
        todo.setDueDate(dueDate);
        todo.setPriority(priority);
        todo.setTag(tag);
        todo.setEstimatedMinutes(
                estimatedMinutes
        );

        return todoRepository.save(todo);
    }


    public Todo completeTodo(
            Long planId,
            Long todoId,
            String requestKey
    ) {

        Todo todo =
                findById(
                        planId,
                        todoId
                );

        if (todo.isDeleted()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND
            );
        }

        int inserted =
                completionEventRepository
                        .insertIfAbsent(
                                todoId,
                                requestKey
                        );

        if (inserted == 1) {

            todo.setCompleted(true);

            todoRepository.save(todo);
        }

        return todo;
    }


    public Todo reopenTodo(
            Long planId,
            Long todoId
    ) {

        Todo todo =
                findById(
                        planId,
                        todoId
                );

        if (todo.isDeleted()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND
            );
        }

        todo.setCompleted(false);

        return todoRepository.save(todo);
    }


    public void deleteTodo(
            Long planId,
            Long todoId
    ) {

        Todo todo =
                findById(
                        planId,
                        todoId
                );

        todo.setDeleted(true);

        todoRepository.save(todo);
    }


    @Transactional(readOnly = true)
    public long countCompletionEvents(
            Long planId,
            Long todoId
    ) {

        Todo todo =
                findById(
                        planId,
                        todoId
                );

        return completionEventRepository
                .countByTodoId(
                        todo.getId()
                );
    }


    @Transactional(readOnly = true)
    public List<Todo> search(
            Long planId,
            String keyword
    ) {

        planService.findById(planId);

        String username =
                currentUserService
                        .getCurrentUsername();

        return todoRepository
                .findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndContentContainingIgnoreCase(
                        planId,
                        username,
                        keyword
                )
                .stream()
                .sorted(todoComparator)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<Todo> filterByCompleted(
            Long planId,
            boolean completed
    ) {

        planService.findById(planId);

        String username =
                currentUserService
                        .getCurrentUsername();

        return todoRepository
                .findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndCompleted(
                        planId,
                        username,
                        completed
                )
                .stream()
                .sorted(todoComparator)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<Todo> filterByPriority(
            Long planId,
            Priority priority
    ) {

        planService.findById(planId);

        String username =
                currentUserService
                        .getCurrentUsername();

        return todoRepository
                .findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndPriority(
                        planId,
                        username,
                        priority
                )
                .stream()
                .sorted(todoComparator)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<Todo> filterByTag(
            Long planId,
            String tag
    ) {

        planService.findById(planId);

        String username =
                currentUserService
                        .getCurrentUsername();

        return todoRepository
                .findByPlanIdAndPlanOwnerUsernameAndDeletedFalseAndTagContainingIgnoreCase(
                        planId,
                        username,
                        tag
                )
                .stream()
                .sorted(todoComparator)
                .toList();
    }
}
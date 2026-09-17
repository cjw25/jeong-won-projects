package com.plandoseediary.service;

import com.plandoseediary.domain.Plan;
import com.plandoseediary.domain.Priority;
import com.plandoseediary.domain.Todo;
import com.plandoseediary.repository.CompletionEventRepository;
import com.plandoseediary.repository.PlanRepository;
import com.plandoseediary.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TodoService {

    private final TodoRepository todoRepository;
    private final PlanRepository planRepository;
    private final CompletionEventRepository completionEventRepository;

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
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "계획을 찾을 수 없습니다. id=" + planId
                        )
                );

        Todo todo = new Todo();

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
    public Todo findById(Long todoId) {
        return todoRepository.findById(todoId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "할 일을 찾을 수 없습니다. id=" + todoId
                        )
                );
    }

    @Transactional(readOnly = true)
    public List<Todo> findAllByPlan(Long planId) {
        return todoRepository
                .findByPlanIdAndDeletedFalse(planId)
                .stream()
                .sorted(todoComparator)
                .toList();
    }

    public Todo updateTodo(
            Long todoId,
            String content,
            LocalDate dueDate,
            Priority priority,
            String tag,
            Integer estimatedMinutes
    ) {
        Todo todo = findById(todoId);

        if (todo.isDeleted()) {
            throw new IllegalStateException(
                    "삭제된 할 일은 수정할 수 없습니다."
            );
        }

        todo.setContent(content);
        todo.setDueDate(dueDate);
        todo.setPriority(priority);
        todo.setTag(tag);
        todo.setEstimatedMinutes(estimatedMinutes);

        return todoRepository.save(todo);
    }

    public Todo completeTodo(
            Long todoId,
            String requestKey
    ) {
        Todo todo = findById(todoId);

        if (todo.isDeleted()) {
            throw new IllegalStateException(
                    "삭제된 할 일은 완료 처리할 수 없습니다."
            );
        }

        int inserted =
                completionEventRepository.insertIfAbsent(
                        todoId,
                        requestKey
                );

        /*
         * 같은 requestKey가 이미 존재하면 inserted == 0.
         * 즉 연속 요청이 다시 들어와도 완료 기록은 추가되지 않는다.
         */
        if (inserted == 1) {
            todo.setCompleted(true);
            todoRepository.save(todo);
        }

        return todo;
    }

    public Todo reopenTodo(Long todoId) {
        Todo todo = findById(todoId);

        if (todo.isDeleted()) {
            throw new IllegalStateException(
                    "삭제된 할 일은 되돌릴 수 없습니다."
            );
        }

        todo.setCompleted(false);

        return todoRepository.save(todo);
    }

    public void deleteTodo(Long todoId) {
        Todo todo = findById(todoId);

        todo.setDeleted(true);

        todoRepository.save(todo);
    }

    @Transactional(readOnly = true)
    public long countCompletionEvents(Long todoId) {
        return completionEventRepository.countByTodoId(todoId);
    }

    @Transactional(readOnly = true)
    public List<Todo> search(
            Long planId,
            String keyword
    ) {
        return todoRepository
                .findByPlanIdAndDeletedFalseAndContentContainingIgnoreCase(
                        planId,
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
        return todoRepository
                .findByPlanIdAndDeletedFalseAndCompleted(
                        planId,
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
        return todoRepository
                .findByPlanIdAndDeletedFalseAndPriority(
                        planId,
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
        return todoRepository
                .findByPlanIdAndDeletedFalseAndTagContainingIgnoreCase(
                        planId,
                        tag
                )
                .stream()
                .sorted(todoComparator)
                .toList();
    }
}
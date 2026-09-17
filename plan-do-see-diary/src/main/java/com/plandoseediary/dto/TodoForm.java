package com.plandoseediary.dto;

import com.plandoseediary.domain.Priority;
import com.plandoseediary.domain.Todo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TodoForm {

    @NotBlank
    private String content;

    @NotNull
    private LocalDate dueDate;

    @NotNull
    private Priority priority;

    @NotBlank
    private String tag;

    @NotNull
    @Min(1)
    private Integer estimatedMinutes;

    public static TodoForm from(Todo todo) {
        TodoForm form = new TodoForm();
        form.setContent(todo.getContent());
        form.setDueDate(todo.getDueDate());
        form.setPriority(todo.getPriority());
        form.setTag(todo.getTag());
        form.setEstimatedMinutes(todo.getEstimatedMinutes());
        return form;
    }
}
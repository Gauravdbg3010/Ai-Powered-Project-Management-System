package com.taskflow.task;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateTaskRequest {
    @NotBlank @Size(min = 2, max = 300)
    private String title;

    @Size(max = 5000)
    private String description;

    private Task.Status status = Task.Status.TODO;
    private Task.Priority priority = Task.Priority.MEDIUM;

    @Min(0) @Max(100)
    private int progress = 0;

    private LocalDate dueDate;
    private Long assigneeId;
}

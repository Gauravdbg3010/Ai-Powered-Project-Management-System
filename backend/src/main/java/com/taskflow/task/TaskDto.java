package com.taskflow.task;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private int progress;
    private LocalDate dueDate;
    private Long projectId;
    private String projectName;
    private Long assigneeId;
    private String assigneeName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

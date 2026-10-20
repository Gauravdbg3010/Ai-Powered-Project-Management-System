package com.taskflow.project;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long managerId;
    private String managerName;
    private boolean archived;
    private int taskCount;
    private int completedTaskCount;
    private int progressPercent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

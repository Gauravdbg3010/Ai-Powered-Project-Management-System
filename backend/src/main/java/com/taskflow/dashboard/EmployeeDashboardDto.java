package com.taskflow.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class EmployeeDashboardDto {
    private long totalAssigned;
    private long completedTasks;
    private long overdueTasks;
    private long inProgressTasks;
    private long blockedTasks;
    private Map<String, Long> tasksByStatus;
    private List<TaskSummary> dueSoonTasks;
    private List<TaskSummary> overdueSummary;

    @Getter @Builder
    public static class TaskSummary {
        private Long id;
        private String title;
        private String status;
        private String priority;
        private String dueDate;
        private String projectName;
    }
}

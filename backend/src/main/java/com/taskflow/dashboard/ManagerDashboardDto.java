package com.taskflow.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ManagerDashboardDto {
    private long activeProjects;
    private long totalTasks;
    private long completedTasks;
    private long overdueTasks;
    private long blockedTasks;
    private List<ProjectSummary> projectSummaries;
    private List<UpcomingDeadline> upcomingDeadlines;
    private List<RecentActivity> recentActivities;

    @Getter @Builder
    public static class ProjectSummary {
        private Long id;
        private String name;
        private String status;
        private int progressPercent;
        private long totalTasks;
        private long completedTasks;
        private long overdueTasks;
        private boolean highRisk;
    }

    @Getter @Builder
    public static class UpcomingDeadline {
        private Long taskId;
        private String taskTitle;
        private Long projectId;
        private String projectName;
        private String dueDate;
        private String priority;
    }

    @Getter @Builder
    public static class RecentActivity {
        private Long taskId;
        private String taskTitle;
        private String actorName;
        private String action;
        private String oldValue;
        private String newValue;
        private String timestamp;
    }
}

package com.taskflow.dashboard;

import com.taskflow.activity.TaskActivity;
import com.taskflow.activity.TaskActivityRepository;
import com.taskflow.project.Project;
import com.taskflow.project.ProjectRepository;
import com.taskflow.task.Task;
import com.taskflow.task.TaskRepository;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskActivityRepository activityRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    @Transactional(readOnly = true)
    public ManagerDashboardDto getManagerDashboard(String managerEmail) {
        User manager = findUserByEmail(managerEmail);
        List<Project> projects = projectRepository.findByManagerId(manager.getId());

        long activeProjects = projects.stream()
                .filter(p -> p.getStatus() == Project.Status.ACTIVE).count();

        List<Task> allTasks = projects.stream()
                .flatMap(p -> taskRepository.findByProjectId(p.getId()).stream())
                .toList();

        LocalDate today = LocalDate.now();
        long overdueTasks = allTasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today)
                        && t.getStatus() != Task.Status.COMPLETED).count();

        long blockedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == Task.Status.BLOCKED).count();

        long completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == Task.Status.COMPLETED).count();

        List<ManagerDashboardDto.ProjectSummary> summaries = projects.stream()
                .map(p -> buildProjectSummary(p, today))
                .toList();

        LocalDate soon = today.plusDays(7);
        List<ManagerDashboardDto.UpcomingDeadline> deadlines = projects.stream()
                .flatMap(p -> taskRepository.findUpcomingDeadlines(p.getId(), today, soon).stream()
                        .map(t -> ManagerDashboardDto.UpcomingDeadline.builder()
                                .taskId(t.getId())
                                .taskTitle(t.getTitle())
                                .projectId(p.getId())
                                .projectName(p.getName())
                                .dueDate(t.getDueDate() != null ? t.getDueDate().format(FORMATTER) : null)
                                .priority(t.getPriority().name())
                                .build()))
                .toList();

        List<ManagerDashboardDto.RecentActivity> recentActivities = projects.stream()
                .flatMap(p -> activityRepository.findTop10ByTaskProjectIdOrderByCreatedAtDesc(p.getId()).stream())
                .sorted(Comparator.comparing(TaskActivity::getCreatedAt).reversed())
                .limit(10)
                .map(a -> ManagerDashboardDto.RecentActivity.builder()
                        .taskId(a.getTask().getId())
                        .taskTitle(a.getTask().getTitle())
                        .actorName(a.getActor().getName())
                        .action(a.getAction())
                        .oldValue(a.getOldValue())
                        .newValue(a.getNewValue())
                        .timestamp(a.getCreatedAt().toString())
                        .build())
                .toList();

        return ManagerDashboardDto.builder()
                .activeProjects(activeProjects)
                .totalTasks(allTasks.size())
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .blockedTasks(blockedTasks)
                .projectSummaries(summaries)
                .upcomingDeadlines(deadlines)
                .recentActivities(recentActivities)
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeDashboardDto getEmployeeDashboard(String email) {
        User employee = findUserByEmail(email);
        List<Task> myTasks = taskRepository.findByAssigneeId(employee.getId());
        LocalDate today = LocalDate.now();
        LocalDate soon = today.plusDays(7);

        Map<String, Long> byStatus = myTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));

        long overdue = myTasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today)
                        && t.getStatus() != Task.Status.COMPLETED).count();

        List<EmployeeDashboardDto.TaskSummary> dueSoon = myTasks.stream()
                .filter(t -> t.getDueDate() != null
                        && !t.getDueDate().isBefore(today)
                        && !t.getDueDate().isAfter(soon)
                        && t.getStatus() != Task.Status.COMPLETED)
                .map(this::toTaskSummary).toList();

        List<EmployeeDashboardDto.TaskSummary> overdueSummary = myTasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today)
                        && t.getStatus() != Task.Status.COMPLETED)
                .map(this::toTaskSummary).toList();

        return EmployeeDashboardDto.builder()
                .totalAssigned(myTasks.size())
                .completedTasks(byStatus.getOrDefault("COMPLETED", 0L))
                .overdueTasks(overdue)
                .inProgressTasks(byStatus.getOrDefault("IN_PROGRESS", 0L))
                .blockedTasks(byStatus.getOrDefault("BLOCKED", 0L))
                .tasksByStatus(byStatus)
                .dueSoonTasks(dueSoon)
                .overdueSummary(overdueSummary)
                .build();
    }

    private ManagerDashboardDto.ProjectSummary buildProjectSummary(Project project, LocalDate today) {
        List<Task> tasks = taskRepository.findByProjectId(project.getId());
        long total = tasks.size();
        long completed = tasks.stream().filter(t -> t.getStatus() == Task.Status.COMPLETED).count();
        long overdue = tasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today)
                        && t.getStatus() != Task.Status.COMPLETED).count();
        long blocked = tasks.stream().filter(t -> t.getStatus() == Task.Status.BLOCKED).count();
        long critical = tasks.stream()
                .filter(t -> t.getPriority() == Task.Priority.CRITICAL
                        && t.getStatus() != Task.Status.COMPLETED).count();

        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);

        // High risk: >20% overdue OR has blocked tasks OR has unresolved critical tasks near deadline
        boolean highRisk = (total > 0 && overdue * 100 / total > 20) || blocked > 0 || critical > 0;

        return ManagerDashboardDto.ProjectSummary.builder()
                .id(project.getId())
                .name(project.getName())
                .status(project.getStatus().name())
                .progressPercent(progress)
                .totalTasks(total)
                .completedTasks(completed)
                .overdueTasks(overdue)
                .highRisk(highRisk)
                .build();
    }

    private EmployeeDashboardDto.TaskSummary toTaskSummary(Task t) {
        return EmployeeDashboardDto.TaskSummary.builder()
                .id(t.getId())
                .title(t.getTitle())
                .status(t.getStatus().name())
                .priority(t.getPriority().name())
                .dueDate(t.getDueDate() != null ? t.getDueDate().format(FORMATTER) : null)
                .projectName(t.getProject().getName())
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }
}

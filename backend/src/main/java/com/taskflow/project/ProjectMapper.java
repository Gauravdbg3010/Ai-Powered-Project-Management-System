package com.taskflow.project;

import com.taskflow.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProjectMapper {

    private final TaskRepository taskRepository;

    public ProjectDto toDto(Project project) {
        long total = taskRepository.countByProjectId(project.getId());
        long completed = taskRepository.countByProjectIdAndStatus(project.getId(),
                com.taskflow.task.Task.Status.COMPLETED);
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);

        return ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus().name())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .managerId(project.getManager().getId())
                .managerName(project.getManager().getName())
                .archived(project.isArchived())
                .taskCount((int) total)
                .completedTaskCount((int) completed)
                .progressPercent(progress)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
